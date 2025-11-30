import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video, RtmpEndpoint, StreamingState, StorageInfo, InsertRtmpEndpoint } from "@shared/schema";
import { VideoLibrary } from "@/components/video-library";
import { RtmpPanel } from "@/components/rtmp-panel";
import { StreamingControls } from "@/components/streaming-controls";
import { StatusDashboard } from "@/components/status-dashboard";
import { StorageIndicator } from "@/components/storage-indicator";
import { Radio, Moon, Sun, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved === "dark" || (!saved && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  // Fetch videos
  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  // Fetch RTMP endpoints
  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<RtmpEndpoint[]>({
    queryKey: ["/api/rtmp-endpoints"],
  });

  // Fetch streaming state
  const { data: streamingState, isLoading: stateLoading } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  // Fetch storage info
  const { data: storageInfo } = useQuery<StorageInfo>({
    queryKey: ["/api/storage"],
  });

  // Upload video mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      const response = await fetch("/api/videos/upload", {
        method: "POST",
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
      toast({
        title: "Video uploaded",
        description: "Your video has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
      toast({
        title: "Video deleted",
        description: "The video has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Could not delete the video.",
        variant: "destructive",
      });
    },
  });

  // Select video mutation
  const selectVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return apiRequest("POST", `/api/streaming/select-video`, { videoId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
    },
  });

  // Create RTMP endpoint mutation
  const createEndpointMutation = useMutation({
    mutationFn: async (endpoint: Omit<RtmpEndpoint, "id">) => {
      return apiRequest("POST", "/api/rtmp-endpoints", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({
        title: "Endpoint added",
        description: "RTMP endpoint has been configured.",
      });
    },
  });

  // Update RTMP endpoint mutation
  const updateEndpointMutation = useMutation({
    mutationFn: async ({ id, ...data }: RtmpEndpoint) => {
      return apiRequest("PATCH", `/api/rtmp-endpoints/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
    },
  });

  // Delete RTMP endpoint mutation
  const deleteEndpointMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/rtmp-endpoints/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({
        title: "Endpoint removed",
        description: "RTMP endpoint has been deleted.",
      });
    },
  });

  // Start streaming mutation
  const startStreamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/streaming/start");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({
        title: "Streaming started",
        description: "Your video is now broadcasting.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start streaming",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stop streaming mutation
  const stopStreamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/streaming/stop");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({
        title: "Streaming stopped",
        description: "Broadcast has been stopped.",
      });
    },
  });

  const selectedVideo = videos.find(v => v.id === streamingState?.selectedVideoId);
  const enabledEndpoints = endpoints.filter(e => e.enabled);
  const isLoading = videosLoading || endpointsLoading || stateLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b px-6 flex items-center justify-between gap-4 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Radio className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight" data-testid="text-app-title">
              EndlessCast
            </h1>
            <p className="text-xs text-muted-foreground">24/7 Multi-Platform Broadcasting</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {storageInfo && (
            <StorageIndicator storageInfo={storageInfo} />
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setLocation("/settings")}
            data-testid="button-settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Streaming Control Center */}
        <section className="mb-8">
          <StreamingControls
            selectedVideo={selectedVideo}
            streamingState={streamingState}
            enabledEndpointsCount={enabledEndpoints.length}
            isStarting={startStreamMutation.isPending}
            isStopping={stopStreamMutation.isPending}
            onStart={() => startStreamMutation.mutate()}
            onStop={() => stopStreamMutation.mutate()}
          />
        </section>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Video Library */}
          <section>
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
          </section>

          {/* RTMP Configuration */}
          <section>
            <RtmpPanel
              endpoints={endpoints}
              isLoading={endpointsLoading}
              onCreate={(endpoint: InsertRtmpEndpoint) => createEndpointMutation.mutate(endpoint)}
              onUpdate={(endpoint: RtmpEndpoint) => updateEndpointMutation.mutate(endpoint)}
              onDelete={(id: string) => deleteEndpointMutation.mutate(id)}
            />
          </section>
        </div>

        {/* Status Dashboard */}
        {enabledEndpoints.length > 0 && (
          <section>
            <StatusDashboard
              endpoints={enabledEndpoints}
              streamingState={streamingState}
            />
          </section>
        )}
      </main>
    </div>
  );
}
