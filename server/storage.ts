import { randomUUID } from "crypto";
import type { Video, RtmpEndpoint, StreamingState, StorageInfo, InsertRtmpEndpoint, StreamStatus, Playlist, InsertPlaylist, ScheduledStream, InsertScheduledStream, EmailSettings, InsertEmailSettings, ThemeSettings, InsertThemeSettings, TelegramSettings, InsertTelegramSettings } from "@shared/schema";
import { MAX_STORAGE_BYTES, MAX_VIDEOS } from "@shared/schema";

export interface IStorage {
  // Video operations
  getVideos(): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  addVideo(video: Omit<Video, "id">): Promise<Video>;
  deleteVideo(id: string): Promise<boolean>;

  // RTMP endpoint operations
  getRtmpEndpoints(): Promise<RtmpEndpoint[]>;
  getRtmpEndpoint(id: string): Promise<RtmpEndpoint | undefined>;
  createRtmpEndpoint(endpoint: InsertRtmpEndpoint): Promise<RtmpEndpoint>;
  updateRtmpEndpoint(id: string, endpoint: Partial<InsertRtmpEndpoint>): Promise<RtmpEndpoint | undefined>;
  deleteRtmpEndpoint(id: string): Promise<boolean>;

  // Streaming state operations
  getStreamingState(): Promise<StreamingState>;
  setStreamingState(state: Partial<StreamingState>): Promise<StreamingState>;
  updateEndpointStatus(endpointId: string, status: Partial<StreamStatus>): Promise<void>;

  // Playlist operations
  getPlaylists(): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<boolean>;

  // Scheduled stream operations
  getScheduledStreams(): Promise<ScheduledStream[]>;
  createScheduledStream(stream: InsertScheduledStream): Promise<ScheduledStream>;
  updateScheduledStream(id: string, stream: Partial<InsertScheduledStream>): Promise<ScheduledStream | undefined>;
  deleteScheduledStream(id: string): Promise<boolean>;

  // Email settings operations
  getEmailSettings(): Promise<EmailSettings | null>;
  updateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;

  // Theme settings operations
  getThemeSettings(): Promise<ThemeSettings | null>;
  updateThemeSettings(settings: InsertThemeSettings): Promise<ThemeSettings>;

  // Telegram settings operations
  getTelegramSettings(): Promise<TelegramSettings | null>;
  updateTelegramSettings(settings: InsertTelegramSettings): Promise<TelegramSettings>;

  // Storage info
  getStorageInfo(): Promise<StorageInfo>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, Video>;
  private rtmpEndpoints: Map<string, RtmpEndpoint>;
  private playlists: Map<string, Playlist>;
  private scheduledStreams: Map<string, ScheduledStream>;
  private streamingState: StreamingState;
  private emailSettings: EmailSettings | null;
  private themeSettings: ThemeSettings | null;
  private telegramSettings: TelegramSettings | null;

  constructor() {
    this.videos = new Map();
    this.rtmpEndpoints = new Map();
    this.playlists = new Map();
    this.scheduledStreams = new Map();
    this.emailSettings = null;
    this.themeSettings = null;
    this.telegramSettings = null;
    this.streamingState = {
      isStreaming: false,
      selectedVideoId: null,
      selectedPlaylistId: null,
      playlistIndex: 0,
      endpointStatuses: [],
      stats: [],
    };
  }

