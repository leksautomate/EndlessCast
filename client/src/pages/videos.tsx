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
  const [uploadQueue, _setUploadQueue] = useState<UploadJob[]>([]);
  const activeCount = useRef(0);
  const queueRef = useRef<UploadJob[]>([]);
  const startedIds = useRef(new Set<string>());
  const filesRef = useRef(new Map<string, File>());

  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: streamingState } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  const { data: storageInfo } = useQuery<StorageInfo>({ queryKey: ["/api/storage"] });

  const setUploadQueue = useCallback((fn: (prev: UploadJob[]) => UploadJob[]) => {
    _setUploadQueue((prev) => {
      const next = fn(prev);
      queueRef.current = next;
      return next;
    });
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setUploadQueue((q) => q.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, [setUploadQueue]);

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

  const drainQueue = useCallback(() => {
    const queue = queueRef.current;
    const pending = queue.filter(
      (j) => j.status === "pending" && !startedIds.current.has(j.id)
    );
    while (activeCount.current < MAX_CONCURRENT && pending.length > 0) {
      const job = pending.shift()!;
      const file = filesRef.current.get(job.id);
      if (!file) continue;
      activeCount.current++;
      startedIds.current.add(job.id);
      updateJob(job.id, { status: "uploading" });
      uploadFile(job, file).finally(() => {
        activeCount.current--;
        drainQueue();
      });
    }
  }, [uploadFile, updateJob]);

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

      newJobs.forEach((j, i) => filesRef.current.set(j.id, selectedFiles[i]));
      // Update the ref synchronously so drainQueue sees the new jobs immediately
      // (React batches state updates, so setUploadQueue's updater won't have run yet)
      queueRef.current = [...queueRef.current, ...newJobs];
      setUploadQueue(() => queueRef.current);
      drainQueue();
    },
    [drainQueue, setUploadQueue]
  );

  const clearDone = useCallback(() => {
    setUploadQueue((q) => {
      q.filter((j) => j.status === "done" || j.status === "error").forEach((j) => {
        startedIds.current.delete(j.id);
        filesRef.current.delete(j.id);
      });
      return q.filter((j) => j.status !== "done" && j.status !== "error");
    });
  }, [setUploadQueue]);

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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {storageInfo && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border/60 bg-card">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-primary/60" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                Storage Usage
              </span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
              </span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${storagePct > 90 ? "bg-destructive" : "bg-primary/60"}`}
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </div>
          <span className={`text-2xl font-bold leading-none flex-shrink-0 tabular-nums ${storagePct > 90 ? "text-destructive" : "text-foreground/70"}`}>
            {storagePct}%
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {videos.length}/{storageInfo?.maxVideos || 4} files
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MonitorPlay className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Video Library</h3>
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
