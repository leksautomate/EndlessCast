import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTheme, themePresets } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  Radio,
  MonitorPlay,
  Server,
  Settings,
  LogOut,
  Palette,
  Zap,
  Clock,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  ScrollText,
  Cpu,
  Signal,
} from "lucide-react";
import type { StreamingState } from "@shared/schema";
import type { ThemeColor } from "@shared/schema";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  shortLabel: string;
}

const navItems: NavItem[] = [
  { href: "/app", icon: LayoutDashboard, label: "Overview", shortLabel: "Overview" },
  { href: "/app/videos", icon: MonitorPlay, label: "Videos", shortLabel: "Videos" },
  { href: "/app/destinations", icon: Server, label: "Destinations", shortLabel: "Dest." },
  { href: "/app/system", icon: Cpu, label: "System", shortLabel: "System" },
  { href: "/app/logs", icon: ScrollText, label: "Event Log", shortLabel: "Logs" },
  { href: "/app/settings", icon: Settings, label: "Settings", shortLabel: "Settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return currentTime;
}

export function AppLayout({ children, onLogout }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const currentTime = useCurrentTime();

  const { data: streamingState } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  const isLive = streamingState?.isStreaming || false;
  const liveCount = streamingState?.endpointStatuses?.filter(s => s.status === "live").length ?? 0;

  const handleLogout = () => {
    onLogout();
    setLocation("/login");
  };

  const isActive = (href: string) => {
    if (href === "/app") return location === "/app" || location === "/app/";
    return location.startsWith(href);
  };

  const currentNavLabel = navItems.find(n => isActive(n.href))?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Atmospheric background */}
      <div className="fixed inset-0 dot-grid pointer-events-none z-0 opacity-60" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_hsl(var(--primary)/0.06),_transparent)] pointer-events-none z-0" />
      <div className="scanlines pointer-events-none fixed inset-0 z-0 opacity-30" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          w-56 bg-background/98 backdrop-blur
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          ${isLive
            ? "border-r border-r-green-500/25"
            : "border-r border-r-primary/15"
          }
        `}
      >
        {/* Live ambient strip on the left edge of sidebar */}
        {isLive && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-500/60 to-transparent animate-pulse" />
        )}

        {/* ── Brand ─────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b flex-shrink-0 ${isLive ? "border-b-green-500/15" : "border-b-primary/12"}`}>
          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 rounded flex items-center justify-center border ${
              isLive
                ? "bg-green-500/15 border-green-500/40 box-glow-sm"
                : "bg-primary/10 border-primary/30"
            }`}>
              <Radio className={`w-4 h-4 ${isLive ? "text-green-500" : "text-primary"}`} />
            </div>
            {isLive && (
              <span className="led led-green absolute -top-1 -right-1" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[11px] font-bold tracking-[0.2em] text-primary glow-sm leading-none uppercase">
                EndlessCast
              </h1>
            </div>
            <p className="text-[9px] font-mono text-muted-foreground mt-1 tracking-widest">
              {isLive
                ? <span className="text-green-500 font-bold">● BROADCASTING</span>
                : <span>◯ STANDBY</span>
              }
            </p>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden h-6 w-6 flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* ── Live status strip ─────────────────────────────── */}
        {isLive && (
          <div className="mx-3 mt-3 px-3 py-2 rounded border border-green-500/25 bg-green-500/8 live-border-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                <span className="text-[10px] text-green-500 font-mono font-bold tracking-widest">ON AIR</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3].map(i => (
                  <span
                    key={i}
                    className="signal-bar"
                    style={{
                      width: "3px",
                      height: `${i * 4 + 4}px`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[9px] text-green-500/70 font-mono mt-1">
              {liveCount} endpoint{liveCount !== 1 ? "s" : ""} streaming
            </p>
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────── */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[8px] text-muted-foreground/50 font-mono uppercase tracking-[0.3em] px-3 mb-3">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`
                    relative flex items-center gap-3 px-3 py-2 rounded text-[11px] font-mono transition-all duration-150
                    ${active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/20"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  {active && <span className="nav-active-bar" />}
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                  <span className={active ? "font-semibold tracking-wide" : ""}>{item.label}</span>
                  {active && (
                    <span className="ml-auto text-primary font-bold text-[10px] opacity-60">▸</span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* ── System info ───────────────────────────────────── */}
        <div className="px-3 py-3 border-t border-primary/8 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-2.5 h-2.5 text-primary/60 flex-shrink-0" />
            <span className="font-display text-lg text-primary/80 leading-none glow-sm">
              {currentTime.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-2.5 h-2.5 text-green-500/60 flex-shrink-0" />
            <span className="text-[9px] font-mono text-green-500/60 tracking-widest uppercase">Secure Session</span>
          </div>
        </div>

        {/* ── Bottom actions ────────────────────────────────── */}
        <div className="px-2 py-2 border-t border-primary/8 flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 flex-shrink-0 text-muted-foreground/60 hover:text-primary"
                data-testid="button-theme-selector"
              >
                <Palette className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48 border-primary/20">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">
                Color Theme
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/15" />
              {(Object.keys(themePresets) as ThemeColor[])
                .filter((t) => t !== "custom")
                .map((themeKey) => (
                  <DropdownMenuItem
                    key={themeKey}
                    onClick={() => setTheme(themeKey)}
                    className="flex items-center gap-3 font-mono text-xs"
                    data-testid={`menu-theme-${themeKey}`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-foreground/10 flex-shrink-0"
                      style={{ backgroundColor: themePresets[themeKey].primary, boxShadow: `0 0 6px ${themePresets[themeKey].primary}` }}
                    />
                    <span>{themePresets[themeKey].name}</span>
                    {theme === themeKey && <Zap className="w-3 h-3 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground/50 hover:text-destructive flex-shrink-0"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* ── Persistent top status bar ────────────────────────── */}
        <header className={`
          h-10 border-b flex items-center px-4 gap-4 sticky top-0 z-20
          bg-background/95 backdrop-blur-md
          ${isLive ? "border-b-green-500/20" : "border-b-primary/10"}
        `}>
          {/* Mobile hamburger */}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 lg:hidden flex-shrink-0 text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-sidebar-open"
          >
            <Menu className="w-4 h-4" />
          </Button>

          {/* Mobile brand (hidden on desktop) */}
          <div className="flex items-center gap-2 lg:hidden">
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono font-bold text-primary tracking-[0.2em] uppercase">EndlessCast</span>
          </div>

          {/* Breadcrumb path */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60">
            <span className="text-primary/60">root@endlesscast</span>
            <span>/</span>
            <span className="text-foreground/80">{currentNavLabel.toLowerCase()}</span>
            <span className="animate-pulse text-primary">▌</span>
          </div>

          <div className="flex-1" />

          {/* Stream status pills */}
          <div className="flex items-center gap-3">
            {isLive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-green-500/30 bg-green-500/10">
                <span className="led led-green" />
                <span className="text-[10px] font-mono font-bold text-green-500 tracking-widest">LIVE</span>
                <span className="text-[10px] font-mono text-green-500/60">{liveCount}ch</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-muted/30 bg-muted/10">
                <span className="led led-muted" />
                <span className="text-[10px] font-mono text-muted-foreground/50 tracking-widest">OFFLINE</span>
              </div>
            )}
            <span className="hidden sm:block font-display text-base text-primary/50 leading-none">
              {currentTime.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