  // Video operations
  async getVideos(): Promise<Video[]> {
    return Array.from(this.videos.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async addVideo(video: Omit<Video, "id">): Promise<Video> {
    const id = randomUUID();
    const newVideo: Video = { ...video, id };
    this.videos.set(id, newVideo);
    return newVideo;
  }

  async deleteVideo(id: string): Promise<boolean> {
    // If this video is selected, deselect it
    if (this.streamingState.selectedVideoId === id) {
      this.streamingState.selectedVideoId = null;
    }
    return this.videos.delete(id);
  }

  // RTMP endpoint operations
  async getRtmpEndpoints(): Promise<RtmpEndpoint[]> {
    return Array.from(this.rtmpEndpoints.values());
  }

  async getRtmpEndpoint(id: string): Promise<RtmpEndpoint | undefined> {
    return this.rtmpEndpoints.get(id);
  }

  async createRtmpEndpoint(endpoint: InsertRtmpEndpoint): Promise<RtmpEndpoint> {
    const id = randomUUID();
    const newEndpoint: RtmpEndpoint = { ...endpoint, id };
    this.rtmpEndpoints.set(id, newEndpoint);
    return newEndpoint;
  }

  async updateRtmpEndpoint(id: string, data: Partial<InsertRtmpEndpoint>): Promise<RtmpEndpoint | undefined> {
    const existing = this.rtmpEndpoints.get(id);
    if (!existing) return undefined;

    const updated: RtmpEndpoint = { ...existing, ...data };
    this.rtmpEndpoints.set(id, updated);
    return updated;
  }

  async deleteRtmpEndpoint(id: string): Promise<boolean> {
    // Remove from endpoint statuses
    this.streamingState.endpointStatuses = this.streamingState.endpointStatuses.filter(
      s => s.endpointId !== id
    );
    return this.rtmpEndpoints.delete(id);
  }

  // Streaming state operations
  async getStreamingState(): Promise<StreamingState> {
    return { ...this.streamingState };
  }

  async setStreamingState(state: Partial<StreamingState>): Promise<StreamingState> {
    this.streamingState = { ...this.streamingState, ...state };
    return { ...this.streamingState };
  }

  async updateEndpointStatus(endpointId: string, status: Partial<StreamStatus>): Promise<void> {
    const existing = this.streamingState.endpointStatuses.find(s => s.endpointId === endpointId);
    if (existing) {
      Object.assign(existing, status);
    } else {
      this.streamingState.endpointStatuses.push({
        endpointId,
        status: "idle",
        ...status,
      });
    }
  }

  // Playlist operations
  async getPlaylists(): Promise<Playlist[]> {
    return Array.from(this.playlists.values());
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const id = randomUUID();
    const newPlaylist: Playlist = { ...playlist, id, createdAt: new Date().toISOString() };
    this.playlists.set(id, newPlaylist);
    return newPlaylist;
  }

  async updatePlaylist(id: string, data: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const existing = this.playlists.get(id);
    if (!existing) return undefined;
    const updated: Playlist = { ...existing, ...data };
    this.playlists.set(id, updated);
    return updated;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    if (this.streamingState.selectedPlaylistId === id) {
      this.streamingState.selectedPlaylistId = null;
      this.streamingState.playlistIndex = 0;
    }
    return this.playlists.delete(id);
  }

  // Scheduled stream operations
  async getScheduledStreams(): Promise<ScheduledStream[]> {
    return Array.from(this.scheduledStreams.values());
  }

  async createScheduledStream(stream: InsertScheduledStream): Promise<ScheduledStream> {
    const id = randomUUID();
    const newStream: ScheduledStream = { ...stream, id, createdAt: new Date().toISOString() };
    this.scheduledStreams.set(id, newStream);
    return newStream;
  }

  async updateScheduledStream(id: string, data: Partial<InsertScheduledStream>): Promise<ScheduledStream | undefined> {
    const existing = this.scheduledStreams.get(id);
    if (!existing) return undefined;
    const updated: ScheduledStream = { ...existing, ...data };
    this.scheduledStreams.set(id, updated);
    return updated;
  }

  async deleteScheduledStream(id: string): Promise<boolean> {
    return this.scheduledStreams.delete(id);
  }

  // Email settings operations
  async getEmailSettings(): Promise<EmailSettings | null> {
    return this.emailSettings;
  }

  async updateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    this.emailSettings = settings;
    return this.emailSettings;
  }

  // Theme settings operations
  async getThemeSettings(): Promise<ThemeSettings | null> {
    return this.themeSettings;
  }

  async updateThemeSettings(settings: InsertThemeSettings): Promise<ThemeSettings> {
    this.themeSettings = settings;
    return this.themeSettings;
  }

  // Telegram settings operations
  async getTelegramSettings(): Promise<TelegramSettings | null> {
    return this.telegramSettings;
  }

  async updateTelegramSettings(settings: InsertTelegramSettings): Promise<TelegramSettings> {
    this.telegramSettings = settings;
    return this.telegramSettings;
  }

  // Storage info
  async getStorageInfo(): Promise<StorageInfo> {
    const videos = await this.getVideos();
    const used = videos.reduce((sum, v) => sum + v.size, 0);
    return {
      used,
      limit: MAX_STORAGE_BYTES,
      videoCount: videos.length,
      maxVideos: MAX_VIDEOS,
    };
  }
}

export const storage = new MemStorage();
