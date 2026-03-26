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

// Output profile options per endpoint
export const outputProfiles = [
  "landscape_1080p",
  "landscape_720p",
  "portrait_1080p",
  "square_1080p",
] as const;

export type OutputProfile = typeof outputProfiles[number];

export const outputProfileInfo: Record<OutputProfile, { label: string; width: number; height: number; maxrate: string; bufsize: string; badge: string }> = {
  landscape_1080p: { label: "Landscape 1080p (16:9)", width: 1920, height: 1080, maxrate: "6000k", bufsize: "12000k", badge: "16:9 1080p" },
  landscape_720p:  { label: "Landscape 720p (16:9)",  width: 1280, height: 720,  maxrate: "3000k", bufsize: "6000k",  badge: "16:9 720p"  },
  portrait_1080p:  { label: "Portrait 1080p / Shorts (9:16)", width: 1080, height: 1920, maxrate: "6000k", bufsize: "12000k", badge: "9:16 Shorts" },
  square_1080p:    { label: "Square 1080p (1:1)",     width: 1080, height: 1080, maxrate: "4500k", bufsize: "9000k",  badge: "1:1 Square" },
};

// RTMP endpoint schema
export const rtmpEndpointSchema = z.object({
  id: z.string(),
  platform: z.enum(rtmpPlatforms),
  name: z.string(),
  rtmpUrl: z.string(),
  streamKey: z.string(),
  enabled: z.boolean(),
  // Output profile for this destination
  outputProfile: z.enum(outputProfiles).default("landscape_1080p"),
  // Per-endpoint video override (null = use global selected video)
  videoId: z.string().nullable().optional(),
  // YouTube-specific stream metadata
  streamTitle: z.string().optional(),
  streamDescription: z.string().optional(),
  thumbnailPath: z.string().optional(),
});

export type RtmpEndpoint = z.infer<typeof rtmpEndpointSchema>;

export const insertRtmpEndpointSchema = rtmpEndpointSchema.omit({ id: true });
export type InsertRtmpEndpoint = z.infer<typeof insertRtmpEndpointSchema>;

// Stream status for each endpoint
export const streamStatusSchema = z.object({
  endpointId: z.string(),
  status: z.enum(["idle", "connecting", "live", "error", "stopped", "reconnecting"]),
  startedAt: z.string().optional(),
  errorMessage: z.string().optional(),
  bitrate: z.number().optional(),
  fps: z.number().optional(),
  reconnectCount: z.number().default(0),
  nextReconnectAt: z.string().optional(),
  healthMetrics: z.object({
    droppedFrames: z.number().default(0),
    totalFrames: z.number().default(0),
    bufferHealth: z.number().default(100),
  }).optional(),
});

export type StreamStatus = z.infer<typeof streamStatusSchema>;

// Stream health metrics
export const streamHealthSchema = z.object({
  droppedFrames: z.number().default(0),
  totalFrames: z.number().default(0),
  currentBitrate: z.number().optional(),
  averageBitrate: z.number().optional(),
  currentFps: z.number().optional(),
  targetFps: z.number().default(30),
  bufferHealth: z.number().default(100), // 0-100%
  lastUpdate: z.string().optional(),
});

export type StreamHealth = z.infer<typeof streamHealthSchema>;

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

// Extra camera (picture-in-picture overlay) config
export const extraCameraPositions = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
] as const;

export type ExtraCameraPosition = typeof extraCameraPositions[number];

export const extraCameraPositionInfo: Record<ExtraCameraPosition, { label: string; icon: string }> = {
  "bottom-right": { label: "Bottom Right", icon: "↘" },
  "bottom-left":  { label: "Bottom Left",  icon: "↙" },
  "top-right":    { label: "Top Right",    icon: "↗" },
  "top-left":     { label: "Top Left",     icon: "↖" },
};

export const extraCameraSchema = z.object({
  videoId: z.string(),
  position: z.enum(extraCameraPositions).default("bottom-right"),
  sizePercent: z.number().min(10).max(50).default(25),
  enabled: z.boolean().default(true),
});

export type ExtraCamera = z.infer<typeof extraCameraSchema>;

