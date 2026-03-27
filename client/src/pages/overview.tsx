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
  Server,
  Wifi,
  Camera,
  Signal,
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
    <div className={`flex items-center gap-2 pb-3 mb-4 border-b ${accent ? "border-b-green-500/20" : "border-b-primary/10"}`}>
      <Icon className={`w-3.5 h-3.5 ${accent ? "text-green-500" : "text-primary"}`} />
      <span className={`text-[10px] font-mono font-bold tracking-[0.2em] uppercase ${accent ? "text-green-500" : "text-primary/80"}`}>
        {label}
      </span>
      <div className={`flex-1 h-px ${accent ? "bg-gradient-to-r from-green-500/20 to-transparent" : "bg-gradient-to-r from-primary/10 to-transparent"}`} />
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
    <div className="min-h-full">
      {/* ── LIVE broadcast banner ─────────────────────────────── */}
      {isLive && (
        <div className="border-b border-green-500/20 bg-green-500/5 live-border-pulse px-4 sm:px-6 py-4 slide-down">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-[10px] font-mono text-green-500/70 uppercase tracking-[0.3em]">Broadcasting</span>
              </div>
              <div className="h-6 w-px bg-green-500/20" />
              <div>
                <span className="text-[9px] font-mono text-green-500/50 uppercase tracking-widest block leading-none mb-0.5">Uptime</span>
                <span className="font-display text-3xl text-green-400 leading-none glow-sm" data-testid="text-uptime">
                  {uptime}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-[9px] font-mono text-green-500/50 uppercase tracking-widest block leading-none mb-0.5">Channels</span>
                <span className="font-display text-3xl text-green-400 leading-none" data-testid="text-live-channels">
                  {liveEndpoints}/{enabledEndpoints.length}
                </span>
              </div>
              {selectedVideo && (
                <>
                  <div className="h-6 w-px bg-green-500/20 hidden sm:block" />
                  <div className="hidden sm:block text-center">
                    <span className="text-[9px] font-mono text-green-500/50 uppercase tracking-widest block leading-none mb-0.5">Now Playing</span>
                    <span className="text-xs font-mono text-green-300 max-w-[200px] truncate block leading-none" data-testid="text-now-playing">
                      {selectedVideo.originalName}
                    </span>
                  </div>
                </>
              )}
              {/* Signal bars */}
              <div className="flex items-end gap-0.5 h-6">
                {[1,2,3,4,5].map((i) => (
                  <span
                    key={i}
                    className="signal-bar w-1.5"
                    style={{
                      height: `${i * 20}%`,
                      opacity: i <= liveEndpoints ? 1 : 0.2,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Status */}
          <div className={`console-pane rounded-lg p-3 sm:p-4 ${isLive ? "border-l-green-500/70 border-green-500/15" : ""}`}>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Status</p>
            <div className="flex items-end justify-between gap-2">
              <span
                className={`font-display text-4xl leading-none ${isLive ? "text-green-400" : "text-muted-foreground/40"}`}
                data-testid="text-stream-status"
              >
                {isLive ? "LIVE" : "OFF"}
              </span>
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                isLive ? "bg-green-500/15 border border-green-500/30" : "bg-muted/20 border border-muted/20"
              }`}>
                <Activity className={`w-4 h-4 ${isLive ? "text-green-500 animate-pulse" : "text-muted-foreground/30"}`} />
              </div>
            </div>
          </div>

          {/* Uptime (only when not live — live shows in banner) */}
          <div className="console-pane rounded-lg p-3 sm:p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Uptime</p>
            <div className="flex items-end justify-between gap-2">
              <span className="font-display text-4xl text-primary/80 leading-none glow-sm" data-testid="text-uptime-sm">
                {isLive ? uptime : "--:--"}
              </span>
              <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/8 border border-primary/20 flex-shrink-0">
                <Clock className="w-4 h-4 text-primary/60" />
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="console-pane rounded-lg p-3 sm:p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Endpoints</p>
            <div className="flex items-end justify-between gap-2">
              <div>
                <span className="font-display text-4xl leading-none" data-testid="text-endpoints-count">
                  <span className={isLive ? "text-green-400" : "text-foreground/60"}>{liveEndpoints}</span>
                  <span className="text-muted-foreground/30 text-2xl">/{enabledEndpoints.length}</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/8 border border-primary/20 flex-shrink-0">
                <Radio className="w-4 h-4 text-primary/60" />
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="console-pane rounded-lg p-3 sm:p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Storage</p>
            <div className="flex items-end justify-between gap-2">
              <span
                className={`font-display text-4xl leading-none ${storagePct > 90 ? "text-destructive" : storagePct > 70 ? "text-yellow-500" : "text-foreground/70"}`}
                data-testid="text-storage-percent"
              >
                {storagePct}%
              </span>
              <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/8 border border-primary/20 flex-shrink-0">
                <Database className="w-4 h-4 text-primary/60" />
              </div>
            </div>
            {storageInfo && (
              <div className="mt-2">
                <div className="h-0.5 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${storagePct > 90 ? "bg-destructive" : "bg-primary/60"}`}
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground/40 mt-1 font-mono">
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stream control ───────────────────────────────────── */}
        <div className={`console-pane rounded-lg p-4 sm:p-5 ${isLive ? "border-l-green-500/50 border-green-500/15" : ""}`}>
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

        {/* ── Extra camera ─────────────────────────────────────── */}
        <div className="console-pane rounded-lg p-4 sm:p-5">
          <SectionHeader icon={Camera} label="Extra Camera (PiP)" />
          <ExtraCameraPanel videos={videos} streamingState={streamingState} />
        </div>

        {/* ── Stream health (only when live) ───────────────────── */}
        {isLive && (
          <div className="console-pane rounded-lg p-4 sm:p-5 border-l-green-500/50 border-green-500/15 slide-down">
            <SectionHeader icon={Activity} label="Stream Health" accent />
            <StreamHealthMonitor endpoints={enabledEndpoints} streamingState={streamingState} />
          </div>
        )}

        {/* ── Endpoint status ──────────────────────────────────── */}
        {enabledEndpoints.length > 0 && (
          <div className="console-pane rounded-lg p-4 sm:p-5">
            <SectionHeader icon={Wifi} label="Endpoint Status" />
            <StatusDashboard endpoints={enabledEndpoints} streamingState={streamingState} />
          </div>
        )}
      </div>
    </div>
  );
}
