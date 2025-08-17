import { useState } from "react";
import { useRecordings } from "@/app/context/RecordingsContext";
import { toast } from "sonner";
import { supabase } from "@/app/utils/supabase";
import { v4 as uuidv4 } from 'uuid';

interface UseUploadAudioReturn {
  uploadAudio: (selectedFile: File, title: string) => Promise<void>;
  isUploading: boolean;
}

const uploadFile = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('audio')
    .upload(`${(await supabase.auth.getUser()).data.user?.id}/${uuidv4()}`, file);

  if (error) {
    console.error('Error uploading file:', error.message);
    throw error;
  } else {
    console.log('File uploaded successfully:', data);
    return data.path;
  }
};

export function useTranscribe(): UseUploadAudioReturn {
  const [isUploading, setIsUploading] = useState(false);
  const { refetch } = useRecordings();

  const uploadAudio = async (selectedFile: File, title: string) => {
    if (!selectedFile || !title.trim()) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setIsUploading(true);
    try {
      const path = await uploadFile(selectedFile);

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

      // Call the transcribe API with only the bucket path
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          audioUrl: path,
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
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        "Something went wrong. Please try again later."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadAudio,
    isUploading,
  };
}
