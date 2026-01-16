import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import type { Video, RtmpEndpoint, StreamingState, StorageInfo, InsertRtmpEndpoint, StreamStatus, Playlist, InsertPlaylist, ScheduledStream, InsertScheduledStream, EmailSettings, InsertEmailSettings, ThemeSettings, InsertThemeSettings, TelegramSettings, InsertTelegramSettings } from "@shared/schema";
import { MAX_STORAGE_BYTES, MAX_VIDEOS } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "storage.json");

interface StorageData {
  videos: Record<string, Video>;
  rtmpEndpoints: Record<string, RtmpEndpoint>;
  playlists: Record<string, Playlist>;
  scheduledStreams: Record<string, ScheduledStream>;
  emailSettings: EmailSettings | null;
  themeSettings: ThemeSettings | null;
  telegramSettings: TelegramSettings | null;
}

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
  private saveTimeout: NodeJS.Timeout | null = null;

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

    this.loadFromDisk();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromDisk(): void {
    try {
      this.ensureDataDir();
      
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const data: StorageData = JSON.parse(raw);
        
        this.videos = new Map(Object.entries(data.videos || {}));
        this.rtmpEndpoints = new Map(Object.entries(data.rtmpEndpoints || {}));
        this.playlists = new Map(Object.entries(data.playlists || {}));
        this.scheduledStreams = new Map(Object.entries(data.scheduledStreams || {}));
        this.emailSettings = data.emailSettings || null;
        this.themeSettings = data.themeSettings || null;
        this.telegramSettings = data.telegramSettings || null;
        
        console.log(`✓ Loaded ${this.videos.size} videos, ${this.rtmpEndpoints.size} RTMP endpoints from disk`);
      } else {
        console.log("✓ No existing data file, starting fresh");
      }
    } catch (error) {
      console.error("⚠ Error loading data from disk:", error);
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.saveToDisk(), 500);
  }

  private saveToDisk(): void {
    try {
      this.ensureDataDir();
      
      const data: StorageData = {
        videos: Object.fromEntries(this.videos),
        rtmpEndpoints: Object.fromEntries(this.rtmpEndpoints),
        playlists: Object.fromEntries(this.playlists),
        scheduledStreams: Object.fromEntries(this.scheduledStreams),
        emailSettings: this.emailSettings,
        themeSettings: this.themeSettings,
        telegramSettings: this.telegramSettings,
      };
      
      const tempFile = DATA_FILE + ".tmp";
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempFile, DATA_FILE);
    } catch (error) {
      console.error("⚠ Error saving data to disk:", error);
    }
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
    this.scheduleSave();
    return newVideo;
  }

  async deleteVideo(id: string): Promise<boolean> {
    if (this.streamingState.selectedVideoId === id) {
      this.streamingState.selectedVideoId = null;
    }
    const result = this.videos.delete(id);
    if (result) {
      this.scheduleSave();
    }
    return result;
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
    this.scheduleSave();
    return newEndpoint;
  }

  async updateRtmpEndpoint(id: string, data: Partial<InsertRtmpEndpoint>): Promise<RtmpEndpoint | undefined> {
    const existing = this.rtmpEndpoints.get(id);
    if (!existing) return undefined;

    const updated: RtmpEndpoint = { ...existing, ...data };
    this.rtmpEndpoints.set(id, updated);
    this.scheduleSave();
    return updated;
  }

  async deleteRtmpEndpoint(id: string): Promise<boolean> {
    this.streamingState.endpointStatuses = this.streamingState.endpointStatuses.filter(
      s => s.endpointId !== id
    );
    const result = this.rtmpEndpoints.delete(id);
    if (result) {
      this.scheduleSave();
    }
    return result;
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
    this.scheduleSave();
    return newPlaylist;
  }

  async updatePlaylist(id: string, data: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const existing = this.playlists.get(id);
    if (!existing) return undefined;
    const updated: Playlist = { ...existing, ...data };
    this.playlists.set(id, updated);
    this.scheduleSave();
    return updated;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    if (this.streamingState.selectedPlaylistId === id) {
      this.streamingState.selectedPlaylistId = null;
      this.streamingState.playlistIndex = 0;
    }
    const result = this.playlists.delete(id);
    if (result) {
      this.scheduleSave();
    }
    return result;
  }

  // Scheduled stream operations
  async getScheduledStreams(): Promise<ScheduledStream[]> {
    return Array.from(this.scheduledStreams.values());
  }

  async createScheduledStream(stream: InsertScheduledStream): Promise<ScheduledStream> {
    const id = randomUUID();
    const newStream: ScheduledStream = { ...stream, id, createdAt: new Date().toISOString() };
    this.scheduledStreams.set(id, newStream);
    this.scheduleSave();
    return newStream;
  }

  async updateScheduledStream(id: string, data: Partial<InsertScheduledStream>): Promise<ScheduledStream | undefined> {
    const existing = this.scheduledStreams.get(id);
    if (!existing) return undefined;
    const updated: ScheduledStream = { ...existing, ...data };
    this.scheduledStreams.set(id, updated);
    this.scheduleSave();
    return updated;
  }

  async deleteScheduledStream(id: string): Promise<boolean> {
    const result = this.scheduledStreams.delete(id);
    if (result) {
      this.scheduleSave();
    }
    return result;
  }

  // Email settings operations
  async getEmailSettings(): Promise<EmailSettings | null> {
    return this.emailSettings;
  }

  async updateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    this.emailSettings = settings;
    this.scheduleSave();
    return this.emailSettings;
  }

  // Theme settings operations
  async getThemeSettings(): Promise<ThemeSettings | null> {
    return this.themeSettings;
  }

  async updateThemeSettings(settings: InsertThemeSettings): Promise<ThemeSettings> {
    this.themeSettings = settings;
    this.scheduleSave();
    return this.themeSettings;
  }

  // Telegram settings operations
  async getTelegramSettings(): Promise<TelegramSettings | null> {
    return this.telegramSettings;
  }

  async updateTelegramSettings(settings: InsertTelegramSettings): Promise<TelegramSettings> {
    this.telegramSettings = settings;
    this.scheduleSave();
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
