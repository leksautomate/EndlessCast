import { z } from "zod";

// Video file schema
export const videoSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  size: z.number(), // in bytes
  duration: z.number(), // in seconds
  mimeType: z.string(),
  uploadedAt: z.string(),
});

export type Video = z.infer<typeof videoSchema>;

// RTMP endpoint platforms
export const rtmpPlatforms = [
  "youtube",
  "facebook", 
  "rumble",
  "odysee",
  "twitter",
  "custom"
] as const;

export type RtmpPlatform = typeof rtmpPlatforms[number];

// RTMP endpoint schema
export const rtmpEndpointSchema = z.object({
  id: z.string(),
  platform: z.enum(rtmpPlatforms),
  name: z.string(),
  rtmpUrl: z.string(),
  streamKey: z.string(),
  enabled: z.boolean(),
});

export type RtmpEndpoint = z.infer<typeof rtmpEndpointSchema>;

export const insertRtmpEndpointSchema = rtmpEndpointSchema.omit({ id: true });
export type InsertRtmpEndpoint = z.infer<typeof insertRtmpEndpointSchema>;

// Stream status for each endpoint
export const streamStatusSchema = z.object({
  endpointId: z.string(),
  status: z.enum(["idle", "connecting", "live", "error", "stopped"]),
  startedAt: z.string().optional(),
  errorMessage: z.string().optional(),
  bitrate: z.number().optional(),
  fps: z.number().optional(),
});

export type StreamStatus = z.infer<typeof streamStatusSchema>;

// Playlist schema
export const playlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  videoIds: z.array(z.string()),
  createdAt: z.string(),
});

export type Playlist = z.infer<typeof playlistSchema>;

export const insertPlaylistSchema = playlistSchema.omit({ id: true, createdAt: true });
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;

// Stream statistics
export const streamStatsSchema = z.object({
  id: z.string(),
  streamStartTime: z.string(),
  streamEndTime: z.string().optional(),
  durationSeconds: z.number(),
  restartCount: z.number(),
  endpointId: z.string(),
});

export type StreamStats = z.infer<typeof streamStatsSchema>;

// Scheduled stream
export const scheduledStreamSchema = z.object({
  id: z.string(),
  name: z.string(),
  videoIds: z.array(z.string()),
  rtmpEndpointIds: z.array(z.string()),
  scheduledStartTime: z.string(),
  recurring: z.enum(["once", "daily", "weekly"]).optional(),
  enabled: z.boolean(),
  createdAt: z.string(),
});

export type ScheduledStream = z.infer<typeof scheduledStreamSchema>;

export const insertScheduledStreamSchema = scheduledStreamSchema.omit({ id: true, createdAt: true });
export type InsertScheduledStream = z.infer<typeof insertScheduledStreamSchema>;

// Global streaming state
export const streamingStateSchema = z.object({
  isStreaming: z.boolean(),
  selectedVideoId: z.string().nullable(),
  selectedPlaylistId: z.string().nullable(),
  playlistIndex: z.number(),
  startedAt: z.string().optional(),
  endpointStatuses: z.array(streamStatusSchema),
  stats: z.array(streamStatsSchema),
});

export type StreamingState = z.infer<typeof streamingStateSchema>;

// Storage info
export const storageInfoSchema = z.object({
  used: z.number(), // bytes
  limit: z.number(), // bytes (5GB)
  videoCount: z.number(),
  maxVideos: z.number(), // 4
});

export type StorageInfo = z.infer<typeof storageInfoSchema>;

// Platform display info
export const platformInfo: Record<RtmpPlatform, { name: string; color: string; defaultUrl: string }> = {
  youtube: { 
    name: "YouTube Live", 
    color: "#FF0000",
    defaultUrl: "rtmp://a.rtmp.youtube.com/live2"
  },
  facebook: { 
    name: "Facebook Live", 
    color: "#1877F2",
    defaultUrl: "rtmps://live-api-s.facebook.com:443/rtmp/"
  },
  rumble: { 
    name: "Rumble", 
    color: "#85C742",
    defaultUrl: "rtmp://live.rumble.com/live/"
  },
  odysee: { 
    name: "Odysee", 
    color: "#F2495C",
    defaultUrl: "rtmp://stream.odysee.com/live"
  },
  twitter: { 
    name: "Twitter/X", 
    color: "#000000",
    defaultUrl: "rtmps://prod-rtmp-eu.pscp.tv:443/x"
  },
  custom: { 
    name: "Custom RTMP", 
    color: "#6366F1",
    defaultUrl: ""
  },
};

// Helper function to format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Storage limit constants
export const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB
export const MAX_VIDEOS = 4;
