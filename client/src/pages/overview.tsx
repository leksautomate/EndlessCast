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
  Wifi,
  Camera,
} from "lucide-react";

function formatUptime(startedAt: string | null | undefined): string {
  if (!startedAt) return "00:00:00";
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function SectionHeader({ icon: Icon, label, accent }: { icon: React.ElementType; label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/50">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-green-500/10" : "bg-primary/10"}`}>
        <Icon className={`w-4 h-4 ${accent ? "text-green-500" : "text-primary"}`} />
      </div>
      <h3 className={`text-sm font-semibold ${accent ? "text-green-500" : "text-foreground"}`}>
        {label}
      </h3>
    </div>
  );
}

export default function Overview() {
  const { toast } = useToast();
  const [uptime, setUptime] = useState("00:00:00");

  const { data: videos = [] } = useQuery<Video[]>({ queryKey: ["/api/videos"] });
  const { data: endpoints = [] } = useQuery<RtmpEndpoint[]>({ queryKey: ["/api/rtmp-endpoints"] });
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
  const liveEndpoints = streamingState?.endpointStatuses?.filter((s) => s.status === "live").length || 0;
  const isLive = streamingState?.isStreaming || false;
  const storagePct = storageInfo ? Math.round((storageInfo.used / storageInfo.limit) * 100) : 0;

  const startStreamMutation = useMutation({
    mutationFn: async (durationSeconds?: number) =>
      apiRequest("POST", "/api/streaming/start", { durationSeconds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({ title: "Stream Started", description: "Broadcasting to all enabled endpoints." });
    },
    onError: (error: Error) => {
      toast({ title: "Stream Failed", description: error.message, variant: "destructive" });
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/streaming/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({ title: "Stream Stopped", description: "All broadcasts stopped." });
    },
  });

  return (
    <div className="min-h-full">
      {isLive && (
        <div className="border-b border-green-500/20 bg-green-500/5 px-4 sm:px-6 py-4 slide-down">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-sm font-semibold text-green-500">Broadcasting</span>
              </div>
              <div className="h-5 w-px bg-green-500/20" />
              <div>
                <span className="text-xs text-green-500/60 block leading-none mb-0.5">Uptime</span>
                <span className="text-2xl font-bold text-green-400 tabular-nums leading-none" data-testid="text-uptime">
                  {uptime}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-xs text-green-500/60 block leading-none mb-0.5">Channels</span>
                <span className="text-2xl font-bold text-green-400 tabular-nums leading-none" data-testid="text-live-channels">
                  {liveEndpoints}/{enabledEndpoints.length}
                </span>
              </div>
              {selectedVideo && (
                <div className="hidden sm:block text-center">
                  <span className="text-xs text-green-500/60 block leading-none mb-0.5">Now Playing</span>
                  <span className="text-sm text-green-300 max-w-[200px] truncate block leading-none" data-testid="text-now-playing">
                    {selectedVideo.originalName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-xl border p-4 ${isLive ? "border-green-500/20 bg-green-500/5" : "border-border/60 bg-card"}`}>
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <div className="flex items-end justify-between gap-2">
              <span
                className={`text-2xl font-bold ${isLive ? "text-green-500" : "text-muted-foreground/50"}`}
                data-testid="text-stream-status"
              >
                {isLive ? "LIVE" : "Offline"}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isLive ? "bg-green-500/10" : "bg-muted/30"
              }`}>
                <Activity className={`w-4 h-4 ${isLive ? "text-green-500" : "text-muted-foreground/30"}`} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">Uptime</p>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-bold text-foreground/80 tabular-nums" data-testid="text-uptime-sm">
                {isLive ? uptime : "--:--"}
              </span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Clock className="w-4 h-4 text-primary/60" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">Endpoints</p>
            <div className="flex items-end justify-between gap-2">
              <div>
                <span className="text-2xl font-bold tabular-nums" data-testid="text-endpoints-count">
                  <span className={isLive ? "text-green-500" : "text-foreground/70"}>{liveEndpoints}</span>
                  <span className="text-muted-foreground/40 text-lg">/{enabledEndpoints.length}</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Radio className="w-4 h-4 text-primary/60" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">Storage</p>
            <div className="flex items-end justify-between gap-2">
              <span
                className={`text-2xl font-bold ${storagePct > 90 ? "text-destructive" : storagePct > 70 ? "text-yellow-500" : "text-foreground/70"}`}
                data-testid="text-storage-percent"
              >
                {storagePct}%
              </span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Database className="w-4 h-4 text-primary/60" />
              </div>
            </div>
            {storageInfo && (
              <div className="mt-3">
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${storagePct > 90 ? "bg-destructive" : "bg-primary/60"}`}
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${isLive ? "border-green-500/20 bg-green-500/5" : "border-border/60 bg-card"}`}>
          <SectionHeader icon={Zap} label="Stream Control" accent={isLive} />
          <StreamingControls
            selectedVideo={selectedVideo}
            streamingState={streamingState}
            enabledEndpointsCount={enabledEndpoints.length}
            isStarting={startStreamMutation.isPending}
            isStopping={stopStreamMutation.isPending}
            onStart={(durationSeconds) => startStreamMutation.mutate(durationSeconds)}
            onStop={() => stopStreamMutation.mutate()}
          />
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <SectionHeader icon={Camera} label="Extra Camera (PiP)" />
          <ExtraCameraPanel videos={videos} streamingState={streamingState} />
        </div>

        {isLive && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 slide-down">
            <SectionHeader icon={Activity} label="Stream Health" accent />
            <StreamHealthMonitor endpoints={enabledEndpoints} streamingState={streamingState} />
          </div>
        )}

        {enabledEndpoints.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <SectionHeader icon={Wifi} label="Endpoint Status" />
            <StatusDashboard endpoints={enabledEndpoints} streamingState={streamingState} />
          </div>
        )}
      </div>
    </div>
  );
}
