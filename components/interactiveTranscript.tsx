"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

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
  onTranscriptUpdate?: (updatedTranscript: TranscriptData) => void;
}

export function InteractiveTranscript({
  transcript,
  currentTime,
  onSeek,
  onTranscriptUpdate,
}: InteractiveTranscriptProps) {
  const [hoveredWord, setHoveredWord] = useState<Word | null>(null);
  const [activeWords, setActiveWords] = useState<Word[]>([]);
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Find all currently active words based on currentTime
  useEffect(() => {
    if (!transcript.raw_response?.transcription?.segments) return;

    const segments = transcript.raw_response.transcription.segments;
    const foundWords: Word[] = [];

    for (const segment of segments) {
      for (const word of segment.words) {
        if (currentTime >= word.start && currentTime <= word.end) {
          foundWords.push(word);
        }
      }
    }

    setActiveWords(foundWords);
  }, [currentTime, transcript]);

  const handleWordClick = (word: Word) => {
    onSeek(word.start+0.01);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const startEditing = (segment: Segment) => {
    setEditingSegmentId(segment.id);
    setEditingText(segment.text);
  };

  const cancelEditing = () => {
    setEditingSegmentId(null);
    setEditingText("");
  };

  const saveSegment = async (segment: Segment) => {
    if (!transcript.raw_response?.transcription?.segments) return;

    setIsSaving(true);
    try {
      // Create a deep copy of the transcript
      const updatedTranscript = JSON.parse(JSON.stringify(transcript));
      const segments = updatedTranscript.raw_response.transcription.segments;

      // Find and update the segment
      const segmentIndex = segments.findIndex(
        (s: Segment) => s.id === segment.id
      );
      if (segmentIndex !== -1) {
        segments[segmentIndex].text = editingText;

        // Split the edited text into words and create new segments
        const editedWords = editingText
          .split(/\s+/)
          .filter((word) => word.length > 0);
        const originalWords = segments[segmentIndex].words;

        if (editedWords.length > 0) {
          // Calculate timing for each new word
          const segmentDuration =
            segments[segmentIndex].end - segments[segmentIndex].start;
          const wordDuration = segmentDuration / editedWords.length;

          // Create new words with proper timing
          const newWords = editedWords.map((wordText, index) => {
            const wordStart =
              segments[segmentIndex].start + index * wordDuration;
            const wordEnd =
              segments[segmentIndex].start + (index + 1) * wordDuration;

            return {
              text: wordText,
              start: wordStart,
              end: wordEnd,
              confidence: segments[segmentIndex].confidence || 0,
            };
          });

          // Update the segment's words array
          segments[segmentIndex].words = newWords;
        }

        // Update the full text by concatenating all segments
        updatedTranscript.raw_response.transcription.text = segments
          .map((s: Segment) => s.text)
          .join(" ");

        updatedTranscript.text =
          updatedTranscript.raw_response.transcription.text;

        // Update local state through context
        if (onTranscriptUpdate) {
          onTranscriptUpdate(updatedTranscript);
        }

        toast.success("Transcript updated successfully");
        setEditingSegmentId(null);
        setEditingText("");
      }
    } catch (error) {
      console.error("Error updating transcript:", error);
      toast.error("Failed to update transcript");
    } finally {
      setIsSaving(false);
    }
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
      {segments.map((segment) => {
        const isEditing = editingSegmentId === segment.id;

        return (
          <div key={segment.id} className="space-y-3">
            <div className="flex items-start gap-2 group">
              {isEditing ? (
                <div className="flex-1">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={Math.max(1, Math.ceil(editingText.length / 50))}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveSegment(segment)}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 flex flex-wrap gap-1 leading-relaxed">
                    {segment.words.map((word, wordIndex) => {
                      const isActive = activeWords.includes(word);
                      const isHovered = hoveredWord === word;
                      const isFirstWord = wordIndex === 0;
                      const showTimestampByDefault =
                        isFirstWord || (wordIndex + 1) % 10 === 0;

                      return (
                        <span
                          key={`${segment.id}-${wordIndex}`}
                          className={cn(
                            "group relative inline-block cursor-pointer px-1 py-[5px] rounded transition-all duration-200",
                            "hover:bg-primary/10 hover:text-primary font-light",
                            isActive &&
                              "bg-primary/20 text-primary shadow-sm",
                            isHovered && "bg-primary/10"
                          )}
                          onClick={() => handleWordClick(word)}
                          onMouseEnter={() => setHoveredWord(word)}
                          onMouseLeave={() => setHoveredWord(null)}
                        >
                          {word.text}
                          <span
                            className={cn(
                              "absolute -bottom-3 left-0 text-xs text-muted-foreground transition-opacity whitespace-nowrap",
                              showTimestampByDefault
                                ? "opacity-100"
                                : "opacity-0"
                              // : "opacity-0 group-hover:opacity-100"
                            )}
                          >
                            {formatTime(word.start)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => startEditing(segment)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    title="Edit segment"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground cursor-pointer" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
