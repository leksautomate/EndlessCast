import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video, StreamingState, StorageInfo } from "@shared/schema";
import { VideoLibrary } from "@/components/video-library";
import { Terminal, ChevronRight, MonitorPlay } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UploadJob {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const MAX_CONCURRENT = 3;

export default function Videos() {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<UploadJob[]>([]);
  const activeCount = useRef(0);

  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: streamingState } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  const { data: storageInfo } = useQuery<StorageInfo>({ queryKey: ["/api/storage"] });

  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setUploadQueue((q) => q.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const uploadFile = useCallback(
    (job: UploadJob, file: File) => {
      return new Promise<void>((resolve) => {
        const sessionId = localStorage.getItem("sessionId");
        const formData = new FormData();
        formData.append("video", file);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            updateJob(job.id, { progress: pct, status: "uploading" });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            updateJob(job.id, { progress: 100, status: "done" });
            queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
            queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
          } else {
            let msg = "Upload failed";
            try {
              msg = JSON.parse(xhr.responseText)?.message || msg;
            } catch { /* ignore */ }
            updateJob(job.id, { status: "error", error: msg });
            toast({ title: `Failed: ${job.name}`, description: msg, variant: "destructive" });
          }
          resolve();
        };

        xhr.onerror = () => {
          updateJob(job.id, { status: "error", error: "Network error" });
          toast({ title: `Failed: ${job.name}`, description: "Network error during upload.", variant: "destructive" });
          resolve();
        };

        xhr.open("POST", "/api/videos/upload");
        if (sessionId) xhr.setRequestHeader("x-session-id", sessionId);
        xhr.send(formData);
      });
    },
    [toast, updateJob]
  );

  const drainQueue = useCallback(
    (queue: UploadJob[], files: Map<string, File>) => {
      const pending = queue.filter((j) => j.status === "pending");
      while (activeCount.current < MAX_CONCURRENT && pending.length > 0) {
        const job = pending.shift()!;
        const file = files.get(job.id);
        if (!file) continue;
        activeCount.current++;
        updateJob(job.id, { status: "uploading" });
        uploadFile(job, file).finally(() => {
          activeCount.current--;
          drainQueue(queue, files);
        });
      }
    },
    [uploadFile, updateJob]
  );

  const handleUpload = useCallback(
    (selectedFiles: File[]) => {
      if (!selectedFiles.length) return;

      const newJobs: UploadJob[] = selectedFiles.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: f.size,
        progress: 0,
        status: "pending",
      }));

      const fileMap = new Map<string, File>();
      newJobs.forEach((j, i) => fileMap.set(j.id, selectedFiles[i]));

      setUploadQueue((prev) => {
        const next = [...prev, ...newJobs];
        drainQueue(next, fileMap);
        return next;
      });
    },
    [drainQueue]
  );

  const clearDone = useCallback(() => {
    setUploadQueue((q) => q.filter((j) => j.status !== "done" && j.status !== "error"));
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => apiRequest("DELETE", `/api/videos/${videoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
      toast({ title: "File Deleted", description: "Video removed from storage." });
    },
    onError: () => {
      toast({ title: "Delete Failed", description: "Could not remove the file.", variant: "destructive" });
    },
  });

  const selectVideoMutation = useMutation({
    mutationFn: async (videoId: string) =>
      apiRequest("POST", "/api/streaming/select-video", { videoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({ title: "Video Selected", description: "Video queued for broadcast." });
    },
  });

  const activeJobs = uploadQueue.filter((j) => j.status !== "done" && j.status !== "error");
  const finishedJobs = uploadQueue.filter((j) => j.status === "done" || j.status === "error");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Terminal className="w-3 h-3 text-primary" />
        <span className="text-primary">root@endlesscast</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">videos</span>
        <span className="animate-pulse">_</span>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3 border-b border-primary/10">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-primary" />
            <span className="text-primary">&gt;</span> VIDEO_LIBRARY
            <span className="ml-auto text-xs text-muted-foreground">
              [{videos.length}/{storageInfo?.maxVideos || 4}]
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <VideoLibrary
            videos={videos}
            selectedVideoId={streamingState?.selectedVideoId || null}
            isStreaming={streamingState?.isStreaming || false}
            isLoading={videosLoading}
            uploadQueue={uploadQueue}
            activeJobs={activeJobs}
            finishedJobs={finishedJobs}
            maxVideos={storageInfo?.maxVideos || 4}
            onUpload={handleUpload}
            onDelete={(id: string) => deleteMutation.mutate(id)}
            onSelect={(id: string) => selectVideoMutation.mutate(id)}
            onClearDone={clearDone}
          />
        </CardContent>
      </Card>
    </div>
  );
}
