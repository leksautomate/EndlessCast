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
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function PanelLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border/40">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        {label}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  bar,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  bar?: { pct: number; danger: boolean };
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-green-500/20 bg-green-500/5" : "border-border/50 bg-card"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-2">{label}</p>
      <div className={`text-xl font-bold tabular-nums leading-none ${accent ? "text-green-400" : "text-foreground/80"}`}>
        {value}
      </div>
      {sub && <div className="mt-1.5">{sub}</div>}
      {bar && (
        <div className="mt-2.5">
          <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${bar.danger ? "bg-destructive" : "bg-primary/60"}`}
              style={{ width: `${bar.pct}%` }}
            />
          </div>
        </div>
      )}
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
      {/* Live banner */}
      {isLive && (
        <div className="border-b border-green-500/15 bg-green-500/5 px-4 sm:px-6 py-3 slide-down">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs font-semibold text-green-500 uppercase tracking-widest">Broadcasting</span>
              </div>
              <div className="h-4 w-px bg-green-500/20" />
              <span className="text-xl font-bold text-green-400 tabular-nums leading-none" data-testid="text-uptime">
                {uptime}
              </span>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-[10px] text-green-500/50 uppercase tracking-wider leading-none mb-1">Channels</p>
                <span className="text-lg font-bold text-green-400 tabular-nums leading-none" data-testid="text-live-channels">
                  {liveEndpoints}/{enabledEndpoints.length}
                </span>
              </div>
              {selectedVideo && (
                <div className="hidden sm:block text-center">
                  <p className="text-[10px] text-green-500/50 uppercase tracking-wider leading-none mb-1">Now Playing</p>
                  <span className="text-xs text-green-300 max-w-[200px] truncate block leading-none" data-testid="text-now-playing">
                    {selectedVideo.originalName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_272px] gap-5">

          {/* ── Left column ── */}
          <div className="space-y-5 min-w-0">

            {/* Stream Control — hero panel */}
            <div className={`rounded-xl border p-5 transition-all ${
              isLive
                ? "border-green-500/25 bg-green-500/[0.04] live-border-pulse"
                : "border-border/50 bg-card"
            }`}>
              <PanelLabel icon={Zap} label="Stream Control" />
              <StreamingControls
                selectedVideo={selectedVideo}
                streamingState={streamingState}
                enabledEndpointsCount={enabledEndpoints.length}
                isStarting={startStreamMutation.isPending}
                isStopping={stopStreamMutation.isPending}
                onStart={(d) => startStreamMutation.mutate(d)}
                onStop={() => stopStreamMutation.mutate()}
              />
            </div>

            {/* Stream Health — appears when live */}
            {isLive && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-5 slide-down">
                <PanelLabel icon={Activity} label="Stream Health" />
                <StreamHealthMonitor endpoints={enabledEndpoints} streamingState={streamingState} />
              </div>
            )}

            {/* Extra Camera */}
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <PanelLabel icon={Camera} label="Extra Camera — PiP" />
              <ExtraCameraPanel videos={videos} streamingState={streamingState} />
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Stat cards — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Status"
                value={
                  <span
                    className={isLive ? "text-green-400" : "text-muted-foreground/30"}
                    data-testid="text-stream-status"
                  >
                    {isLive ? "LIVE" : "Offline"}
                  </span>
                }
                accent={isLive}
              />

              <StatCard
                label="Uptime"
                value={
                  <span className="text-base" data-testid="text-uptime-sm">
                    {isLive ? uptime : "--:--"}
                  </span>
                }
              />

              <StatCard
                label="Endpoints"
                value={
                  <span data-testid="text-endpoints-count">
                    <span className={isLive ? "text-green-400" : "text-foreground/60"}>{liveEndpoints}</span>
                    <span className="text-muted-foreground/25 text-sm font-normal">/{enabledEndpoints.length}</span>
                  </span>
                }
                accent={isLive && liveEndpoints > 0}
              />

              <StatCard
                label="Storage"
                value={
                  <span
                    className={storagePct > 90 ? "text-destructive" : storagePct > 70 ? "text-yellow-500" : "text-foreground/70"}
                    data-testid="text-storage-percent"
                  >
                    {storagePct}%
                  </span>
                }
                sub={
                  storageInfo && (
                    <p className="text-[10px] text-muted-foreground/35">
                      {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
                    </p>
                  )
                }
                bar={storageInfo ? { pct: storagePct, danger: storagePct > 90 } : undefined}
              />
            </div>

            {/* Endpoint status */}
            {enabledEndpoints.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <PanelLabel icon={Wifi} label="Endpoint Status" />
                <StatusDashboard endpoints={enabledEndpoints} streamingState={streamingState} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
