"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useRecordings } from "@/app/context/RecordingsContext";
import { toast } from "sonner";

export function UploadAudioDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refetch } = useRecordings();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith("audio/")) {
        toast.error("Please select an audio file");
        return;
      }

      setSelectedFile(file);
      // Set default title to filename without extension
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(fileName);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // Get auth token
      const {
        data: { session },
      } = await import("@/app/utils/supabase").then((m) =>
        m.supabase.auth.getSession()
      );
      const token = session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      // Call the transcribe API
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          audioBase64: base64,
          title: title.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const result = await response.json();

      console.log(result);

      await refetch();

      toast.success("Audio uploaded and transcribed successfully!");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload audio"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex-1 h-20" variant="outline">
          <Upload className="w-4 h-4" />
          Upload Audio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Audio File</DialogTitle>
          <DialogDescription>
            Select an audio file to transcribe. The file will be processed and
            added to your transcript history.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="audio-file">Audio File</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            {selectedFile && (
              <p className="text-sm text-gray-500">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your recording"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload & Transcribe"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
