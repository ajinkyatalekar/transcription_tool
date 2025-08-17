/* eslint-disable */
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
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/app/utils/supabase";
import { toast } from "sonner";
import { EditIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ProjectSettingsDialog } from "@/components/projectSettingsDialog";
import { InteractiveTranscript } from "@/components/interactiveTranscript";

export default function TranscriptPage() {
  const { id } = useParams();
  const router = useRouter();
  const { recordings, updateRecording } = useRecordings();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const recording = recordings.find((recording) => recording.id === id);

  // Download audio from Supabase storage
  useEffect(() => {
    const currentAudio = audioRef.current;

    const downloadAudio = async () => {
      if (!recording?.audio_url) {
        return;
      }

      try {
        // Extract the file path from the audio_url
        const { data, error } = await supabase.storage
          .from("audio")
          .download(recording.audio_url);

        if (error) {
          throw error;
        }

        if (data) {
          setAudioBlob(data);
          // Create object URL for the audio
          const objectUrl = URL.createObjectURL(data);
          if (currentAudio) {
            currentAudio.src = objectUrl;
            // Load the audio metadata
            currentAudio.load();

            // Add error handling for audio loading
            currentAudio.onerror = () => {
              console.error("Error loading audio file");
              toast.error("Failed to load audio file");
            };
          }
        }
      } catch (error) {
        console.error("Error downloading audio:", error);
        toast.error("Failed to load audio file");
      }
    };

    downloadAudio();

    // Cleanup function to revoke object URL
    return () => {
      if (currentAudio && currentAudio.src) {
        URL.revokeObjectURL(currentAudio.src);
      }
    };
  }, [recording?.audio_url]);

  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (recording?.transcript) {
      console.log(recording.transcript);
    }
  }, [recording?.transcript]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    // Actually seek the audio element
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  if (!recording) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Recording not found</h2>
          <p className="text-muted-foreground">
            The recording you&apos;re looking for doesn&apos;t exist.
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

      <main className="flex-1 overflow-auto p-6 mb-40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold">{recording.title}</p>
            <ProjectSettingsDialog recording={recording}>
              <Button variant="outline">
                <EditIcon className="w-4 h-4" />
                Project Settings
              </Button>
            </ProjectSettingsDialog>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>{recording.description || "No description"}</span>
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            <span>Created {formatDate(recording.created_at)}</span>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="mt-4" />

        {/* Interactive Transcript */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transcript</h3>
          {recording.transcript ? (
            <InteractiveTranscript
              transcript={recording.transcript as any}
              currentTime={currentTime}
              onSeek={handleSeek}
              onTranscriptUpdate={(updatedTranscript) => {
                // Update the recording in the context
                if (recording) {
                  updateRecording(recording.id, {
                    transcript: updatedTranscript as any,
                  });
                }
              }}
            />
          ) : (
            <p className="text-muted-foreground">No transcript available</p>
          )}
        </div>
      </main>

      {/* Audio Player - Fixed at bottom */}
      <footer className="border-t bg-background p-4 fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] md:group-data-[state=collapsed]:left-[var(--sidebar-width-icon)]">
        <div className="max-w-4xl mx-auto">
          {recording.audio_url ? (
            <AudioPlayer
              audioUrl={recording.audio_url}
              audioBlob={audioBlob}
              onSeek={handleSeek}
              onTimeUpdate={handleTimeUpdate}
              audioRef={audioRef}
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
