import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Loader2 } from "lucide-react";
import { SiYoutube, SiFacebook } from "react-icons/si";
import type { RtmpEndpoint, StreamingState, RtmpPlatform, StreamStatus } from "@shared/schema";
import { platformInfo } from "@shared/schema";

interface StatusDashboardProps {
  endpoints: RtmpEndpoint[];
  streamingState: StreamingState | undefined;
}

function PlatformIcon({ platform, className }: { platform: RtmpPlatform; className?: string }) {
  switch (platform) {
    case "youtube":
      return <SiYoutube className={className} style={{ color: platformInfo.youtube.color }} />;
    case "facebook":
      return <SiFacebook className={className} style={{ color: platformInfo.facebook.color }} />;
    case "rumble":
      return (
        <div className={`font-bold ${className}`} style={{ color: platformInfo.rumble.color }}>
          R
        </div>
      );
    case "odysee":
      return (
        <div className={`font-bold ${className}`} style={{ color: platformInfo.odysee.color }}>
          O
        </div>
      );
    case "twitter":
      return (
        <div className={`font-bold ${className}`}>
          X
        </div>
      );
    default:
      return <Activity className={className} />;
  }
}


function getStatusBadge(status: StreamStatus["status"]) {
  switch (status) {
    case "live":
      return (
        <Badge variant="secondary" className="bg-status-online/10 text-status-online border-status-online/20">
          <span className="relative flex h-2 w-2 mr-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-online opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-online"></span>
          </span>
          Live
        </Badge>
      );
    case "connecting":
      return (
        <Badge variant="secondary" className="bg-status-away/10 text-status-away border-status-away/20">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting
        </Badge>
      );
    case "error":
      return (
        <Badge variant="secondary" className="bg-status-busy/10 text-status-busy border-status-busy/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    case "stopped":
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Stopped
        </Badge>
      );
    case "idle":
    default:
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Idle
        </Badge>
      );
  }
}

export function StatusDashboard({
  endpoints,
  streamingState,
}: StatusDashboardProps) {
  const isStreaming = streamingState?.isStreaming || false;
  const endpointStatuses = streamingState?.endpointStatuses || [];

  const getEndpointStatus = (endpointId: string): StreamStatus => {
    const status = endpointStatuses.find(s => s.endpointId === endpointId);
    return status || { endpointId, status: "idle" };
  };

  const liveCount = endpointStatuses.filter(s => s.status === "live").length;
  const errorCount = endpointStatuses.filter(s => s.status === "error").length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Stream Status
          </CardTitle>
          {isStreaming && (
            <div className="flex items-center gap-2">
              {liveCount > 0 && (
                <Badge variant="secondary" className="bg-status-online/10 text-status-online">
                  {liveCount} Live
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="secondary" className="bg-status-busy/10 text-status-busy">
                  {errorCount} Error{errorCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {endpoints.map((endpoint) => {
            const status = getEndpointStatus(endpoint.id);
            return (
              <div
                key={endpoint.id}
                className={`p-4 rounded-lg border transition-all ${status.status === "live"
                  ? "bg-status-online/5 border-status-online/30"
                  : status.status === "error"
                    ? "bg-status-busy/5 border-status-busy/30"
                    : status.status === "connecting"
                      ? "bg-status-away/5 border-status-away/30"
                      : "bg-muted/30"
                  }`}
                data-testid={`status-card-${endpoint.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${platformInfo[endpoint.platform].color}15` }}
                    >
                      <PlatformIcon platform={endpoint.platform} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm" data-testid={`text-status-name-${endpoint.id}`}>
                        {endpoint.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {platformInfo[endpoint.platform].name}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(status.status)}
                </div>

                {/* Additional info when streaming */}
                {status.status === "live" && (
                  <div className="mt-3 pt-3 border-t border-status-online/20 grid grid-cols-2 gap-2">
                    {status.bitrate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Bitrate</p>
                        <p className="text-sm font-mono">{(status.bitrate / 1000).toFixed(0)} kbps</p>
                      </div>
                    )}
                    {status.fps && (
                      <div>
                        <p className="text-xs text-muted-foreground">FPS</p>
                        <p className="text-sm font-mono">{status.fps}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error message */}
                {status.status === "error" && status.errorMessage && (
                  <div className="mt-3 pt-3 border-t border-status-busy/20">
                    <p className="text-xs text-status-busy">
                      {status.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isStreaming && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Start streaming to see real-time status for each endpoint
          </div>
        )}
      </CardContent>
    </Card>
  );
}
