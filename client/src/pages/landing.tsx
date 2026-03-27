import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Shield,
  Zap,
  Monitor,
  Clock,
  ArrowRight,
  Terminal,
  Wifi,
  Camera,
  Bell,
  Play,
  Video,
  RefreshCw,
  Activity,
  Server,
  Palette,
  Signal,
  ChevronRight,
} from "lucide-react";
import {
  SiYoutube,
  SiFacebook,
  SiRumble,
  SiTelegram,
} from "react-icons/si";

function useCountUp(target: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let frame = 0;
    const total = 60;
    const increment = target / total;
    const timer = setInterval(() => {
      frame++;
      setValue(Math.min(Math.round(increment * frame), target));
      if (frame >= total) clearInterval(timer);
    }, duration / total);
    return () => clearInterval(timer);
  }, [start, target, duration]);
  return value;
}

function StatCounter({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 1200, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-6xl sm:text-7xl text-primary glow leading-none">
        {count}{suffix}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 mt-2">{label}</div>
    </div>
  );
}

function TerminalWindow() {
  const lines = [
    { delay: 0,    text: "$ endlesscast --init",               color: "text-primary" },
    { delay: 600,  text: "[OK] Streaming engine loaded",       color: "text-foreground/70" },
    { delay: 900,  text: "[OK] FFmpeg encoder ready",          color: "text-foreground/70" },
    { delay: 1200, text: "[OK] RTMP endpoints configured (6)", color: "text-foreground/70" },
    { delay: 1500, text: "[OK] Health monitor active",         color: "text-foreground/70" },
    { delay: 1900, text: "$ endlesscast --stream --loop",      color: "text-primary" },
    { delay: 2400, text: "[LIVE] Broadcasting to 6 platforms", color: "text-green-400" },
    { delay: 2700, text: "[LIVE] Bitrate: 6000 kbps | FPS: 30", color: "text-green-400" },
    { delay: 3000, text: "[LIVE] Uptime: 04:32:18 | Health: ✓", color: "text-green-400" },
    { delay: 3300, text: "[AUTO] Loop iteration 3 started",    color: "text-primary/60" },
    { delay: 3600, text: "",                                   color: "text-primary", cursor: true },
  ];

  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timers = lines.map((l, i) =>
      setTimeout(() => setShown(i + 1), l.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="console-pane rounded-lg overflow-hidden">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-primary/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50 mx-auto tracking-widest">endlesscast — bash</span>
        <span className="led led-green" />
      </div>
      {/* Terminal body */}
      <div className="p-5 font-mono text-xs space-y-1.5 min-h-[240px]">
        {lines.slice(0, shown).map((line, i) => (
          <div key={i} className={line.color}>
            {line.cursor ? (
              <span className="flex items-center gap-1.5">
                <span className="text-primary">$</span>
                <span className="w-2 h-4 bg-primary animate-pulse inline-block" />
              </span>
            ) : line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

const platforms = [
  { name: "YouTube", Icon: SiYoutube,  color: "#ff0000" },
  { name: "Facebook", Icon: SiFacebook, color: "#1877f2" },
  { name: "Rumble",   Icon: SiRumble,   color: "#85c742" },
  { name: "Telegram", Icon: SiTelegram, color: "#26a5e4" },
  { name: "+ Any RTMP", Icon: Wifi,    color: "currentColor" },
];

const features = [
  {
    icon: Radio,
    title: "Multi-Platform RTMP",
    description: "Stream simultaneously to YouTube, Facebook, Rumble, Odysee, Twitter/X, and unlimited custom RTMP endpoints.",
    tag: "Core",
  },
  {
    icon: Clock,
    title: "24/7 Endless Loop",
    description: "Your video loops forever with automatic restart between iterations — no gaps, no downtime.",
    tag: "Core",
  },
  {
    icon: Video,
    title: "Per-Destination Video",
    description: "Assign a different video to each streaming destination. Run different content on YouTube vs. Facebook simultaneously.",
    tag: "Advanced",
  },
  {
    icon: Camera,
    title: "Picture-in-Picture",
    description: "Add a second video as a PiP overlay (extra camera) on top of your main stream — branded or raw.",
    tag: "Advanced",
  },
  {
    icon: Shield,
    title: "Auto-Reconnect",
    description: "When a platform drops your connection, EndlessCast detects and reconnects automatically — no manual intervention needed.",
    tag: "Reliability",
  },
  {
    icon: Activity,
    title: "Real-Time Health Monitor",
    description: "Live per-stream metrics: bitrate, FPS, dropped frames, and health status for every active endpoint.",
    tag: "Monitoring",
  },
  {
    icon: Bell,
    title: "Telegram & Email Alerts",
    description: "Get notified instantly on stream start, stop, and errors — via Telegram bot or Gmail SMTP.",
    tag: "Notifications",
  },
  {
    icon: RefreshCw,
    title: "Scheduled Streaming",
    description: "Set a fixed broadcast duration and EndlessCast will stop automatically after the timer ends.",
    tag: "Control",
  },
  {
    icon: Palette,
    title: "7 Color Themes",
    description: "Switch between Matrix, Cyber, Neon, Blood, Ocean, Amber, and Violet themes — or build your own.",
    tag: "UI",
  },
];

const tagColors: Record<string, string> = {
  Core:          "text-primary border-primary/30 bg-primary/8",
  Advanced:      "text-yellow-400 border-yellow-500/30 bg-yellow-500/8",
  Reliability:   "text-green-400 border-green-500/30 bg-green-500/8",
  Monitoring:    "text-cyan-400 border-cyan-500/30 bg-cyan-500/8",
  Notifications: "text-blue-400 border-blue-500/30 bg-blue-500/8",
  Control:       "text-orange-400 border-orange-500/30 bg-orange-500/8",
  UI:            "text-violet-400 border-violet-500/30 bg-violet-500/8",
};

const steps = [
  { n: "01", title: "Upload Videos", body: "Drag & drop your MP4/MKV files. Multi-file upload with per-file progress bars. Up to 4 video slots." },
  { n: "02", title: "Configure Endpoints", body: "Add RTMP destinations — YouTube stream key, Facebook, Rumble, or any custom URL. Toggle per-endpoint video overrides." },
  { n: "03", title: "Go Live", body: "Hit Start and walk away. EndlessCast streams 24/7, auto-recovers from errors, and notifies you if anything needs attention." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,_hsl(var(--primary)/0.08),_transparent)] pointer-events-none z-0" />
      <div className="scanlines fixed inset-0 pointer-events-none z-0 opacity-20" />

      <div className="relative z-10">
        {/* ── Header ──────────────────────────────────────────── */}
        <header className="border-b border-primary/15 bg-background/85 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded border border-primary/40 flex items-center justify-center bg-primary/10">
                <Radio className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-primary glow-sm" data-testid="text-logo">
                EndlessCast
              </span>
              <span className="hidden sm:block text-[9px] font-mono text-muted-foreground/40 tracking-widest">// 24/7 BROADCAST ENGINE</span>
            </div>
            <Link href="/login">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] font-mono tracking-widest uppercase border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                data-testid="button-login-header"
              >
                <Terminal className="w-3 h-3 mr-1.5" />
                Access Terminal
              </Button>
            </Link>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-primary/25 bg-primary/8">
                <span className="led led-green" />
                <span className="text-[9px] font-mono text-green-400 tracking-[0.3em] uppercase">System Online</span>
              </div>

              <div className="space-y-2">
                <div className="font-display text-6xl sm:text-7xl lg:text-8xl text-primary glow leading-none">
                  ENDLESS
                </div>
                <div className="font-display text-6xl sm:text-7xl lg:text-8xl text-foreground/80 leading-none">
                  CAST
                </div>
                <p className="text-xs font-mono text-muted-foreground/50 tracking-[0.3em] uppercase pt-1">
                  24/7 Multi-Platform Broadcast Engine
                </p>
              </div>

              <p className="text-sm text-muted-foreground/70 font-mono leading-relaxed max-w-md">
                Upload your videos, add your RTMP stream keys, and broadcast to{" "}
                <span className="text-foreground/90">every platform simultaneously</span> — forever.
                Auto-reconnect, PiP overlays, per-destination video, health monitoring,
                and instant alerts included.
              </p>

              {/* Platform strip */}
              <div className="flex items-center gap-4 flex-wrap">
                {platforms.map(({ name, Icon, color }) => (
                  <div key={name} className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                    <span className="text-[10px] font-mono">{name}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="text-sm font-mono tracking-widest uppercase box-glow h-11 px-6"
                    data-testid="button-get-started"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Initialize System
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — terminal window */}
            <div className="lg:block">
              <TerminalWindow />
            </div>
          </div>
        </section>

        {/* ── Stats bar ───────────────────────────────────────── */}
        <section className="border-y border-primary/10 bg-primary/3 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
              <StatCounter value={6}    suffix="+"  label="Platforms Supported" />
              <StatCounter value={24}   suffix="/7" label="Continuous Streaming" />
              <StatCounter value={4}          label="Video Slots" />
              <StatCounter value={100}  suffix="%" label="Auto-Recovery" />
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/20" />
              <span className="text-[9px] font-mono tracking-[0.4em] text-muted-foreground/40 uppercase">Capabilities</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/20" />
            </div>
            <h2 className="font-display text-5xl sm:text-6xl text-center text-foreground/80 leading-none">
              FEATURES
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const tagCls = tagColors[feature.tag] || "text-primary border-primary/30 bg-primary/8";
              return (
                <div
                  key={feature.title}
                  className="console-pane rounded-lg p-5 hover:border-l-primary/80 transition-all duration-200 group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  data-testid={`card-feature-${i}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded border border-primary/20 flex items-center justify-center bg-primary/8 group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border tracking-widest uppercase ${tagCls}`}>
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-mono font-bold text-foreground/90 mb-1.5">{feature.title}</h3>
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────── */}
        <section className="py-20 border-t border-primary/10 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/20" />
              <span className="text-[9px] font-mono tracking-[0.4em] text-muted-foreground/40 uppercase">Protocol</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/20" />
            </div>
            <h2 className="font-display text-5xl sm:text-6xl text-center text-foreground/80 leading-none">
              3 STEPS
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary/20 to-transparent z-10" style={{ width: "calc(100% - 2rem)", left: "calc(50% + 2rem)" }} />
                )}
                <div className="console-pane rounded-lg p-5">
                  <div className="font-display text-5xl text-primary/20 leading-none mb-4">{step.n}</div>
                  <h3 className="text-sm font-mono font-bold text-foreground/90 mb-2">{step.title}</h3>
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live terminal demo ──────────────────────────────── */}
        <section className="py-16 border-t border-primary/10 px-4 sm:px-6 bg-primary/3">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <span className="text-[9px] font-mono tracking-[0.4em] text-muted-foreground/40 uppercase">Live Output</span>
            </div>
            <div className="console-pane rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/10 bg-muted/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/40 mx-auto">endlesscast — stream status</span>
                <div className="flex items-center gap-1.5">
                  <span className="led led-green" />
                  <span className="text-[9px] font-mono text-green-400">LIVE</span>
                </div>
              </div>
              <div className="p-5 font-mono text-xs space-y-1.5">
                {[
                  { t: "text-muted-foreground/40", v: "# Stream status at 2026-03-27 14:32:18 UTC" },
                  { t: "text-green-400", v: "[●] youtube-main     → rtmp://a.rtmp.youtube.com/live2/xxxx  [6.1 Mbps | 30fps]" },
                  { t: "text-green-400", v: "[●] facebook-page    → rtmps://live-api.facebook.com/xxxx    [6.0 Mbps | 30fps]" },
                  { t: "text-primary/70", v: "[●] rumble-channel   → rtmp://live.rumble.com/xxxx           [4.5 Mbps | 30fps]" },
                  { t: "text-primary/70", v: "[●] odysee-live      → rtmp://stream.odysee.com/xxxx         [4.5 Mbps | 30fps]" },
                  { t: "text-primary/70", v: "[●] twitter-stream   → rtmps://api.twitter.com/xxxx          [2.5 Mbps | 30fps]" },
                  { t: "text-primary/70", v: "[●] custom-1         → rtmp://myserver.io:1935/live/key       [6.0 Mbps | 30fps]" },
                  { t: "text-muted-foreground/40", v: "" },
                  { t: "text-foreground/70", v: "Loop iteration  : 3 / ∞" },
                  { t: "text-foreground/70", v: "Uptime          : 04:32:18" },
                  { t: "text-green-400",    v: "Health          : ✓ All endpoints nominal" },
                  { t: "text-muted-foreground/40", v: "" },
                  { t: "text-primary/50",  v: "$ _" },
                ].map((line, i) => (
                  <div key={i} className={line.t}>{line.v || "\u00a0"}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="py-24 border-t border-primary/10 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <div className="font-display text-6xl sm:text-7xl text-primary glow leading-none mb-2">GO LIVE</div>
              <p className="text-xs font-mono text-muted-foreground/50 tracking-widest uppercase">No configuration limits. No monthly fees. Self-hosted.</p>
            </div>
            <p className="text-sm text-muted-foreground/60 max-w-md mx-auto font-mono">
              Upload a video, add your stream keys, click Start. That's it.
              EndlessCast handles the rest — forever.
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="text-sm font-mono tracking-widest uppercase box-glow h-12 px-8"
                data-testid="button-cta-bottom"
              >
                <Terminal className="w-4 h-4 mr-2" />
                Access Control Panel
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="border-t border-primary/10 py-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-primary/60" />
              <span className="text-[10px] font-mono text-muted-foreground/40 tracking-widest uppercase">EndlessCast v1.0</span>
            </div>
            <div className="flex items-center gap-6 text-[9px] font-mono text-muted-foreground/30 tracking-widest uppercase">
              <span>24/7 Streaming</span>
              <span>Self-Hosted</span>
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-primary/40" />
              <span className="text-[9px] font-mono text-muted-foreground/30">Broadcast Engine Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
