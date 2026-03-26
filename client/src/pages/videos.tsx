import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video, StreamingState, StorageInfo } from "@shared/schema";
import { VideoLibrary } from "@/components/video-library";
import { Terminal, ChevronRight, MonitorPlay } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Videos() {
  const { toast } = useToast();

  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: streamingState } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  const { data: storageInfo } = useQuery<StorageInfo>({ queryKey: ["/api/storage"] });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const sessionId = localStorage.getItem("sessionId");
      const formData = new FormData();
      formData.append("video", file);
      const response = await fetch("/api/videos/upload", {
        method: "POST",
        headers: { ...(sessionId ? { "x-session-id": sessionId } : {}) },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
      toast({ title: "Upload Complete", description: "Video file processed successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

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
            isUploading={uploadMutation.isPending}
            maxVideos={storageInfo?.maxVideos || 4}
            onUpload={(file: File) => uploadMutation.mutate(file)}
            onDelete={(id: string) => deleteMutation.mutate(id)}
            onSelect={(id: string) => selectVideoMutation.mutate(id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
