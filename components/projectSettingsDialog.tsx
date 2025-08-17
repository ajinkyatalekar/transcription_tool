"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useRecordings } from "@/app/context/RecordingsContext";
import { useRouter } from "next/navigation";
import { Database } from "@/database.types";

type Recording = Database["public"]["Tables"]["recordings"]["Row"];

interface ProjectSettingsDialogProps {
  recording: Recording;
  children: React.ReactNode;
}

export function ProjectSettingsDialog({
  recording,
  children,
}: ProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(recording.title);
  const [description, setDescription] = useState(recording.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { updateRecording, deleteRecording } = useRecordings();
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);
    try {
      await updateRecording(recording.id, {
        title: title.trim(),
        description: description.trim() || null,
      });
      setOpen(false);
      toast.success("Project settings updated successfully");
    } catch {
      toast.error("Failed to update project settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecording(recording.id);
      setOpen(false);
      setShowDeleteConfirm(false);
      router.push("/home");
      toast.success("Project deleted successfully");
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setTitle(recording.title);
      setDescription(recording.description || "");
      setShowDeleteConfirm(false);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {!showDeleteConfirm ? (
          <>
            <DialogHeader>
              <DialogTitle>Project Settings</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter project title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter project description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Created at</Label>
                <div className="text-sm text-muted-foreground px-2">
                  {new Date(recording.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || isDeleting}
                  className="flex-1"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading || isDeleting}
                >
                  Cancel
                </Button>
              </div>
              <Separator />
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Trash2Icon className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Project"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete &quot;{recording.title}&quot;?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
