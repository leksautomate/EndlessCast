import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video, StreamingState, StorageInfo } from "@shared/schema";
import { VideoLibrary } from "@/components/video-library";
import { MonitorPlay, Database } from "lucide-react";

export interface UploadJob {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const MAX_CONCURRENT = 3;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

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
  const storagePct = storageInfo ? Math.round((storageInfo.used / storageInfo.limit) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      {/* Storage strip */}
      {storageInfo && (
        <div className="flex items-center gap-4 px-4 py-3 console-pane rounded-lg">
          <Database className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">
                Storage Usage
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/70">
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
              </span>
            </div>
            <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${storagePct > 90 ? "bg-destructive" : "bg-primary/60"}`}
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </div>
          <span className={`font-display text-2xl leading-none flex-shrink-0 ${storagePct > 90 ? "text-destructive" : "text-primary/70"}`}>
            {storagePct}%
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/40 flex-shrink-0">
            [{videos.length}/{storageInfo?.maxVideos || 4}]
          </span>
        </div>
      )}

      {/* Library */}
      <div className="console-pane rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-primary/10">
          <MonitorPlay className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">Video Library</span>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
        </div>
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
      </div>
    </div>
  );
}
