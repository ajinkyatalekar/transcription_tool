"use client";

import { useRecordings } from "../../context/RecordingsContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { UploadAudioDialog } from "@/components/uploadAudioDialog";
import { RecordAudioDialog } from "@/components/recordAudioDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { recordings, loading, refetch } = useRecordings();
  const router = useRouter();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Content */}
      <div className="p-4 flex flex-col gap-4">
        <div className="flex gap-4 mb-4">
          <RecordAudioDialog />
          <UploadAudioDialog />
        </div>

        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Transcript History</h1>
          <RefreshCcw
            onClick={refetch}
            className="w-4 h-4 cursor-pointer ml-2 mt-[2px]"
          />
        </div>

        {loading ? (
          <Skeleton className="w-full h-80" />
        ) : recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-600">
              No Transcripts Found
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Get started by adding your first recording
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => router.push(`/transcript/${recording.id}`)}
              >
                <h3 className="font-semibold">{recording.title}</h3>
                <p className="text-sm text-gray-500">
                  {recording.transcript?.slice(0, 50)}
                  {recording.transcript?.length &&
                    recording.transcript?.length > 50 &&
                    "..."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
