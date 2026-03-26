import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  ChevronRight,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  CheckCircle,
  XCircle,
  AlertCircle,
  Server,
  Zap,
  Radio,
} from "lucide-react";

interface SystemInfo {
  cpu: { model: string; cores: number; arch: string };
  ram: { total: number; free: number; used: number };
  disk: { total: number; free: number; used: number; available: boolean };
  uploads: { used: number; limit: number; videoCount: number; maxVideos: number };
  ffmpeg: { version: string; available: boolean };
  node: { version: string };
  os: { platform: string; release: string; type: string };
  uptime: { system: number; process: number };
  streaming: { active: number; enabled: number };
  capacity: {
    max1080pByCpu: number;
    max1080pByRam: number;
    max720pByCpu: number;
    max720pByRam: number;
    recommended1080p: number;
    recommended720p: number;
    bandwidthPer1080pMbps: number;
    bandwidthPer720pMbps: number;
  };
}

function fmt(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function fmtUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function UsageBar({ pct, warn = 70, danger = 90 }: { pct: number; warn?: number; danger?: number }) {
  const color = pct >= danger ? "bg-destructive" : pct >= warn ? "bg-yellow-500" : "bg-primary";
  return (
    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-primary/5 last:border-0">
      <span className="text-xs text-muted-foreground font-mono">{label}</span>
      <span className="text-xs font-mono text-foreground font-medium">{value}</span>
    </div>
  );
}

function CheckRow({ ok, label, detail }: { ok: boolean | null; label: string; detail?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-primary/5 last:border-0">
      {ok === null
        ? <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        : ok
        ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        : <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
      }
      <div className="min-w-0 flex-1">
        <p className="text-xs font-mono text-foreground">{label}</p>
        {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

const STREAM_TABLE = [
  { streams: 1, res: "1080p", cores: 2, ram: "512 MB", bw: 6.2 },
  { streams: 2, res: "1080p", cores: 4, ram: "1 GB",   bw: 12.4 },
  { streams: 3, res: "1080p", cores: 6, ram: "1.5 GB", bw: 18.6 },
  { streams: 4, res: "1080p", cores: 8, ram: "2 GB",   bw: 24.8 },
  { streams: 6, res: "1080p", cores: 12, ram: "3 GB",  bw: 37.2 },
  { streams: 1, res: "720p",  cores: 1, ram: "256 MB", bw: 3.2 },
  { streams: 2, res: "720p",  cores: 2, ram: "512 MB", bw: 6.4 },
  { streams: 4, res: "720p",  cores: 4, ram: "1 GB",   bw: 12.8 },
  { streams: 6, res: "720p",  cores: 6, ram: "1.5 GB", bw: 19.2 },
];

export default function SystemPage() {
  const { data: info, isLoading } = useQuery<SystemInfo>({
    queryKey: ["/api/system"],
    refetchInterval: 10000,
  });

  const ramPct = info ? (info.ram.used / info.ram.total) * 100 : 0;
  const diskPct = info?.disk.available
    ? ((info.disk.used / info.disk.total) * 100)
    : 0;
  const uploadsPct = info ? (info.uploads.used / info.uploads.limit) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Terminal className="w-3 h-3 text-primary" />
        <span className="text-primary">root@endlesscast</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">system</span>
        <span className="animate-pulse">_</span>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-muted-foreground font-mono text-sm">
          <Terminal className="w-6 h-6 mx-auto mb-2 animate-pulse text-primary" />
          Gathering system info...
        </div>
      )}

      {info && (
        <div className="space-y-6">
          {/* ─── Capacity summary ─────────────────────────── */}
          <Card className="border-primary/30 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-primary">&gt;</span> STREAM_CAPACITY
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Recommended 1080p",
                    value: info.capacity.recommended1080p,
                    sub: "simultaneous streams",
                    color: "text-primary",
                  },
                  {
                    label: "Recommended 720p",
                    value: info.capacity.recommended720p,
                    sub: "simultaneous streams",
                    color: "text-primary",
                  },
                  {
                    label: "Active Now",
                    value: info.streaming.active,
                    sub: `of ${info.streaming.enabled} enabled`,
                    color: info.streaming.active > 0 ? "text-green-500" : "text-muted-foreground",
                  },
                  {
                    label: "Bandwidth / 1080p",
                    value: `~${info.capacity.bandwidthPer1080pMbps} Mbps`,
                    sub: "upload per stream",
                    color: "text-foreground",
                  },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  <span className="text-primary font-bold">&gt; </span>
                  Your server has <span className="text-foreground font-bold">{info.cpu.cores} CPU cores</span> and{" "}
                  <span className="text-foreground font-bold">{fmt(info.ram.total)} RAM</span>.
                  Each 1080p stream requires ~2 CPU cores and ~512 MB RAM (libx264 veryfast).
                  Each 720p stream requires ~1 CPU core and ~256 MB RAM.
                  Total upload bandwidth needed: <span className="text-foreground font-bold">
                    {(info.capacity.recommended1080p * info.capacity.bandwidthPer1080pMbps).toFixed(1)} Mbps
                  </span> for {info.capacity.recommended1080p} simultaneous 1080p streams.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ─── Resource meters ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CPU */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 border-b border-primary/10">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span className="text-primary">&gt;</span> CPU
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="text-2xl font-bold font-mono text-primary mb-1" data-testid="text-cpu-cores">
                  {info.cpu.cores} <span className="text-sm text-muted-foreground">cores</span>
                </div>
                <StatRow label="Model" value={<span className="truncate max-w-[180px] block text-right" title={info.cpu.model}>{info.cpu.model}</span>} />
                <StatRow label="Architecture" value={info.cpu.arch} />
                <StatRow label="OS" value={`${info.os.type} (${info.os.platform})`} />
                <StatRow label="Kernel" value={info.os.release} />
                <StatRow label="System Uptime" value={fmtUptime(info.uptime.system)} />
                <StatRow label="Process Uptime" value={fmtUptime(info.uptime.process)} />
              </CardContent>
            </Card>

            {/* RAM */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 border-b border-primary/10">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-primary" />
                  <span className="text-primary">&gt;</span> RAM
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="text-2xl font-bold font-mono text-primary mb-1" data-testid="text-ram-total">
                  {fmt(info.ram.total)}
                </div>
                <StatRow label="Used" value={fmt(info.ram.used)} />
                <StatRow label="Free" value={fmt(info.ram.free)} />
                <StatRow
                  label="Usage"
                  value={
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${ramPct >= 90 ? "bg-destructive/15 text-destructive border-destructive/30" : ramPct >= 70 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-primary/10 text-primary border-primary/20"}`}
                    >
                      {ramPct.toFixed(0)}%
                    </Badge>
                  }
                />
                <UsageBar pct={ramPct} />
                <p className="text-[10px] text-muted-foreground font-mono mt-2">
                  ~{Math.floor(info.ram.total / (512 * 1024 * 1024))} simultaneous streams possible by RAM
                </p>
              </CardContent>
            </Card>

            {/* System Disk */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 border-b border-primary/10">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span className="text-primary">&gt;</span> SYSTEM_DISK
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {info.disk.available ? (
                  <>
                    <div className="text-2xl font-bold font-mono text-primary mb-1" data-testid="text-disk-total">
                      {fmt(info.disk.total)}
                    </div>
                    <StatRow label="Used" value={fmt(info.disk.used)} />
                    <StatRow label="Free" value={fmt(info.disk.free)} />
                    <StatRow
                      label="Usage"
                      value={
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${diskPct >= 90 ? "bg-destructive/15 text-destructive border-destructive/30" : diskPct >= 70 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-primary/10 text-primary border-primary/20"}`}
                        >
                          {diskPct.toFixed(0)}%
                        </Badge>
                      }
                    />
                    <UsageBar pct={diskPct} />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground font-mono">Disk stats unavailable</p>
                )}
              </CardContent>
            </Card>

            {/* Uploads Storage */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 border-b border-primary/10">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  <span className="text-primary">&gt;</span> UPLOAD_STORAGE
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="text-2xl font-bold font-mono text-primary mb-1" data-testid="text-uploads-total">
                  {fmt(info.uploads.limit)}
                </div>
                <StatRow label="Used" value={fmt(info.uploads.used)} />
                <StatRow label="Free" value={fmt(info.uploads.limit - info.uploads.used)} />
                <StatRow label="Videos" value={`${info.uploads.videoCount} / ${info.uploads.maxVideos}`} />
                <StatRow
                  label="Usage"
                  value={
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${uploadsPct >= 90 ? "bg-destructive/15 text-destructive border-destructive/30" : uploadsPct >= 70 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-primary/10 text-primary border-primary/20"}`}
                    >
                      {uploadsPct.toFixed(0)}%
                    </Badge>
                  }
                />
                <UsageBar pct={uploadsPct} />
              </CardContent>
            </Card>
          </div>

          {/* ─── Environment checks ───────────────────────── */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-primary">&gt;</span> ENVIRONMENT_CHECK
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <CheckRow
                ok={info.ffmpeg.available}
                label={`FFmpeg ${info.ffmpeg.available ? info.ffmpeg.version : "— not found"}`}
                detail={info.ffmpeg.available ? "Required for video encoding and RTMP streaming" : "Install FFmpeg: sudo apt install ffmpeg"}
              />
              <CheckRow
                ok={true}
                label={`Node.js ${info.node.version}`}
                detail="Server runtime"
              />
              <CheckRow
                ok={info.cpu.cores >= 2}
                label={`${info.cpu.cores} CPU core${info.cpu.cores !== 1 ? "s" : ""} detected`}
                detail={info.cpu.cores >= 2 ? "Sufficient for multi-platform streaming" : "Minimum 2 cores recommended for any streaming"}
              />
              <CheckRow
                ok={info.ram.total >= 1024 * 1024 * 1024}
                label={`${fmt(info.ram.total)} total RAM`}
                detail={info.ram.total >= 1024 * 1024 * 1024 ? "Sufficient" : "1 GB minimum recommended"}
              />
              <CheckRow
                ok={info.disk.available ? info.disk.free > 5 * 1024 * 1024 * 1024 : null}
                label={info.disk.available ? `${fmt(info.disk.free)} free disk space` : "Disk free space unknown"}
                detail="5 GB minimum free recommended for stable operation"
              />
              <CheckRow
                ok={info.uploads.videoCount < info.uploads.maxVideos}
                label={`Video slots: ${info.uploads.videoCount} / ${info.uploads.maxVideos} used`}
                detail={info.uploads.videoCount >= info.uploads.maxVideos ? "No more videos can be uploaded" : `${info.uploads.maxVideos - info.uploads.videoCount} slots remaining`}
              />
            </CardContent>
          </Card>

          {/* ─── Multi-platform requirements table ────────── */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <span className="text-primary">&gt;</span> MULTI_PLATFORM_REQUIREMENTS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 overflow-x-auto">
              <p className="text-xs text-muted-foreground font-mono mb-3">
                Requirements per simultaneous stream count using libx264 veryfast preset.
                Highlighted rows match your hardware.
              </p>
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase text-[10px] tracking-wider">Streams</th>
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase text-[10px] tracking-wider">Resolution</th>
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase text-[10px] tracking-wider">CPU Cores</th>
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase text-[10px] tracking-wider">RAM</th>
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase text-[10px] tracking-wider">Upload</th>
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase text-[10px] tracking-wider">Fits You?</th>
                  </tr>
                </thead>
                <tbody>
                  {STREAM_TABLE.map((row, i) => {
                    const neededCores = row.cores;
                    const neededRamBytes = parseFloat(row.ram) * (row.ram.includes("GB") ? 1024 * 1024 * 1024 : 1024 * 1024);
                    const fits = info.cpu.cores >= neededCores && info.ram.total >= neededRamBytes;
                    const isCurrent = row.streams === info.streaming.active;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-primary/5 transition-colors ${
                          fits
                            ? "bg-primary/3 hover:bg-primary/8"
                            : "opacity-50 hover:opacity-70"
                        } ${isCurrent ? "ring-1 ring-inset ring-green-500/30" : ""}`}
                        data-testid={`row-capacity-${row.streams}-${row.res}`}
                      >
                        <td className="py-2 px-2 font-bold text-foreground">{row.streams}×</td>
                        <td className="py-2 px-2">{row.res}</td>
                        <td className="py-2 px-2">{row.cores}</td>
                        <td className="py-2 px-2">{row.ram}</td>
                        <td className="py-2 px-2">{row.bw} Mbps</td>
                        <td className="py-2 px-2">
                          {fits
                            ? <span className="text-green-500">✓ Yes</span>
                            : <span className="text-muted-foreground">✗ No</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* ─── Tips ─────────────────────────────────────── */}
          <Card className="border-primary/10 bg-card/30 backdrop-blur">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="text-primary">&gt;</span> PERFORMANCE_TIPS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {[
                "Use Landscape 720p profile instead of 1080p to halve CPU usage per stream.",
                "Close other processes on the VPS while streaming to free up CPU headroom.",
                "Pre-encode your videos to the target profile locally before uploading — this reduces FFmpeg work.",
                "Use a VPS with dedicated CPU cores, not shared/burstable (e.g. Hetzner CX-series, DigitalOcean Dedicated).",
                "Ensure your upload bandwidth is at least 1.5× the total stream bitrate to handle fluctuations.",
                "Enable auto-reconnect (built-in) to recover from transient platform disconnects without manual intervention.",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-primary font-mono shrink-0">&gt;</span>
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