// Global streaming state
export const streamingStateSchema = z.object({
  isStreaming: z.boolean(),
  selectedVideoId: z.string().nullable(),
  selectedPlaylistId: z.string().nullable(),
  playlistIndex: z.number(),
  startedAt: z.string().optional(),
  endpointStatuses: z.array(streamStatusSchema),
  stats: z.array(streamStatsSchema),
  extraCamera: extraCameraSchema.nullable().default(null),
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

// Error log schema
export const errorLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  endpointId: z.string(),
  endpointName: z.string(),
  errorMessage: z.string(),
  errorCode: z.number().optional(),
  restartAttempt: z.number(),
  maxRetries: z.number(),
});

export type ErrorLog = z.infer<typeof errorLogSchema>;

// Email settings schema
export const emailSettingsSchema = z.object({
  enabled: z.boolean(),
  gmailAddress: z.string().email(),
  gmailAppPassword: z.string(),
  notifyOnError: z.boolean(),
});

export type EmailSettings = z.infer<typeof emailSettingsSchema>;

export const insertEmailSettingsSchema = emailSettingsSchema;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;

// Storage limit constants
export const MAX_STORAGE_BYTES = 200 * 1024 * 1024 * 1024; // 200GB
export const MAX_VIDEOS = 16;
export const MAX_RESTART_ATTEMPTS = 3;
export const MAX_LOG_ENTRIES = 500;

// Event log schema
export const logLevels = ["info", "warn", "error"] as const;
export type LogLevel = typeof logLevels[number];

export const logEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  level: z.enum(logLevels),
  message: z.string(),
  endpoint: z.string().optional(),
  detail: z.string().optional(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

// Theme settings schema
export const themeColors = [
  "matrix", "cyber", "neon", "blood", "ocean", "amber", "violet", "custom"
] as const;

export type ThemeColor = typeof themeColors[number];

export const themeSettingsSchema = z.object({
  colorTheme: z.enum(themeColors).default("matrix"),
  customPrimary: z.string().optional(),
  customAccent: z.string().optional(),
  customBackground: z.string().optional(),
  terminalFont: z.boolean().default(true),
  scanlines: z.boolean().default(false),
  glowEffects: z.boolean().default(true),
});

export type ThemeSettings = z.infer<typeof themeSettingsSchema>;

export const insertThemeSettingsSchema = themeSettingsSchema;
export type InsertThemeSettings = z.infer<typeof insertThemeSettingsSchema>;

// Telegram settings schema
export const telegramSettingsSchema = z.object({
  enabled: z.boolean(),
  botToken: z.string(),
  chatId: z.string(),
  notifyOnStart: z.boolean().default(true),
  notifyOnStop: z.boolean().default(true),
  notifyOnError: z.boolean().default(true),
});

export type TelegramSettings = z.infer<typeof telegramSettingsSchema>;

export const insertTelegramSettingsSchema = telegramSettingsSchema;
export type InsertTelegramSettings = z.infer<typeof insertTelegramSettingsSchema>;

// Theme color presets
export const themePresets: Record<ThemeColor, { primary: string; accent: string; bg: string; name: string }> = {
  matrix: { primary: "#00ff41", accent: "#008f11", bg: "#0d0d0d", name: "Matrix Green" },
  cyber: { primary: "#00d4ff", accent: "#0099cc", bg: "#0a0a0f", name: "Cyber Blue" },
  neon: { primary: "#ff00ff", accent: "#cc00cc", bg: "#0f0a0f", name: "Neon Pink" },
  blood: { primary: "#ff3333", accent: "#cc0000", bg: "#0f0a0a", name: "Blood Red" },
  ocean: { primary: "#00ffcc", accent: "#00ccaa", bg: "#0a0f0f", name: "Ocean Teal" },
  amber: { primary: "#ffaa00", accent: "#cc8800", bg: "#0f0d0a", name: "Amber Gold" },
  violet: { primary: "#aa66ff", accent: "#8844dd", bg: "#0d0a0f", name: "Violet Purple" },
  custom: { primary: "#00ff41", accent: "#008f11", bg: "#0d0d0d", name: "Custom" },
};
