import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  Wifi,
  Camera,
  Bell,
  Play,
  Video,
  RefreshCw,
  Activity,
} from "lucide-react";
import {
  SiYoutube,
  SiFacebook,
  SiRumble,
  SiTelegram,
} from "react-icons/si";

const platforms = [
  { name: "YouTube", Icon: SiYoutube, color: "#ff0000" },
  { name: "Facebook", Icon: SiFacebook, color: "#1877f2" },
  { name: "Rumble", Icon: SiRumble, color: "#85c742" },
  { name: "Telegram", Icon: SiTelegram, color: "#26a5e4" },
  { name: "+ Any RTMP", Icon: Wifi, color: "currentColor" },
];

const features = [
  {
    icon: Radio,
    title: "Multi-Platform Streaming",
    description: "Stream simultaneously to YouTube, Facebook, Rumble, Odysee, Twitter/X, and any custom RTMP endpoint.",
  },
  {
    icon: Clock,
    title: "24/7 Endless Loop",
    description: "Your video loops continuously with automatic restart — no gaps, no downtime, no manual intervention.",
  },
  {
    icon: Video,
    title: "Per-Destination Video",
    description: "Assign a different video to each streaming destination. Run different content on each platform.",
  },
  {
    icon: Camera,
    title: "Picture-in-Picture",
    description: "Add a second video as a PiP overlay on your main stream for branding or multi-angle content.",
  },
  {
    icon: Shield,
    title: "Auto-Reconnect",
    description: "Automatic detection and reconnection when a platform drops — your streams stay live without intervention.",
  },
  {
    icon: Activity,
    title: "Live Health Monitor",
    description: "Real-time metrics per stream: bitrate, FPS, dropped frames, and overall health status.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description: "Get notified on stream start, stop, and errors via Telegram bot or email alerts.",
  },
  {
    icon: RefreshCw,
    title: "Scheduled Streaming",
    description: "Set a broadcast duration and EndlessCast stops automatically when the timer completes.",
  },
];

const steps = [
  { n: "1", title: "Upload Videos", body: "Drag & drop your video files. Multi-file upload with progress tracking." },
  { n: "2", title: "Add Destinations", body: "Configure your RTMP endpoints — YouTube, Facebook, Rumble, or any custom URL." },
  { n: "3", title: "Go Live", body: "Hit Start and walk away. EndlessCast handles 24/7 streaming with auto-recovery." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <span className="text-base font-semibold text-foreground" data-testid="text-logo">
              EndlessCast
            </span>
          </div>
          <Link href="/login">
            <Button size="sm" data-testid="button-login-header">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-primary">24/7 Multi-Platform Broadcasting</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Stream to every platform,{" "}
            <span className="text-primary">continuously</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Upload your videos, add your stream keys, and broadcast to every platform simultaneously — forever.
            Self-hosted, no monthly fees.
          </p>

          <div className="flex items-center justify-center gap-5 flex-wrap">
            {platforms.map(({ name, Icon, color }) => (
              <div key={name} className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base" data-testid="button-get-started">
                <Play className="w-4 h-4 mr-2" />
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { value: "6+", label: "Platforms" },
              { value: "24/7", label: "Streaming" },
              { value: "4", label: "Video Slots" },
              { value: "100%", label: "Auto-Recovery" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Everything you need to broadcast
          </h2>
          <p className="text-muted-foreground mt-3 text-lg max-w-lg mx-auto">
            Powerful features for reliable, continuous multi-platform streaming
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
                data-testid={`card-feature-${i}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-20 border-t border-border/50 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Up and running in minutes
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">Three simple steps to go live</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">{step.n}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 border-t border-border/50 bg-card/30 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Ready to go live?
          </h2>
          <p className="text-lg text-muted-foreground">
            No configuration limits. No monthly fees. Fully self-hosted.
          </p>
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 text-base" data-testid="button-cta-bottom">
              <Zap className="w-4 h-4 mr-2" />
              Open Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">EndlessCast v1.0</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>24/7 Streaming</span>
            <span>Self-Hosted</span>
            <span>Open Source</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
