"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Word {
  end: number;
  text: string;
  start: number;
  confidence: number;
}

interface Segment {
  id: number;
  end: number;
  seek: number;
  text: string;
  start: number;
  words: Word[];
  tokens: number[];
  confidence: number;
  avg_logprob: number;
  temperature: number;
  no_speech_prob: number;
  compression_ratio: number;
}

interface Transcription {
  text: string;
  language: string;
  segments: Segment[];
}

interface TranscriptData {
  text: string;
  language: string | null;
  segments: Segment[] | null;
  timestamp: string;
  confidence: number | null;
  raw_response: {
    success: boolean;
    transcription: Transcription;
  };
}

interface InteractiveTranscriptProps {
  transcript: TranscriptData;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function InteractiveTranscript({
  transcript,
  currentTime,
  onSeek,
}: InteractiveTranscriptProps) {
  const [hoveredWord, setHoveredWord] = useState<Word | null>(null);
  const [activeWord, setActiveWord] = useState<Word | null>(null);

  // Find the currently active word based on currentTime
  useEffect(() => {
    if (!transcript.raw_response?.transcription?.segments) return;

    const segments = transcript.raw_response.transcription.segments;
    let foundWord: Word | null = null;

    for (const segment of segments) {
      for (const word of segment.words) {
        if (currentTime >= word.start && currentTime <= word.end) {
          foundWord = word;
          break;
        }
      }
      if (foundWord) break;
    }

    setActiveWord(foundWord);
  }, [currentTime, transcript]);

  const handleWordClick = (word: Word) => {
    onSeek(word.start);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!transcript.raw_response?.transcription?.segments) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No transcript data available
      </div>
    );
  }

  const segments = transcript.raw_response.transcription.segments;

  return (
    <div className="space-y-6">
      {segments.map((segment) => (
        <div key={segment.id} className="space-y-3">
          <div className="flex flex-wrap gap-1 leading-relaxed">
            {segment.words.map((word, wordIndex) => {
              const isActive = activeWord === word;
              const isHovered = hoveredWord === word;
              const isFirstWord = wordIndex === 0;
              const showTimestampByDefault =
                isFirstWord || (wordIndex + 1) % 10 === 0;

              return (
                <span
                  key={`${segment.id}-${wordIndex}`}
                  className={cn(
                    "group relative inline-block cursor-pointer px-1 py-0.5 rounded transition-all duration-200",
                    "hover:bg-primary/10 hover:text-primary",
                    isActive &&
                      "bg-primary/20 text-primary font-medium shadow-sm",
                    isHovered && "bg-primary/10"
                  )}
                  onClick={() => handleWordClick(word)}
                  onMouseEnter={() => setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  {word.text}
                  <span
                    className={cn(
                      "absolute -bottom-6 left-0 text-xs text-muted-foreground transition-opacity whitespace-nowrap",
                      showTimestampByDefault
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {formatTime(word.start)}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
