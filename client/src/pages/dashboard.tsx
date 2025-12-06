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
import { StreamHealthMonitor } from "@/components/stream-health-monitor";
import { useTheme, themePresets } from "@/components/theme-provider";
import { 
  Wifi, 
  Settings as SettingsIcon, 
  LogOut,
  Terminal,
  Palette,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import type { ThemeColor } from "@shared/schema";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    onLogout();
    setLocation("/login");
    toast({
      title: "Logged out",
      description: "Session terminated successfully.",
    });
  };

  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<RtmpEndpoint[]>({
    queryKey: ["/api/rtmp-endpoints"],
  });

  const { data: streamingState } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  const { data: storageInfo } = useQuery<StorageInfo>({
    queryKey: ["/api/storage"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const sessionId = localStorage.getItem("sessionId");
      const formData = new FormData();
      formData.append("video", file);
      const response = await fetch("/api/videos/upload", {
        method: "POST",
        headers: {
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        },
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
        title: "Upload Complete",
        description: "Video file processed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
      toast({
        title: "File Deleted",
        description: "Video removed from storage.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Could not remove the file.",
        variant: "destructive",
      });
    },
  });

  const selectVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return apiRequest("POST", `/api/streaming/select-video`, { videoId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
    },
  });

  const createEndpointMutation = useMutation({
    mutationFn: async (endpoint: Omit<RtmpEndpoint, "id">) => {
      return apiRequest("POST", "/api/rtmp-endpoints", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({
        title: "Endpoint Added",
        description: "RTMP destination configured.",
      });
    },
  });

  const updateEndpointMutation = useMutation({
    mutationFn: async ({ id, ...data }: RtmpEndpoint) => {
      return apiRequest("PATCH", `/api/rtmp-endpoints/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
    },
  });

  const deleteEndpointMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/rtmp-endpoints/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({
        title: "Endpoint Removed",
        description: "RTMP destination deleted.",
      });
    },
  });

  const startStreamMutation = useMutation({
    mutationFn: async (durationSeconds?: number) => {
      return apiRequest("POST", "/api/streaming/start", { durationSeconds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({
        title: "Stream Initiated",
        description: "Broadcasting to all enabled endpoints.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Stream Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/streaming/stop");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({
        title: "Stream Terminated",
        description: "All broadcasts stopped.",
      });
    },
  });

  const selectedVideo = videos.find(v => v.id === streamingState?.selectedVideoId);
  const enabledEndpoints = endpoints.filter(e => e.enabled);

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-primary/20 px-6 flex items-center justify-between gap-4 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-primary/50 flex items-center justify-center bg-primary/10 box-glow-sm">
            <Wifi className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary glow-sm" data-testid="text-app-title">
              EndlessCast
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              <span className="text-primary">&gt;</span> Control Panel v1.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streamingState?.isStreaming && (
            <div className="flex items-center gap-2 px-3 py-1 rounded border border-green-500/30 bg-green-500/10">
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-sm text-green-500 font-mono">LIVE</span>
            </div>
          )}

          {storageInfo && (
            <StorageIndicator storageInfo={storageInfo} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-theme-selector">
                <Palette className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Color Theme
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(themePresets) as ThemeColor[]).filter(t => t !== 'custom').map((themeKey) => (
                <DropdownMenuItem
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className="flex items-center gap-3"
                  data-testid={`menu-theme-${themeKey}`}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-foreground/20"
                    style={{ backgroundColor: themePresets[themeKey].primary }}
                  />
                  <span>{themePresets[themeKey].name}</span>
                  {theme === themeKey && (
                    <span className="ml-auto text-primary">*</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-primary">admin@endlesscast</span>
          <span>:</span>
          <span>~</span>
          <span className="text-primary">$</span>
          <span>dashboard --status</span>
        </div>

        <section className="mb-8">
          <StreamingControls
            selectedVideo={selectedVideo}
            streamingState={streamingState}
            enabledEndpointsCount={enabledEndpoints.length}
            isStarting={startStreamMutation.isPending}
            isStopping={stopStreamMutation.isPending}
            onStart={(durationSeconds) => startStreamMutation.mutate(durationSeconds)}
            onStop={() => stopStreamMutation.mutate()}
          />
        </section>

        {streamingState?.isStreaming && (
          <section className="mb-8">
            <StreamHealthMonitor
              endpoints={enabledEndpoints}
              streamingState={streamingState}
            />
          </section>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
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

        {enabledEndpoints.length > 0 && (
          <section>
            <StatusDashboard
              endpoints={enabledEndpoints}
              streamingState={streamingState}
            />
          </section>
        )}
      </main>

      <footer className="border-t border-primary/10 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-primary" />
            <span>EndlessCast v1.0</span>
          </div>
          <div>
            <span className="text-primary">&gt;</span> 24/7 Streaming Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
