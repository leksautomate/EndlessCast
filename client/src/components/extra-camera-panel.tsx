import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Camera, X, PictureInPicture } from "lucide-react";
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

  // Local form state — default from current config
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
      toast({ title: "Extra Camera Set", description: "PiP overlay will be active on next stream start." });
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
      toast({ title: "Extra Camera Cleared", description: "No PiP overlay will be applied." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const currentVideo = videos.find(v => v.id === current?.videoId);
  const canApply = selectedVideoId !== "" && !isStreaming;

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      {current ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 min-w-0">
            <PictureInPicture className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-extra-camera-video">
                {currentVideo?.originalName ?? "Unknown video"}
              </p>
              <p className="text-xs text-muted-foreground">
                {extraCameraPositionInfo[current.position].label} · {current.sizePercent}% size
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 text-xs"
              data-testid="badge-extra-camera-active"
            >
              PiP ON
            </Badge>
            {!isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                data-testid="button-clear-extra-camera"
                aria-label="Clear extra camera"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-muted/40">
          <Camera className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            No extra camera — single video stream
          </p>
        </div>
      )}

      {/* Config controls (only when not streaming) */}
      {!isStreaming && (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Video selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Camera Video
            </Label>
            {availableVideos.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Upload a second video to use as extra camera
              </p>
            ) : (
              <Select
                value={selectedVideoId}
                onValueChange={setSelectedVideoId}
                disabled={isStreaming}
              >
                <SelectTrigger className="h-9" data-testid="select-extra-camera-video">
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
            )}
          </div>

          {/* Position selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Corner
            </Label>
            <Select
              value={position}
              onValueChange={(v) => setPosition(v as ExtraCameraPosition)}
              disabled={isStreaming}
            >
              <SelectTrigger className="h-9" data-testid="select-extra-camera-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {extraCameraPositions.map(pos => (
                  <SelectItem key={pos} value={pos} data-testid={`option-position-${pos}`}>
                    <span className="mr-1.5 text-base leading-none">{extraCameraPositionInfo[pos].icon}</span>
                    {extraCameraPositionInfo[pos].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size slider */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Size — <span className="text-foreground">{sizePercent}%</span>
            </Label>
            <Slider
              min={10}
              max={50}
              step={5}
              value={[sizePercent]}
              onValueChange={([v]) => setSizePercent(v)}
              disabled={isStreaming}
              className="mt-3"
              data-testid="slider-extra-camera-size"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>10%</span>
              <span>50%</span>
            </div>
          </div>
        </div>
      )}

      {/* Apply button */}
      {!isStreaming && availableVideos.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMutation.mutate()}
          disabled={!canApply || setMutation.isPending}
          className="border-primary/30 hover:bg-primary/10"
          data-testid="button-apply-extra-camera"
        >
          <Camera className="w-4 h-4 mr-2" />
          {setMutation.isPending ? "Applying…" : "Apply Extra Camera"}
        </Button>
      )}

      {isStreaming && (
        <p className="text-xs text-muted-foreground">
          Stop the stream to change the extra camera configuration.
        </p>
      )}
    </div>
  );
}
