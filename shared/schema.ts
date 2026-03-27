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

export const outputProfileInfo: Record<OutputProfile, { label: string; width: number; height: number; bitrate: string; maxrate: string; bufsize: string; badge: string }> = {
  landscape_1080p: { label: "Landscape 1080p (16:9)", width: 1920, height: 1080, bitrate: "4500k", maxrate: "6000k", bufsize: "9000k",  badge: "16:9 1080p" },
  landscape_720p:  { label: "Landscape 720p (16:9)",  width: 1280, height: 720,  bitrate: "2500k", maxrate: "3500k", bufsize: "5000k",  badge: "16:9 720p"  },
  portrait_1080p:  { label: "Portrait 1080p / Shorts (9:16)", width: 1080, height: 1920, bitrate: "4500k", maxrate: "6000k", bufsize: "9000k",  badge: "9:16 Shorts" },
  square_1080p:    { label: "Square 1080p (1:1)",     width: 1080, height: 1080, bitrate: "3500k", maxrate: "4500k", bufsize: "7000k",  badge: "1:1 Square" },
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
  streamTags: z.array(z.string()).optional(),
  thumbnailPath: z.string().optional(),
  youtubeBroadcastId: z.string().optional(),
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
  "ocean", "crimson", "emerald", "amber", "violet", "arctic", "sunset", "slate"
] as const;

export type ThemeColor = typeof themeColors[number];

export const themeSettingsSchema = z.object({
  colorTheme: z.enum(themeColors).default("ocean"),
  customPrimary: z.string().optional(),
  customAccent: z.string().optional(),
  customBackground: z.string().optional(),
  terminalFont: z.boolean().default(false),
  scanlines: z.boolean().default(false),
  glowEffects: z.boolean().default(false),
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

export interface ThemePreset {
  name: string;
  primary: string;
  accent: string;
  bg: string;
  primaryHsl: string;
  accentHsl: string;
  bgHsl: string;
  cardHsl: string;
  borderHsl: string;
  sidebarHsl: string;
  mutedHsl: string;
  inputHsl: string;
}

// YouTube API settings schema
export const youtubeApiSettingsSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  refreshToken: z.string().optional(),
  accessToken: z.string().optional(),
  accessTokenExpiresAt: z.number().optional(),
  connectedEmail: z.string().optional(),
});

export type YouTubeApiSettings = z.infer<typeof youtubeApiSettingsSchema>;

export const themePresets: Record<ThemeColor, ThemePreset> = {
  ocean: {
    name: "Ocean Blue",
    primary: "#4B8BF5",
    accent: "#3B7AE0",
    bg: "#0B1426",
    primaryHsl: "217 91% 60%",
    accentHsl: "217 50% 15%",
    bgHsl: "222 47% 6%",
    cardHsl: "222 47% 8%",
    borderHsl: "217 33% 17%",
    sidebarHsl: "222 47% 5%",
    mutedHsl: "217 20% 12%",
    inputHsl: "217 25% 14%",
  },
  crimson: {
    name: "Crimson",
    primary: "#EF4444",
    accent: "#DC2626",
    bg: "#0F0A0A",
    primaryHsl: "0 84% 60%",
    accentHsl: "0 50% 15%",
    bgHsl: "0 20% 5%",
    cardHsl: "0 15% 8%",
    borderHsl: "0 20% 16%",
    sidebarHsl: "0 15% 4%",
    mutedHsl: "0 12% 11%",
    inputHsl: "0 15% 13%",
  },
  emerald: {
    name: "Emerald",
    primary: "#10B981",
    accent: "#059669",
    bg: "#0A1210",
    primaryHsl: "160 84% 39%",
    accentHsl: "160 50% 14%",
    bgHsl: "160 25% 5%",
    cardHsl: "160 20% 7%",
    borderHsl: "160 20% 15%",
    sidebarHsl: "160 20% 4%",
    mutedHsl: "160 12% 11%",
    inputHsl: "160 15% 12%",
  },
  amber: {
    name: "Amber Gold",
    primary: "#F59E0B",
    accent: "#D97706",
    bg: "#100E08",
    primaryHsl: "38 92% 50%",
    accentHsl: "38 45% 14%",
    bgHsl: "38 30% 5%",
    cardHsl: "38 22% 7%",
    borderHsl: "38 22% 16%",
    sidebarHsl: "38 22% 4%",
    mutedHsl: "38 14% 11%",
    inputHsl: "38 16% 13%",
  },
  violet: {
    name: "Violet",
    primary: "#8B5CF6",
    accent: "#7C3AED",
    bg: "#0D0A14",
    primaryHsl: "263 84% 66%",
    accentHsl: "263 50% 14%",
    bgHsl: "263 30% 5%",
    cardHsl: "263 22% 8%",
    borderHsl: "263 22% 16%",
    sidebarHsl: "263 22% 4%",
    mutedHsl: "263 14% 11%",
    inputHsl: "263 16% 13%",
  },
  arctic: {
    name: "Arctic Cyan",
    primary: "#06B6D4",
    accent: "#0891B2",
    bg: "#0A1114",
    primaryHsl: "188 86% 43%",
    accentHsl: "188 50% 14%",
    bgHsl: "198 28% 5%",
    cardHsl: "198 22% 8%",
    borderHsl: "198 22% 16%",
    sidebarHsl: "198 22% 4%",
    mutedHsl: "198 14% 11%",
    inputHsl: "198 16% 13%",
  },
  sunset: {
    name: "Sunset",
    primary: "#F97316",
    accent: "#EA580C",
    bg: "#110D09",
    primaryHsl: "25 95% 53%",
    accentHsl: "25 50% 14%",
    bgHsl: "25 28% 5%",
    cardHsl: "25 22% 8%",
    borderHsl: "25 22% 16%",
    sidebarHsl: "25 22% 4%",
    mutedHsl: "25 14% 11%",
    inputHsl: "25 16% 13%",
  },
  slate: {
    name: "Slate",
    primary: "#94A3B8",
    accent: "#64748B",
    bg: "#0C0E12",
    primaryHsl: "215 16% 65%",
    accentHsl: "215 14% 14%",
    bgHsl: "220 18% 5%",
    cardHsl: "220 14% 8%",
    borderHsl: "220 14% 16%",
    sidebarHsl: "220 14% 4%",
    mutedHsl: "220 10% 11%",
    inputHsl: "220 12% 13%",
  },
};
