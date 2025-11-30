import { randomUUID } from "crypto";
import type { Video, RtmpEndpoint, StreamingState, StorageInfo, InsertRtmpEndpoint, StreamStatus } from "@shared/schema";
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
  
  // Storage info
  getStorageInfo(): Promise<StorageInfo>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, Video>;
  private rtmpEndpoints: Map<string, RtmpEndpoint>;
  private streamingState: StreamingState;

  constructor() {
    this.videos = new Map();
    this.rtmpEndpoints = new Map();
    this.streamingState = {
      isStreaming: false,
      selectedVideoId: null,
      endpointStatuses: [],
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
