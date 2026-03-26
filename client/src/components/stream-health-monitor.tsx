import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { StreamingState, RtmpEndpoint } from "@shared/schema";

interface StreamHealthMonitorProps {
    endpoints: RtmpEndpoint[];
    streamingState?: StreamingState;
}

export function StreamHealthMonitor({ endpoints, streamingState }: StreamHealthMonitorProps) {
    if (!streamingState?.isStreaming || !streamingState.endpointStatuses.length) {
        return null;
    }

    const getHealthColor = (health: number) => {
        if (health >= 95) return "text-green-600";
        if (health >= 80) return "text-yellow-600";
        return "text-red-600";
    };

    const getHealthBadge = (health: number) => {
        if (health >= 95) return { variant: "default" as const, icon: CheckCircle2, label: "Excellent" };
        if (health >= 80) return { variant: "secondary" as const, icon: Activity, label: "Good" };
        return { variant: "destructive" as const, icon: AlertTriangle, label: "Poor" };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Stream Health Monitor
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {streamingState.endpointStatuses.map((status) => {
                        const endpoint = endpoints.find((e) => e.id === status.endpointId);
                        if (!endpoint || (status.status !== "live" && status.status !== "reconnecting") || !status.healthMetrics) return null;

                        const { healthMetrics } = status;
                        const health = healthMetrics.bufferHealth;
                        const healthBadge = getHealthBadge(health);
                        const HealthIcon = healthBadge.icon;
                        const dropRate = healthMetrics.totalFrames > 0
                            ? ((healthMetrics.droppedFrames / healthMetrics.totalFrames) * 100).toFixed(2)
                            : "0.00";

                        return (
                            <div
                                key={status.endpointId}
                                className="p-4 rounded-lg border bg-card"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: platform_info[endpoint.platform]?.color || "#6366F1" }}
                                        />
                                        <span className="font-medium">{endpoint.name}</span>
                                    </div>
                                    <Badge variant={healthBadge.variant} className="flex items-center gap-1">
                                        <HealthIcon className="w-3 h-3" />
                                        {healthBadge.label}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    {/* Buffer Health */}
                                    <div>
                                        <p className="text-muted-foreground mb-1">Buffer Health</p>
                                        <p className={`text-2xl font-bold ${getHealthColor(health)}`}>
                                            {health}%
                                        </p>
                                    </div>

                                    {/* Drop Rate */}
                                    <div>
                                        <p className="text-muted-foreground mb-1">Drop Rate</p>
                                        <p className="text-2xl font-bold">
                                            {dropRate}%
                                        </p>
                                    </div>

                                    {/* Dropped Frames */}
                                    <div>
                                        <p className="text-muted-foreground mb-1">Dropped Frames</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {healthMetrics.droppedFrames.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Total Frames */}
                                    <div>
                                        <p className="text-muted-foreground mb-1">Total Frames</p>
                                        <p className="text-2xl font-bold">
                                            {healthMetrics.totalFrames.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Bitrate & FPS */}
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Bitrate:</span>
                                        <span className="font-semibold">
                                            {status.bitrate ? `${(status.bitrate / 1000).toFixed(0)} kbps` : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">FPS:</span>
                                        <span className="font-semibold">
                                            {status.fps ? status.fps.toFixed(1) : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// Import platform info (you'll need to export this from schema.ts)
const platform_info: Record<string, { color: string }> = {
    youtube: { color: "#FF0000" },
    facebook: { color: "#1877F2" },
    rumble: { color: "#85C742" },
    odysee: { color: "#F2495C" },
    twitter: { color: "#000000" },
    custom: { color: "#6366F1" },
};
