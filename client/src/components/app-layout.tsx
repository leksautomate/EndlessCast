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

  const handleLogout = () => {
    onLogout();
    setLocation("/login");
  };

  const isActive = (href: string) => {
    if (href === "/app") return location === "/app" || location === "/app/";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none z-0" />
      <div className="scanlines pointer-events-none fixed inset-0 z-0" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          w-56 border-r border-primary/20 bg-background/95 backdrop-blur
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-primary/20 flex-shrink-0">
          <div className="relative">
            <div className="w-8 h-8 rounded border border-primary/50 flex items-center justify-center bg-primary/10 box-glow-sm">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            {isLive && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border border-background" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary glow-sm leading-none" data-testid="text-sidebar-title">
              ENDLESSCAST
            </h1>
            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
              <span className="text-primary">SYS</span>::CTRL
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto h-7 w-7 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Live badge */}
        {isLive && (
          <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-1.5 rounded border border-green-500/30 bg-green-500/10">
            <Activity className="w-3 h-3 text-green-500 animate-pulse" />
            <span className="text-xs text-green-500 font-mono font-bold">LIVE</span>
            <span className="text-xs text-green-500/60 font-mono ml-auto">ON AIR</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest px-2 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-all
                    ${active
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1 h-4 rounded-full bg-primary" />
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* System info */}
        <div className="px-3 py-2 border-t border-primary/10 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <Clock className="w-3 h-3 text-primary" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <Shield className="w-3 h-3 text-green-500" />
            <span className="text-green-500">SECURE</span>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-2 border-t border-primary/10 flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                data-testid="button-theme-selector"
              >
                <Palette className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48 border-primary/30">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-mono">
                <span className="text-primary">&gt;</span> COLOR_THEME
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/20" />
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
                      className="w-3 h-3 rounded-full border border-foreground/20"
                      style={{ backgroundColor: themePresets[themeKey].primary }}
                    />
                    <span>{themePresets[themeKey].name}</span>
                    {theme === themeKey && <Zap className="w-3 h-3 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 ml-auto"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 relative z-10">
        {/* Mobile top bar */}
        <header className="h-14 border-b border-primary/20 px-4 flex items-center gap-3 lg:hidden bg-background/95 backdrop-blur sticky top-0 z-20">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-sidebar-open"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary font-mono">ENDLESSCAST</span>
          </div>
          {isLive && (
            <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded border border-green-500/30 bg-green-500/10">
              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              <span className="text-xs text-green-500 font-mono font-bold">LIVE</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
