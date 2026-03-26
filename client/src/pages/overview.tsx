import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video, RtmpEndpoint, StreamingState, StorageInfo } from "@shared/schema";
import { StreamingControls } from "@/components/streaming-controls";
import { ExtraCameraPanel } from "@/components/extra-camera-panel";
import { StreamHealthMonitor } from "@/components/stream-health-monitor";
import { StatusDashboard } from "@/components/status-dashboard";
import {
  Activity,
  Radio,
  Clock,
  Database,
  Zap,
  Terminal,
  ChevronRight,
  Server,
  Wifi,
  Camera,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatUptime(startedAt: string | null | undefined): string {
  if (!startedAt) return "00:00:00";
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function Overview() {
  const { toast } = useToast();
  const [uptime, setUptime] = useState("00:00:00");

  const { data: videos = [] } = useQuery<Video[]>({ queryKey: ["/api/videos"] });

  const { data: endpoints = [] } = useQuery<RtmpEndpoint[]>({
    queryKey: ["/api/rtmp-endpoints"],
  });

  const { data: streamingState } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  const { data: storageInfo } = useQuery<StorageInfo>({ queryKey: ["/api/storage"] });

  useEffect(() => {
    const tick = () => setUptime(formatUptime(streamingState?.startedAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [streamingState?.startedAt]);

  const selectedVideo = videos.find((v) => v.id === streamingState?.selectedVideoId);
  const enabledEndpoints = endpoints.filter((e) => e.enabled);
  const liveEndpoints =
    streamingState?.endpointStatuses?.filter((s) => s.status === "live").length || 0;

  const startStreamMutation = useMutation({
    mutationFn: async (durationSeconds?: number) =>
      apiRequest("POST", "/api/streaming/start", { durationSeconds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({ title: "Stream Initiated", description: "Broadcasting to all enabled endpoints." });
    },
    onError: (error: Error) => {
      toast({ title: "Stream Failed", description: error.message, variant: "destructive" });
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/streaming/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({ title: "Stream Terminated", description: "All broadcasts stopped." });
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Terminal className="w-3 h-3 text-primary" />
        <span className="text-primary">root@endlesscast</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">overview</span>
        <span className="animate-pulse">_</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Status</p>
                <p
                  className={`text-base sm:text-lg font-bold font-mono truncate ${
                    streamingState?.isStreaming ? "text-green-500" : "text-muted-foreground"
                  }`}
                  data-testid="text-stream-status"
                >
                  {streamingState?.isStreaming ? "LIVE" : "OFF"}
                </p>
              </div>
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  streamingState?.isStreaming
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-muted/20 border border-muted/30"
                }`}
              >
                <Activity
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    streamingState?.isStreaming ? "text-green-500 animate-pulse" : "text-muted-foreground"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Uptime</p>
                <p className="text-base sm:text-lg font-bold font-mono text-primary truncate" data-testid="text-uptime">
                  {uptime}
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
                <p className="text-base sm:text-lg font-bold font-mono text-foreground" data-testid="text-endpoints-count">
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
                <p className="text-base sm:text-lg font-bold font-mono text-foreground" data-testid="text-storage-percent">
                  {storageInfo ? `${((storageInfo.used / storageInfo.limit) * 100).toFixed(0)}%` : "0%"}
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

      {/* Stream control */}
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

      {/* Extra camera (PiP overlay) */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur mb-6">
        <CardHeader className="pb-3 border-b border-primary/10">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <span className="text-primary">&gt;</span> EXTRA_CAMERA
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ExtraCameraPanel videos={videos} streamingState={streamingState} />
        </CardContent>
      </Card>

      {/* Stream health (only when live) */}
      {streamingState?.isStreaming && (
        <Card className="border-green-500/30 bg-green-500/5 backdrop-blur mb-6">
          <CardHeader className="pb-3 border-b border-green-500/20">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-green-500">&gt;</span> STREAM_HEALTH
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <StreamHealthMonitor endpoints={enabledEndpoints} streamingState={streamingState} />
          </CardContent>
        </Card>
      )}

      {/* Endpoint status */}
      {enabledEndpoints.length > 0 && (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              <span className="text-primary">&gt;</span> ENDPOINT_STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <StatusDashboard endpoints={enabledEndpoints} streamingState={streamingState} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
