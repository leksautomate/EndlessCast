import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video, RtmpEndpoint, StreamingState, StorageInfo, InsertRtmpEndpoint } from "@shared/schema";
import { VideoLibrary } from "@/components/video-library";
import { RtmpPanel } from "@/components/rtmp-panel";
import { StreamingControls } from "@/components/streaming-controls";
import { StatusDashboard } from "@/components/status-dashboard";
import { StreamHealthMonitor } from "@/components/stream-health-monitor";
import { useTheme, themePresets } from "@/components/theme-provider";
import { 
  Wifi, 
  Settings as SettingsIcon, 
  LogOut,
  Terminal,
  Palette,
  Activity,
  Server,
  Radio,
  Clock,
  Zap,
  Shield,
  ChevronRight,
  MonitorPlay,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function formatUptime(startedAt: string | null | undefined): string {
  if (!startedAt) return "00:00:00";
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
  const liveEndpoints = streamingState?.endpointStatuses?.filter(s => s.status === 'live').length || 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="scanlines pointer-events-none" />
      
      <header className="h-14 border-b border-primary/30 px-4 flex items-center justify-between gap-4 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded border border-primary/50 flex items-center justify-center bg-primary/10 box-glow-sm">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            {streamingState?.isStreaming && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-background" />
            )}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-primary glow-sm leading-none" data-testid="text-app-title">
              ENDLESSCAST
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              <span className="text-primary">SYS</span>::CONTROL_PANEL
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="hidden md:flex items-center gap-6 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-primary" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-green-500">SECURE</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-3 h-3 text-primary" />
              <span>NODE::ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {streamingState?.isStreaming && (
            <div className="flex items-center gap-2 px-2 py-1 rounded border border-green-500/30 bg-green-500/10 mr-2">
              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              <span className="text-xs text-green-500 font-mono font-bold">LIVE</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-theme-selector">
                <Palette className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-primary/30">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-mono">
                <span className="text-primary">&gt;</span> COLOR_THEME
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/20" />
              {(Object.keys(themePresets) as ThemeColor[]).filter(t => t !== 'custom').map((themeKey) => (
                <DropdownMenuItem
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className="flex items-center gap-3 font-mono text-xs"
                  data-testid={`menu-theme-${themeKey}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full border border-foreground/20"
                    style={{ backgroundColor: themePresets[themeKey].primary }}
                  />
                  <span>{themePresets[themeKey].name}</span>
                  {theme === themeKey && (
                    <Zap className="w-3 h-3 ml-auto text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setLocation("/settings")}
            data-testid="button-settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground font-mono overflow-x-auto">
          <Terminal className="w-3 h-3 text-primary flex-shrink-0" />
          <span className="text-primary whitespace-nowrap">root@endlesscast</span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-foreground">dashboard</span>
          <span className="animate-pulse">_</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Status</p>
                  <p className={`text-base sm:text-lg font-bold font-mono truncate ${streamingState?.isStreaming ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {streamingState?.isStreaming ? 'LIVE' : 'OFF'}
                  </p>
                </div>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${streamingState?.isStreaming ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted/20 border border-muted/30'}`}>
                  <Activity className={`w-4 h-4 sm:w-5 sm:h-5 ${streamingState?.isStreaming ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Uptime</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-primary truncate">
                    {formatUptime(streamingState?.startedAt)}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/30 flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Endpoints</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-foreground">
                    <span className="text-green-500">{liveEndpoints}</span>
                    <span className="text-muted-foreground text-sm">/{enabledEndpoints.length}</span>
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/30 flex-shrink-0">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Storage</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-foreground">
                    {storageInfo ? `${((storageInfo.used / storageInfo.limit) * 100).toFixed(0)}%` : '0%'}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/30 flex-shrink-0">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
              </div>
              {storageInfo && (
                <div className="mt-2">
                  <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(storageInfo.used / storageInfo.limit) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/30 bg-card/50 backdrop-blur mb-6">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary">&gt;</span> STREAM_CONTROL
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <StreamingControls
              selectedVideo={selectedVideo}
              streamingState={streamingState}
              enabledEndpointsCount={enabledEndpoints.length}
              isStarting={startStreamMutation.isPending}
              isStopping={stopStreamMutation.isPending}
              onStart={(durationSeconds) => startStreamMutation.mutate(durationSeconds)}
              onStop={() => stopStreamMutation.mutate()}
            />
          </CardContent>
        </Card>

        {streamingState?.isStreaming && (
          <Card className="border-green-500/30 bg-green-500/5 backdrop-blur mb-6">
            <CardHeader className="pb-3 border-b border-green-500/20">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-green-500">&gt;</span> STREAM_HEALTH
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StreamHealthMonitor
                endpoints={enabledEndpoints}
                streamingState={streamingState}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
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

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-primary">&gt;</span> RTMP_ENDPOINTS
                <span className="ml-auto text-xs text-muted-foreground">
                  [{enabledEndpoints.length} active]
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RtmpPanel
                endpoints={endpoints}
                isLoading={endpointsLoading}
                onCreate={(endpoint: InsertRtmpEndpoint) => createEndpointMutation.mutate(endpoint)}
                onUpdate={(endpoint: RtmpEndpoint) => updateEndpointMutation.mutate(endpoint)}
                onDelete={(id: string) => deleteEndpointMutation.mutate(id)}
              />
            </CardContent>
          </Card>
        </div>

        {enabledEndpoints.length > 0 && (
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <span className="text-primary">&gt;</span> ENDPOINT_STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusDashboard
                endpoints={enabledEndpoints}
                streamingState={streamingState}
              />
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t border-primary/10 py-3 mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-primary" />
              <span>ENDLESSCAST v1.0</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>SYSTEM::NOMINAL</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-primary">&gt;</span>
            <span>24/7 MULTI-PLATFORM BROADCASTING</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
