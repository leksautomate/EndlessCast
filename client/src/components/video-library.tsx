import { useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Play, Trash2, Film, Check, Loader2 } from "lucide-react";
import type { Video } from "@shared/schema";
import { formatBytes, formatDuration } from "@shared/schema";

interface VideoLibraryProps {
  videos: Video[];
  selectedVideoId: string | null;
  isStreaming: boolean;
  isLoading: boolean;
  isUploading: boolean;
  maxVideos: number;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function VideoLibrary({
  videos,
  selectedVideoId,
  isStreaming,
  isLoading,
  isUploading,
  maxVideos,
  onUpload,
  onDelete,
  onSelect,
}: VideoLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("video/") || file.name.endsWith(".mkv"))) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const canUpload = videos.length < maxVideos;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Video Library
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {videos.length} / {maxVideos}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        {canUpload && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-muted/50"
            data-testid="upload-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-matroska,.mp4,.mov,.mkv"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-video-upload"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading video...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drop video here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, MOV, MKV up to 10GB total
                  </p>
                </div>
              </div>
            )}
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
        ) : videos.length === 0 ? (
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
                  {/* Thumbnail placeholder */}
                  <div className="w-24 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                  
                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-video-name-${video.id}`}>
                          {video.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground" data-testid={`text-video-duration-${video.id}`}>
                            {formatDuration(video.duration)}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground" data-testid={`text-video-size-${video.id}`}>
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
                    
                    {/* Actions */}
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
      </CardContent>
    </Card>
  );
}
