import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Film, AlertCircle, Loader2, Radio } from "lucide-react";
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
    const tick = () => setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isStreaming, streamingState?.startedAt]);

  const canStart = selectedVideo && enabledEndpointsCount > 0 && !isStreaming;

  const handleStart = () => {
    onStart((hours * 3600) + (minutes * 60));
  };

  return (
    <div className="space-y-4">

      {/* Status row */}
      <div className="flex items-center justify-between min-h-[28px]">
        {isStreaming ? (
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-xs font-semibold text-green-500 uppercase tracking-widest">Live</span>
            <div
              className="px-3 py-1.5 rounded-lg border border-green-500/25 bg-black/50 font-mono tabular-nums text-green-400 text-xl leading-none tracking-widest"
              style={{ fontFamily: "'Courier New', 'JetBrains Mono', monospace", textShadow: "0 0 10px rgba(74,222,128,0.8)" }}
              data-testid="text-stream-duration"
            >
              {formatDuration(elapsedTime)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-muted-foreground/30" />
            <span className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Offline</span>
          </div>
        )}

        {isStreaming && (
          <span className="text-[11px] text-green-500/50 tabular-nums">
            {enabledEndpointsCount} ch active
          </span>
        )}
      </div>

      {/* Video source card */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        isStreaming
          ? "border-green-500/25 bg-green-500/5"
          : selectedVideo
            ? "border-border/50 bg-muted/20"
            : "border-dashed border-border/40 bg-transparent"
      }`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isStreaming ? "bg-green-500/10" : selectedVideo ? "bg-primary/10" : "bg-muted/40"
        }`}>
          {selectedVideo
            ? <Film className={`w-4.5 h-4.5 ${isStreaming ? "text-green-500" : "text-primary"}`} style={{ width: 18, height: 18 }} />
            : <AlertCircle className="w-4 h-4 text-muted-foreground/30" />
          }
        </div>

        <div className="min-w-0 flex-1">
          {selectedVideo ? (
            <>
              <p
                className="text-sm font-semibold truncate leading-snug"
                data-testid="text-selected-video"
              >
                {selectedVideo.originalName}
              </p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5 tabular-nums">
                {formatDuration(selectedVideo.duration)}&ensp;·&ensp;{enabledEndpointsCount} endpoint{enabledEndpointsCount !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground/40">No video selected</p>
              <p className="text-[11px] text-muted-foreground/30 mt-0.5">Go to Videos to select one</p>
            </>
          )}
        </div>
      </div>

      {/* Duration + action button row */}
      <div className="flex items-end gap-3">
        {!isStreaming && (
          <div className="flex-shrink-0 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 text-center">Duration</p>
            <div
              className="flex items-center gap-0 rounded-lg border border-border/40 bg-black/50 overflow-hidden"
              style={{ fontFamily: "'Courier New', 'JetBrains Mono', monospace" }}
            >
              <input
                id="hours"
                type="number"
                min="0"
                value={String(hours).padStart(2, "0")}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 h-10 text-center tabular-nums font-bold text-base bg-transparent border-0 outline-none text-foreground/80 focus:text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ textShadow: "0 0 6px rgba(255,255,255,0.15)" }}
                data-testid="input-duration-hours"
              />
              <span className="text-muted-foreground/30 font-bold text-lg select-none">:</span>
              <input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={String(minutes).padStart(2, "0")}
                onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-12 h-10 text-center tabular-nums font-bold text-base bg-transparent border-0 outline-none text-foreground/80 focus:text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ textShadow: "0 0 6px rgba(255,255,255,0.15)" }}
                data-testid="input-duration-minutes"
              />
            </div>
          </div>
        )}

        <div className="flex-1">
          {isStreaming ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={onStop}
              disabled={isStopping}
              className="w-full h-11 font-semibold tracking-wide uppercase text-sm"
              data-testid="button-stop-stream"
            >
              {isStopping
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Square className="w-4 h-4 mr-2" />
              }
              Stop Broadcast
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="w-full h-11 font-semibold tracking-wide uppercase text-sm bg-green-600 hover:bg-green-500 disabled:bg-muted/50 text-white border-0 shadow-none"
              data-testid="button-start-stream"
            >
              {isStarting
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Play className="w-4 h-4 mr-2 fill-current" />
              }
              Start Broadcast
            </Button>
          )}
        </div>
      </div>

      {/* Inline warnings */}
      {!selectedVideo && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 px-0.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          Upload and select a video to enable streaming
        </p>
      )}
      {selectedVideo && enabledEndpointsCount === 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 px-0.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          Add at least one RTMP destination to start
        </p>
      )}
    </div>
  );
}
