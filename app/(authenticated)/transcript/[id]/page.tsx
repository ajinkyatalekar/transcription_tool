"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useParams, useRouter } from "next/navigation";
import { useRecordings } from "@/app/context/RecordingsContext";
import { AudioPlayer } from "@/components/audioPlayer";

export default function TranscriptPage() {
  const { id } = useParams();
  const router = useRouter();

  const { recordings } = useRecordings();

  const recording = recordings.find((recording) => recording.id === id);

  if (!recording) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Recording not found</h2>
          <p className="text-muted-foreground">
            The recording you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="block">
              <BreadcrumbLink
                onClick={() => router.push("/home")}
                className="cursor-pointer"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{recording?.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-semibold">
            {recording.title}
          </p>
          <p className="text-muted-foreground text-sm">
            {recording.description || "No description"}
          </p>
          <p className="text-muted-foreground text-sm">
            Created: {new Date(recording.created_at).toLocaleString()}
          </p>
        </div>
        <div className="mt-4"/>
        <p>{recording.transcript}</p>
      </main>

      {/* Audio Player - Fixed at bottom */}
      <footer className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {recording.audio_url ? (
            <AudioPlayer
              audioUrl={recording.audio_url}
            />
          ) : (
            <div className="flex items-center justify-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">
                No audio available for this recording
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
