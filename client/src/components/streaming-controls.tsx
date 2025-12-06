import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Square, Radio, Film, AlertCircle, Loader2 } from "lucide-react";
import type { Video, StreamingState } from "@shared/schema";
import { formatDuration } from "@shared/schema";

interface StreamingControlsProps {
  selectedVideo: Video | undefined;
  streamingState: StreamingState | undefined;
  enabledEndpointsCount: number;
  isStarting: boolean;
  isStopping: boolean;
  onStart: (durationSeconds: number) => void;
  onStop: () => void;
}

export function StreamingControls({
  selectedVideo,
  streamingState,
  enabledEndpointsCount,
  isStarting,
  isStopping,
  onStart,
  onStop,
}: StreamingControlsProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hours, setHours] = useState(11);
  const [minutes, setMinutes] = useState(55);
  const isStreaming = streamingState?.isStreaming || false;

  useEffect(() => {
    if (!isStreaming || !streamingState?.startedAt) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(streamingState.startedAt).getTime();

    const updateElapsed = () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isStreaming, streamingState?.startedAt]);

  const canStart = selectedVideo && enabledEndpointsCount > 0 && !isStreaming;

  const handleStart = () => {
    const totalSeconds = (hours * 3600) + (minutes * 60);
    onStart(totalSeconds);
  };

  return (
    <Card className={`overflow-hidden transition-all ${isStreaming ? "ring-2 ring-status-online" : ""}`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Video Preview */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {selectedVideo ? (
                <Film className="w-6 h-6 text-muted-foreground" />
              ) : (
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              {selectedVideo ? (
                <>
                  <p className="font-medium truncate" data-testid="text-selected-video">
                    {selectedVideo.originalName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(selectedVideo.duration)} • Looping to {enabledEndpointsCount} endpoint{enabledEndpointsCount !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-muted-foreground">No video selected</p>
                  <p className="text-sm text-muted-foreground">
                    Select a video from your library to stream
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center gap-4">
            {/* Duration Settings (only show when not streaming) */}
            {!isStreaming && (
              <div className="flex items-end gap-2 mr-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="hours" className="text-xs">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="minutes" className="text-xs">Minutes</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 h-9"
                  />
                </div>
              </div>
            )}

            {/* Stream Status */}
            <div className="text-right">
              {isStreaming ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-online opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-online"></span>
                    </span>
                    <Badge variant="secondary" className="bg-status-online/10 text-status-online border-status-online/20">
                      LIVE
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-semibold tabular-nums" data-testid="text-stream-duration">
                      {formatDuration(elapsedTime)}
                    </p>
                  </div>
                </div>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">
                  <Radio className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>

            {/* Main Control Button */}
            <div>
              {isStreaming ? (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={onStop}
                  disabled={isStopping}
                  className="min-w-[140px]"
                  data-testid="button-stop-stream"
                >
                  {isStopping ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-5 h-5 mr-2" />
                  )}
                  Stop Stream
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={!canStart || isStarting}
                  className="min-w-[140px]"
                  data-testid="button-start-stream"
                >
                  {isStarting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  Start Stream
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {!selectedVideo && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Upload and select a video to enable streaming</span>
          </div>
        )}
        {selectedVideo && enabledEndpointsCount === 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Configure at least one RTMP endpoint to enable streaming</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
