"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { supabase } from "@/app/utils/supabase";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  audioBlob?: Blob | null;
}

export function AudioPlayer({
  audioUrl,
  title,
  audioBlob: providedAudioBlob,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(
    providedAudioBlob || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Download audio from Supabase storage (only if no audioBlob is provided)
  useEffect(() => {
    // If audioBlob is already provided, set it up
    if (providedAudioBlob) {
      setAudioBlob(providedAudioBlob);
      const objectUrl = URL.createObjectURL(providedAudioBlob);
      if (audioRef.current) {
        audioRef.current.src = objectUrl;
        audioRef.current.load();
        audioRef.current.onerror = () => {
          console.error("Error loading audio file");
          toast.error("Failed to load audio file");
        };
      }
      return;
    }
  }, [audioUrl, providedAudioBlob]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (
        !isNaN(audio.duration) &&
        audio.duration > 0 &&
        isFinite(audio.duration)
      ) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlay = () => {
      updateDuration();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      toast.error("Failed to play audio");
    }
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading && !providedAudioBlob) {
    return (
      <Skeleton className="w-full h-10" />
    );
  }

  return (
    <div className="w-full p-4 border rounded-lg bg-background">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={async () => {
          const audio = audioRef.current;
          if (!audio) return;
        
          if (isFinite(audio.duration)) {
            setDuration(audio.duration);
          } else {
            // Trick: seek to a huge time to force the browser to compute the duration
            const setRealDuration = () => {
              setDuration(audio.duration);
              audio.currentTime = 0; // reset back
              audio.removeEventListener("timeupdate", setRealDuration);
            };
        
            audio.currentTime = 1e10; // big number
            audio.addEventListener("timeupdate", setRealDuration);
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          disabled={!audioBlob && !providedAudioBlob}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={restart}
          disabled={!audioBlob && !providedAudioBlob}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground min-w-[2.5rem]">
            {formatTime(currentTime)}
          </span>

          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer relative z-10"
              disabled={(!audioBlob && !providedAudioBlob) || duration === 0}
            />
            {/* <div
              className="absolute top-0 left-0 h-2 bg-primary rounded-lg pointer-events-none opacity-50 z-0"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            /> */}
          </div>

          <span className="text-xs text-muted-foreground min-w-[2.5rem]">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
