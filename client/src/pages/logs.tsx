import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, ChevronRight, Trash2, RefreshCw, AlertCircle, Info, AlertTriangle } from "lucide-react";
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
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Terminal className="w-3 h-3 text-primary" />
        <span className="text-primary">root@endlesscast</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">event-log</span>
        <span className="animate-pulse">_</span>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3 border-b border-primary/10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-primary">&gt;</span> EVENT_LOG
              {isFetching && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || logs.length === 0}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              data-testid="button-clear-logs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-3 flex-wrap">
            {(["all", "info", "warn", "error"] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                  filter === level
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "text-muted-foreground border-muted/30 hover:text-foreground hover:border-muted/60"
                }`}
                data-testid={`filter-logs-${level}`}
              >
                {level.toUpperCase()}
                <span className="ml-1 opacity-60">({counts[level]})</span>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Terminal className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground font-mono">
                {logs.length === 0 ? "No events logged yet" : "No events match this filter"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Events are logged as streams start, stop, and encounter errors
              </p>
            </div>
          ) : (
            <div className="divide-y divide-primary/5 font-mono text-xs max-h-[600px] overflow-y-auto">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-3 px-4 py-2.5 hover:bg-primary/3 transition-colors ${
                    entry.level === "error"
                      ? "border-l-2 border-destructive/50"
                      : entry.level === "warn"
                      ? "border-l-2 border-yellow-500/40"
                      : "border-l-2 border-transparent"
                  }`}
                  data-testid={`log-entry-${entry.id}`}
                >
                  <LevelBadge level={entry.level} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground text-[10px] shrink-0">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      {entry.endpoint && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-3.5 px-1 font-mono text-muted-foreground border-muted/30 shrink-0"
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
                        : "text-foreground"
                    }`}>
                      {entry.message}
                    </p>
                    {entry.detail && entry.detail !== entry.message && (
                      <p className="text-muted-foreground text-[10px] mt-0.5 truncate" title={entry.detail}>
                        {entry.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
