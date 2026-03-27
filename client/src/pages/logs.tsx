import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Trash2, RefreshCw, AlertCircle, Info, AlertTriangle } from "lucide-react";
import type { LogEntry, LogLevel } from "@shared/schema";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function LevelBadge({ level }: { level: LogLevel }) {
  if (level === "error") {
    return (
      <Badge variant="destructive" className="text-[10px] h-4 px-1 gap-0.5 font-mono shrink-0">
        <AlertCircle className="w-2.5 h-2.5" />
        ERR
      </Badge>
    );
  }
  if (level === "warn") {
    return (
      <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-0.5 font-mono shrink-0 bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
        <AlertTriangle className="w-2.5 h-2.5" />
        WARN
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-0.5 font-mono shrink-0 bg-primary/10 text-primary border-primary/20">
      <Info className="w-2.5 h-2.5" />
      INFO
    </Badge>
  );
}

type FilterLevel = "all" | LogLevel;

export default function Logs() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterLevel>("all");

  const { data: logs = [], isFetching } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 5000,
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/logs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({ title: "Logs Cleared", description: "Event log has been cleared." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const filtered = filter === "all" ? logs : logs.filter(l => l.level === filter);

  const counts = {
    all: logs.length,
    info: logs.filter(l => l.level === "info").length,
    warn: logs.filter(l => l.level === "warn").length,
    error: logs.filter(l => l.level === "error").length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="console-pane rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-primary/10 flex-wrap">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">Event Log</span>
            {isFetching && <RefreshCw className="w-3 h-3 text-muted-foreground/50 animate-spin" />}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex gap-1">
              {(["all", "info", "warn", "error"] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-colors ${
                    filter === level
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "text-muted-foreground/50 border-muted/20 hover:text-foreground hover:border-muted/40"
                  }`}
                  data-testid={`filter-logs-${level}`}
                >
                  {level.toUpperCase()}
                  <span className="ml-1 opacity-50">({counts[level]})</span>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || logs.length === 0}
              className="h-6 text-[10px] px-2 text-muted-foreground/50 hover:text-destructive"
              data-testid="button-clear-logs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Log entries */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Terminal className="w-7 h-7 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground/50 font-mono">
              {logs.length === 0 ? "No events logged yet" : "No events match this filter"}
            </p>
            <p className="text-[10px] text-muted-foreground/30 font-mono mt-1">
              Events log as streams start, stop, and encounter errors
            </p>
          </div>
        ) : (
          <div className="divide-y divide-primary/5 font-mono text-xs max-h-[68vh] overflow-y-auto">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-start gap-3 px-4 py-2.5 hover:bg-primary/3 transition-colors ${
                  entry.level === "error"
                    ? "border-l-2 border-destructive/40"
                    : entry.level === "warn"
                    ? "border-l-2 border-yellow-500/30"
                    : "border-l-2 border-transparent"
                }`}
                data-testid={`log-entry-${entry.id}`}
              >
                <LevelBadge level={entry.level} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground/40 text-[10px] shrink-0">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    {entry.endpoint && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-3.5 px-1 font-mono text-muted-foreground/50 border-muted/20 shrink-0"
                      >
                        {entry.endpoint}
                      </Badge>
                    )}
                  </div>
                  <p className={`mt-0.5 ${
                    entry.level === "error"
                      ? "text-destructive"
                      : entry.level === "warn"
                      ? "text-yellow-400"
                      : "text-foreground/80"
                  }`}>
                    {entry.message}
                  </p>
                  {entry.detail && entry.detail !== entry.message && (
                    <p className="text-muted-foreground/40 text-[10px] mt-0.5 truncate" title={entry.detail}>
                      {entry.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
