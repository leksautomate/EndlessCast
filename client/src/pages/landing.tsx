import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Radio, 
  Shield, 
  Zap, 
  Monitor, 
  Clock,
  ArrowRight,
  Terminal,
  Wifi
} from "lucide-react";

function MatrixRain() {
  const [columns, setColumns] = useState<number[]>([]);
  
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()";
    const numColumns = Math.floor(window.innerWidth / 20);
    const newColumns = Array.from({ length: numColumns }, (_, i) => i);
    setColumns(newColumns);
  }, []);

  return (
    <div className="matrix-rain">
      {columns.map((col) => (
        <div
          key={col}
          className="matrix-column"
          style={{
            left: `${col * 20}px`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          {Array.from({ length: 30 }, () => 
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
          ).join("\n")}
        </div>
      ))}
    </div>
  );
}

function TypingText({ text, className = "" }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);

    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(cursorTimer);
    };
  }, [text]);

  return (
    <span className={className}>
      {displayText}
      <span className={showCursor ? "opacity-100" : "opacity-0"}>_</span>
    </span>
  );
}

const features = [
  {
    icon: Radio,
    title: "Multi-Platform Streaming",
    description: "Stream to YouTube, Facebook, Rumble, Odysee, Twitter/X, and custom RTMP endpoints simultaneously."
  },
  {
    icon: Clock,
    title: "24/7 Endless Streaming",
    description: "Loop your video content endlessly with automatic restart and recovery from errors."
  },
  {
    icon: Shield,
    title: "Auto-Recovery System",
    description: "Intelligent error detection with automatic stream restart to keep your broadcast running."
  },
  {
    icon: Monitor,
    title: "Real-Time Monitoring",
    description: "Live dashboard showing bitrate, FPS, dropped frames, and health metrics for each stream."
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description: "Get Telegram and email alerts for stream starts, stops, and any errors that occur."
  },
  {
    icon: Terminal,
    title: "Hacker-Style Interface",
    description: "Customizable terminal-inspired UI with multiple color themes to match your style."
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />
      
      <div className="relative z-10">
        <header className="border-b border-primary/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border border-primary/50 flex items-center justify-center bg-primary/10">
                <Wifi className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-primary glow-sm" data-testid="text-logo">
                EndlessCast
              </span>
            </div>
            <Link href="/login">
              <Button variant="outline" className="border-primary/50 hover:bg-primary/10" data-testid="button-login-header">
                <Terminal className="w-4 h-4 mr-2" />
                Access Terminal
              </Button>
            </Link>
          </div>
        </header>

        <main>
          <section className="py-20 md:py-32">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-primary/30 bg-primary/5 text-primary text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  SYSTEM ONLINE
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="text-foreground">Endless </span>
                  <span className="text-primary glow">Live Streaming</span>
                  <br />
                  <span className="text-foreground">Made </span>
                  <span className="text-primary glow">Simple</span>
                </h1>

                <div className="text-xl md:text-2xl text-muted-foreground font-mono h-8">
                  <TypingText 
                    text="> Initialize 24/7 broadcast protocol..." 
                    className="text-primary/80"
                  />
                </div>

                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Upload your videos, configure your RTMP endpoints, and let EndlessCast 
                  handle the rest. Multi-platform streaming with automatic error recovery 
                  and real-time monitoring.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link href="/login">
                    <Button size="lg" className="text-lg px-8 box-glow" data-testid="button-get-started">
                      <Play className="w-5 h-5 mr-2" />
                      Initialize System
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>

                <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Multi-Platform
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Auto-Recovery
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Real-Time Stats
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 border-t border-primary/10">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-primary glow-sm">&lt;</span>
                  System Features
                  <span className="text-primary glow-sm">/&gt;</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Powerful streaming capabilities wrapped in a terminal-inspired interface
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card 
                    key={feature.title}
                    className="p-6 bg-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 card-hover fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    data-testid={`card-feature-${index}`}
                  >
                    <div className="w-12 h-12 rounded border border-primary/30 flex items-center justify-center bg-primary/10 mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 border-t border-primary/10">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <Card className="p-8 bg-card/50 border-primary/30">
                  <div className="font-mono text-sm space-y-2 text-muted-foreground">
                    <div className="text-primary">$ endlesscast --init</div>
                    <div>[OK] Loading streaming engine...</div>
                    <div>[OK] Connecting to RTMP servers...</div>
                    <div>[OK] Initializing video processor...</div>
                    <div>[OK] Health monitoring active...</div>
                    <div className="text-primary pt-2">$ endlesscast --start</div>
                    <div className="text-green-500">[LIVE] Stream is now broadcasting to 6 platforms</div>
                    <div className="text-green-500">[LIVE] Bitrate: 6000 kbps | FPS: 30 | Health: 100%</div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-primary">$</span>
                      <span className="w-2 h-4 bg-primary animate-pulse" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20 border-t border-primary/10">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Go <span className="text-primary glow">Live</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Start your endless streaming journey with just a few clicks.
                Upload, configure, and broadcast.
              </p>
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 box-glow" data-testid="button-cta-bottom">
                  <Terminal className="w-5 h-5 mr-2" />
                  Access Control Panel
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-primary/20 py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <span>EndlessCast v1.0</span>
              </div>
              <div>
                <span className="text-primary">&gt;</span> 24/7 Streaming Platform
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
