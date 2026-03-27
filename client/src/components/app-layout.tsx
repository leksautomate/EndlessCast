import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Radio,
  MonitorPlay,
  Server,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ScrollText,
  Cpu,
} from "lucide-react";
import type { StreamingState } from "@shared/schema";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/app", icon: LayoutDashboard, label: "Overview" },
  { href: "/app/videos", icon: MonitorPlay, label: "Videos" },
  { href: "/app/destinations", icon: Server, label: "Destinations" },
  { href: "/app/system", icon: Cpu, label: "System" },
  { href: "/app/logs", icon: ScrollText, label: "Event Log" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export function AppLayout({ children, onLogout }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          w-60 border-r
          ${isLive ? "border-green-500/15" : "border-sidebar-border"}
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        style={{ background: "linear-gradient(180deg, hsl(var(--sidebar)) 0%, color-mix(in hsl, hsl(var(--sidebar)) 90%, transparent) 100%)" }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border flex-shrink-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isLive ? "bg-green-500/15 shadow-[0_0_12px_rgba(34,197,94,0.2)]" : "bg-primary/10"
          }`}>
            <Radio className={`w-5 h-5 ${isLive ? "text-green-500" : "text-primary"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-bold text-foreground leading-none tracking-tight">
              EndlessCast
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              {isLive ? (
                <span className="text-green-500 font-medium flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  Live · {liveCount} ch
                </span>
              ) : (
                <span className="opacity-40">Offline</span>
              )}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden h-7 w-7 flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
            data-testid="button-sidebar-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150
                    ${active
                      ? "rounded-r-lg bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[10px]"
                      : "rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : "opacity-60"}`} />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`
          h-14 border-b flex items-center px-4 gap-4 sticky top-0 z-20
          bg-background/95 backdrop-blur-md
          ${isLive ? "border-b-green-500/20" : "border-b-border/50"}
        `}>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 lg:hidden flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-sidebar-open"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 lg:hidden">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">EndlessCast</span>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-base font-semibold text-foreground">{currentNavLabel}</h2>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {isLive ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs font-semibold text-green-500">LIVE</span>
                <span className="text-xs text-green-500/70">{liveCount}ch</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span className="text-xs text-muted-foreground">Offline</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
