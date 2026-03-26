import { useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Play,
  Trash2,
  Film,
  Check,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { Video } from "@shared/schema";
import { formatBytes, formatDuration } from "@shared/schema";
import type { UploadJob } from "@/pages/videos";

interface VideoLibraryProps {
  videos: Video[];
  selectedVideoId: string | null;
  isStreaming: boolean;
  isLoading: boolean;
  uploadQueue: UploadJob[];
  activeJobs: UploadJob[];
  finishedJobs: UploadJob[];
  maxVideos: number;
  onUpload: (files: File[]) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onClearDone: () => void;
}

export function VideoLibrary({
  videos,
  selectedVideoId,
  isStreaming,
  isLoading,
  uploadQueue,
  activeJobs,
  finishedJobs,
  maxVideos,
  onUpload,
  onDelete,
  onSelect,
  onClearDone,
}: VideoLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onUpload(files);
        e.target.value = "";
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("video/") || f.name.endsWith(".mkv")
      );
      if (files.length > 0) onUpload(files);
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const hasActiveUploads = activeJobs.length > 0;
  const canUpload = videos.length < maxVideos;
  const slotsLeft = maxVideos - videos.length;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !hasActiveUploads && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            hasActiveUploads
              ? "border-primary/30 bg-primary/3 cursor-default"
              : "cursor-pointer hover:border-primary hover:bg-muted/50"
          }`}
          data-testid="upload-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-matroska,.mp4,.mov,.mkv"
            onChange={handleFileSelect}
            multiple
            className="hidden"
            data-testid="input-video-upload"
          />

          {hasActiveUploads ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
              <p className="text-xs sm:text-sm text-primary font-mono">
                Uploading {activeJobs.length} file{activeJobs.length !== 1 ? "s" : ""}...
              </p>
              <p className="text-[10px] text-muted-foreground">
                Click elsewhere to add more while uploading
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium">
                  Tap to upload videos
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  MP4, MOV, MKV — select multiple at once · {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress List */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Upload Queue
            </p>
            {finishedJobs.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                onClick={onClearDone}
                data-testid="button-clear-uploads"
              >
                Clear finished
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {uploadQueue.map((job) => (
              <div
                key={job.id}
                className={`rounded-lg border px-3 py-2 transition-colors ${
                  job.status === "error"
                    ? "border-destructive/30 bg-destructive/5"
                    : job.status === "done"
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-primary/20 bg-primary/5"
                }`}
                data-testid={`upload-job-${job.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {job.status === "done" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  )}
                  {job.status === "error" && (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  )}
                  {job.status === "pending" && (
                    <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  {job.status === "uploading" && (
                    <Loader2 className="w-3.5 h-3.5 text-primary flex-shrink-0 animate-spin" />
                  )}

                  <span className="text-xs font-mono truncate flex-1 min-w-0" title={job.name}>
                    {job.name}
                  </span>

                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatBytes(job.size)}
                  </span>

                  {job.status === "uploading" && (
                    <span className="text-[10px] font-mono text-primary flex-shrink-0 w-8 text-right">
                      {job.progress}%
                    </span>
                  )}
                  {job.status === "done" && (
                    <span className="text-[10px] font-mono text-green-500 flex-shrink-0">done</span>
                  )}
                  {job.status === "error" && (
                    <span className="text-[10px] font-mono text-destructive flex-shrink-0">failed</span>
                  )}
                  {job.status === "pending" && (
                    <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">queued</span>
                  )}
                </div>

                {job.status === "uploading" && (
                  <Progress value={job.progress} className="h-1" />
                )}
                {job.status === "error" && job.error && (
                  <p className="text-[10px] text-destructive mt-1">{job.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 p-3 border rounded-lg">
              <Skeleton className="w-24 h-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 && !hasActiveUploads ? (
        <div className="text-center py-8 text-muted-foreground">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No videos uploaded yet</p>
          <p className="text-xs mt-1">Upload a video to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => {
            const isSelected = video.id === selectedVideoId;
            return (
              <div
                key={video.id}
                className={`flex gap-3 p-3 border rounded-lg transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover-elevate"
                }`}
                data-testid={`video-card-${video.id}`}
              >
                <div className="hidden sm:flex w-24 h-16 rounded bg-muted items-center justify-center flex-shrink-0">
                  <Play className="w-6 h-6 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        data-testid={`text-video-name-${video.id}`}
                      >
                        {video.originalName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-xs text-muted-foreground"
                          data-testid={`text-video-duration-${video.id}`}
                        >
                          {formatDuration(video.duration)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span
                          className="text-xs text-muted-foreground"
                          data-testid={`text-video-size-${video.id}`}
                        >
                          {formatBytes(video.size)}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="flex-shrink-0">
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {!isSelected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelect(video.id)}
                        disabled={isStreaming}
                        data-testid={`button-select-video-${video.id}`}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Select
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(video.id)}
                      disabled={isStreaming && isSelected}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!canUpload && videos.length >= maxVideos && (
        <p className="text-xs text-center text-muted-foreground">
          Maximum {maxVideos} videos. Delete one to upload more.
        </p>
      )}
    </div>
  );
}
