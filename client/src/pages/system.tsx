import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
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
  const color = pct >= danger ? "bg-destructive" : pct >= warn ? "bg-yellow-500" : "bg-primary/60";
  return (
    <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden mt-2">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-primary/5 last:border-0">
      <span className="text-[10px] text-muted-foreground/60 font-mono">{label}</span>
      <span className="text-[10px] font-mono text-foreground/80">{value}</span>
    </div>
  );
}

function CheckRow({ ok, label, detail }: { ok: boolean | null; label: string; detail?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-primary/5 last:border-0">
      {ok === null
        ? <AlertCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
        : ok
        ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        : <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
      }
      <div className="min-w-0 flex-1">
        <p className="text-xs font-mono text-foreground/80">{label}</p>
        {detail && <p className="text-[10px] text-muted-foreground/50">{detail}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, badge }: { icon: React.ElementType; label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-primary/10">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
      {badge && <span className="text-[9px] font-mono text-muted-foreground/40">{badge}</span>}
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
  const diskPct = info?.disk.available ? ((info.disk.used / info.disk.total) * 100) : 0;
  const uploadsPct = info ? (info.uploads.used / info.uploads.limit) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      {isLoading && (
        <div className="text-center py-20 text-muted-foreground/40 font-mono text-xs">
          <Terminal className="w-6 h-6 mx-auto mb-2 animate-pulse text-primary/40" />
          Probing system...
        </div>
      )}

      {info && (
        <>
          {/* ── Stream capacity summary ────────────────────── */}
          <div className="console-pane rounded-lg p-4 sm:p-5">
            <SectionTitle icon={Zap} label="Stream Capacity" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Recommended 1080p", value: info.capacity.recommended1080p, sub: "simultaneous", color: "text-primary" },
                { label: "Recommended 720p",  value: info.capacity.recommended720p,  sub: "simultaneous", color: "text-primary" },
                { label: "Active Now",        value: info.streaming.active, sub: `of ${info.streaming.enabled} enabled`, color: info.streaming.active > 0 ? "text-green-400" : "text-muted-foreground/40" },
                { label: "Per 1080p Stream",  value: `~${info.capacity.bandwidthPer1080pMbps}`, sub: "Mbps upload", color: "text-foreground/70" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded border border-primary/10 bg-primary/3 text-center">
                  <p className="text-[9px] text-muted-foreground/50 font-mono uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={`font-display text-3xl leading-none ${item.color}`}>{item.value}</p>
                  <p className="text-[9px] text-muted-foreground/40 mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded border border-primary/10 bg-primary/3 p-3">
              <p className="text-[10px] text-muted-foreground/60 font-mono leading-relaxed">
                <span className="text-primary/70">▸ </span>
                {info.cpu.cores} CPU cores · {fmt(info.ram.total)} RAM · each 1080p stream uses ~2 cores + 512 MB · total needed for {info.capacity.recommended1080p} streams:{" "}
                <span className="text-foreground/80">{(info.capacity.recommended1080p * info.capacity.bandwidthPer1080pMbps).toFixed(1)} Mbps upload</span>
              </p>
            </div>
          </div>

          {/* ── Resource meters ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CPU */}
            <div className="console-pane rounded-lg p-4">
              <SectionTitle icon={Cpu} label="CPU" />
              <div className="mb-2">
                <span className="font-display text-4xl text-primary leading-none" data-testid="text-cpu-cores">{info.cpu.cores}</span>
                <span className="text-xs text-muted-foreground/50 font-mono ml-2">cores</span>
              </div>
              <StatRow label="Model" value={<span className="truncate max-w-[160px] block text-right text-[10px]" title={info.cpu.model}>{info.cpu.model}</span>} />
              <StatRow label="Architecture" value={info.cpu.arch} />
              <StatRow label="OS" value={`${info.os.type} (${info.os.platform})`} />
              <StatRow label="Kernel" value={info.os.release} />
              <StatRow label="System Uptime" value={fmtUptime(info.uptime.system)} />
              <StatRow label="Process Uptime" value={fmtUptime(info.uptime.process)} />
            </div>

            {/* RAM */}
            <div className="console-pane rounded-lg p-4">
              <SectionTitle icon={MemoryStick} label="RAM" />
              <div className="mb-2">
                <span className="font-display text-4xl text-primary leading-none" data-testid="text-ram-total">{fmt(info.ram.total)}</span>
              </div>
              <StatRow label="Used" value={fmt(info.ram.used)} />
              <StatRow label="Free" value={fmt(info.ram.free)} />
              <StatRow label="Usage" value={
                <Badge variant="secondary" className={`text-[10px] ${ramPct >= 90 ? "bg-destructive/15 text-destructive border-destructive/30" : ramPct >= 70 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-primary/10 text-primary border-primary/20"}`}>
                  {ramPct.toFixed(0)}%
                </Badge>
              } />
              <UsageBar pct={ramPct} />
              <p className="text-[9px] text-muted-foreground/40 font-mono mt-2">
                ~{Math.floor(info.ram.total / (512 * 1024 * 1024))} simultaneous streams possible by RAM
              </p>
            </div>

            {/* System Disk */}
            <div className="console-pane rounded-lg p-4">
              <SectionTitle icon={HardDrive} label="System Disk" />
              {info.disk.available ? (
                <>
                  <div className="mb-2">
                    <span className="font-display text-4xl text-primary leading-none" data-testid="text-disk-total">{fmt(info.disk.total)}</span>
                  </div>
                  <StatRow label="Used" value={fmt(info.disk.used)} />
                  <StatRow label="Free" value={fmt(info.disk.free)} />
                  <StatRow label="Usage" value={
                    <Badge variant="secondary" className={`text-[10px] ${diskPct >= 90 ? "bg-destructive/15 text-destructive border-destructive/30" : diskPct >= 70 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-primary/10 text-primary border-primary/20"}`}>
                      {diskPct.toFixed(0)}%
                    </Badge>
                  } />
                  <UsageBar pct={diskPct} />
                </>
              ) : (
                <p className="text-xs text-muted-foreground/40 font-mono">Disk stats unavailable</p>
              )}
            </div>

            {/* Upload storage */}
            <div className="console-pane rounded-lg p-4">
              <SectionTitle icon={Radio} label="Upload Storage" />
              <div className="mb-2">
                <span className="font-display text-4xl text-primary leading-none" data-testid="text-uploads-total">{fmt(info.uploads.limit)}</span>
              </div>
              <StatRow label="Used" value={fmt(info.uploads.used)} />
              <StatRow label="Free" value={fmt(info.uploads.limit - info.uploads.used)} />
              <StatRow label="Videos" value={`${info.uploads.videoCount} / ${info.uploads.maxVideos}`} />
              <StatRow label="Usage" value={
                <Badge variant="secondary" className={`text-[10px] ${uploadsPct >= 90 ? "bg-destructive/15 text-destructive border-destructive/30" : uploadsPct >= 70 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-primary/10 text-primary border-primary/20"}`}>
                  {uploadsPct.toFixed(0)}%
                </Badge>
              } />
              <UsageBar pct={uploadsPct} />
            </div>
          </div>

          {/* ── Environment checks ─────────────────────────── */}
          <div className="console-pane rounded-lg p-4 sm:p-5">
            <SectionTitle icon={Server} label="Environment Check" />
            <CheckRow ok={info.ffmpeg.available} label={`FFmpeg ${info.ffmpeg.available ? info.ffmpeg.version : "— not found"}`} detail={info.ffmpeg.available ? "Required for video encoding and RTMP streaming" : "Install FFmpeg: sudo apt install ffmpeg"} />
            <CheckRow ok={true} label={`Node.js ${info.node.version}`} detail="Server runtime" />
            <CheckRow ok={info.cpu.cores >= 2} label={`${info.cpu.cores} CPU core${info.cpu.cores !== 1 ? "s" : ""} detected`} detail={info.cpu.cores >= 2 ? "Sufficient for multi-platform streaming" : "Minimum 2 cores recommended"} />
            <CheckRow ok={info.ram.total >= 1024 * 1024 * 1024} label={`${fmt(info.ram.total)} total RAM`} detail={info.ram.total >= 1024 * 1024 * 1024 ? "Sufficient" : "1 GB minimum recommended"} />
            <CheckRow ok={info.disk.available ? info.disk.free > 5 * 1024 * 1024 * 1024 : null} label={info.disk.available ? `${fmt(info.disk.free)} free disk space` : "Disk free space unknown"} detail="5 GB minimum free recommended" />
            <CheckRow ok={info.uploads.videoCount < info.uploads.maxVideos} label={`Video slots: ${info.uploads.videoCount} / ${info.uploads.maxVideos} used`} detail={info.uploads.videoCount >= info.uploads.maxVideos ? "No more videos can be uploaded" : `${info.uploads.maxVideos - info.uploads.videoCount} slots remaining`} />
          </div>

          {/* ── Requirements table ─────────────────────────── */}
          <div className="console-pane rounded-lg p-4 sm:p-5">
            <SectionTitle icon={Wifi} label="Multi-Platform Requirements" />
            <p className="text-[10px] text-muted-foreground/50 font-mono mb-3">
              Requirements per simultaneous stream count using libx264 veryfast preset. Highlighted rows match your hardware.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-primary/15">
                    {["Streams","Resolution","CPU Cores","RAM","Upload","Fits You?"].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-[9px] text-muted-foreground/50 uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STREAM_TABLE.map((row, i) => {
                    const neededRamBytes = parseFloat(row.ram) * (row.ram.includes("GB") ? 1024 * 1024 * 1024 : 1024 * 1024);
                    const fits = info.cpu.cores >= row.cores && info.ram.total >= neededRamBytes;
                    const isCurrent = row.streams === info.streaming.active;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-primary/5 transition-colors ${fits ? "hover:bg-primary/5" : "opacity-40 hover:opacity-60"} ${isCurrent ? "ring-1 ring-inset ring-green-500/25" : ""}`}
                        data-testid={`row-capacity-${row.streams}-${row.res}`}
                      >
                        <td className="py-2 px-2 font-bold text-foreground/80">{row.streams}×</td>
                        <td className="py-2 px-2 text-muted-foreground/70">{row.res}</td>
                        <td className="py-2 px-2 text-muted-foreground/70">{row.cores}</td>
                        <td className="py-2 px-2 text-muted-foreground/70">{row.ram}</td>
                        <td className="py-2 px-2 text-muted-foreground/70">{row.bw} Mbps</td>
                        <td className="py-2 px-2">
                          {fits ? <span className="text-green-500">✓</span> : <span className="text-muted-foreground/30">✗</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Performance tips ───────────────────────────── */}
          <div className="console-pane rounded-lg p-4 sm:p-5">
            <SectionTitle icon={AlertCircle} label="Performance Tips" />
            <div className="space-y-2">
              {[
                "Use 720p profile instead of 1080p to halve CPU usage per stream.",
                "Close other processes on the VPS while streaming to free up CPU headroom.",
                "Pre-encode your videos to the target profile locally before uploading.",
                "Use a VPS with dedicated CPU cores, not shared/burstable.",
                "Ensure your upload bandwidth is at least 1.5× the total stream bitrate.",
                "Enable auto-reconnect (built-in) to recover from transient platform disconnects.",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary/50 font-mono text-[10px] mt-0.5 shrink-0">▸</span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
