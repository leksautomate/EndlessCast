import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Camera, X, PictureInPicture2 } from "lucide-react";
import { extraCameraPositionInfo, extraCameraPositions } from "@shared/schema";
import type { Video, StreamingState, ExtraCameraPosition } from "@shared/schema";

interface ExtraCameraPanelProps {
  videos: Video[];
  streamingState: StreamingState | undefined;
}

export function ExtraCameraPanel({ videos, streamingState }: ExtraCameraPanelProps) {
  const { toast } = useToast();
  const isStreaming = streamingState?.isStreaming ?? false;
  const current = streamingState?.extraCamera;
  const mainVideoId = streamingState?.selectedVideoId;

  const [selectedVideoId, setSelectedVideoId] = useState<string>(current?.videoId ?? "");
  const [position, setPosition] = useState<ExtraCameraPosition>(current?.position ?? "bottom-right");
  const [sizePercent, setSizePercent] = useState<number>(current?.sizePercent ?? 25);

  const availableVideos = videos.filter(v => v.id !== mainVideoId);

  const setMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/streaming/extra-camera", {
        videoId: selectedVideoId,
        position,
        sizePercent,
        enabled: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      toast({ title: "Extra Camera Set", description: "PiP overlay active on next stream start." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/streaming/extra-camera"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streaming/state"] });
      setSelectedVideoId("");
      toast({ title: "Extra Camera Cleared" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const currentVideo = videos.find(v => v.id === current?.videoId);
  const canApply = selectedVideoId !== "" && !isStreaming;

  return (
    <div className="space-y-4">

      {/* Active PiP indicator */}
      {current ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PictureInPicture2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" data-testid="text-extra-camera-video">
                {currentVideo?.originalName ?? "Unknown video"}
              </p>
              <p className="text-[11px] text-muted-foreground/50">
                {extraCameraPositionInfo[current.position].label} · {current.sizePercent}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider"
              data-testid="badge-extra-camera-active"
            >
              PiP
            </span>
            {!isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/50 hover:text-destructive"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                data-testid="button-clear-extra-camera"
                aria-label="Clear extra camera"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-1 py-0.5">
          <Camera className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground/35">No overlay — single video stream</p>
        </div>
      )}

      {/* Config (only when not streaming) */}
      {!isStreaming && (
        <>
          {availableVideos.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/35 italic px-1">
              Upload a second video to use as picture-in-picture overlay
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Video picker */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">Camera Video</p>
                  <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                    <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/40" data-testid="select-extra-camera-video">
                      <SelectValue placeholder="Select video…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVideos.map(v => (
                        <SelectItem key={v.id} value={v.id} data-testid={`option-extra-camera-video-${v.id}`}>
                          {v.originalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Position */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">Corner</p>
                  <Select value={position} onValueChange={(v) => setPosition(v as ExtraCameraPosition)}>
                    <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/40" data-testid="select-extra-camera-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {extraCameraPositions.map(pos => (
                        <SelectItem key={pos} value={pos} data-testid={`option-position-${pos}`}>
                          <span className="mr-1.5">{extraCameraPositionInfo[pos].icon}</span>
                          {extraCameraPositionInfo[pos].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Size slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">Size</p>
                  <span className="text-xs font-semibold tabular-nums text-foreground/60">{sizePercent}%</span>
                </div>
                <Slider
                  min={10}
                  max={50}
                  step={5}
                  value={[sizePercent]}
                  onValueChange={([v]) => setSizePercent(v)}
                  className="mt-1"
                  data-testid="slider-extra-camera-size"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/30">
                  <span>10%</span>
                  <span>50%</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setMutation.mutate()}
                disabled={!canApply || setMutation.isPending}
                className="h-8 text-xs border-primary/25 hover:bg-primary/8 text-primary/80"
                data-testid="button-apply-extra-camera"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                {setMutation.isPending ? "Applying…" : "Apply Overlay"}
              </Button>
            </div>
          )}
        </>
      )}

      {isStreaming && (
        <p className="text-[11px] text-muted-foreground/35 px-1">
          Stop the stream to reconfigure the PiP overlay.
        </p>
      )}
    </div>
  );
}
