"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "../utils/supabase";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { Database } from "@/database.types";

type Recording = Database["public"]["Tables"]["recordings"]["Row"];

interface RecordingsContextType {
  recordings: Recording[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addRecording: (recording: Partial<Recording>) => Promise<void>;
  updateRecording: (id: string, updates: Partial<Recording>) => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
}

interface RecordingsProviderProps {
  children: ReactNode;
}

const RecordingsContext = createContext<RecordingsContextType | undefined>(
  undefined
);

export const RecordingsProvider: React.FC<RecordingsProviderProps> = ({
  children,
}) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("recordings")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setRecordings(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch recordings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addRecording = async (recording: Partial<Recording>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("recordings")
        .insert(recording)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setRecordings((prev) => [data, ...prev]);
      toast.success("Recording added successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add recording";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateRecording = async (id: string, updates: Partial<Recording>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from("recordings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setRecordings((prev) =>
        prev.map((recording) =>
          recording.id === id ? { ...recording, ...data } : recording
        )
      );
      toast.success("Recording updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update recording";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from("recordings")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setRecordings((prev) => prev.filter((recording) => recording.id !== id));
      toast.success("Recording deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete recording";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (user) {
      fetchRecordings();
    }
  }, [user]);

  const value: RecordingsContextType = {
    recordings,
    loading,
    error,
    refetch: fetchRecordings,
    addRecording,
    updateRecording,
    deleteRecording,
  };

  return (
    <RecordingsContext.Provider value={value}>
      {children}
    </RecordingsContext.Provider>
  );
};

export const useRecordings = (): RecordingsContextType => {
  const context = useContext(RecordingsContext);
  if (context === undefined) {
    throw new Error("useRecordings must be used within a RecordingsProvider");
  }
  return context;
};
