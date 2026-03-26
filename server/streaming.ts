import { spawn, ChildProcess } from "child_process";
import { storage } from "./storage";
import { emailService } from "./email";
import { telegramService } from "./telegram";
import type { RtmpEndpoint } from "@shared/schema";
import { outputProfileInfo } from "@shared/schema";
import path from "path";

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 5000;

interface StreamProcess {
  endpointId: string;
  ffmpegProcess: ChildProcess;
}

interface ReconnectState {
  endpointId: string;
  attempts: number;
  timer: NodeJS.Timeout | null;
  videoPath: string;
  endpoint: RtmpEndpoint;
  durationSeconds: number;
}

class StreamingService {
  private processes: Map<string, StreamProcess> = new Map();
  private reconnectStates: Map<string, ReconnectState> = new Map();
  private monitorInterval: NodeJS.Timeout | null = null;

  async startStreaming(durationSeconds?: number): Promise<void> {
    const state = await storage.getStreamingState();

    if (!state.selectedVideoId) {
      throw new Error("No video selected");
    }

    const video = await storage.getVideo(state.selectedVideoId);
    if (!video) {
      throw new Error("Selected video not found");
    }

    const endpoints = await storage.getRtmpEndpoints();
    const enabledEndpoints = endpoints.filter(e => e.enabled);

    if (enabledEndpoints.length === 0) {
      throw new Error("No RTMP endpoints configured");
    }

    const limit = durationSeconds || 42900;

    await storage.setStreamingState({
      isStreaming: true,
      startedAt: new Date().toISOString(),
      endpointStatuses: enabledEndpoints.map(e => ({
        endpointId: e.id,
        status: "connecting" as const,
        reconnectCount: 0,
      })),
    });

    const videoSource = path.join(process.cwd(), "uploads", video.filename);

    for (const endpoint of enabledEndpoints) {
      await this.startEndpointStream(videoSource, endpoint, limit, false);
    }

    await telegramService.notifyStreamStart(enabledEndpoints.map(e => e.name));

    this.startMonitoring();
  }

  private buildFfmpegArgs(videoSource: string, endpoint: RtmpEndpoint, durationSeconds: number): string[] {
    const profile = outputProfileInfo[endpoint.outputProfile ?? "landscape_1080p"];
    const rtmpFullUrl = `${endpoint.rtmpUrl}/${endpoint.streamKey}`;

    let scaleFilter: string;
    if (endpoint.outputProfile === "portrait_1080p") {
      scaleFilter = `scale=${profile.width}:${profile.height}:force_original_aspect_ratio=decrease,pad=${profile.width}:${profile.height}:(ow-iw)/2:(oh-ih)/2`;
    } else if (endpoint.outputProfile === "square_1080p") {
      scaleFilter = `scale='if(gt(iw,ih),${profile.width},-1)':'if(gt(ih,iw),${profile.height},-1)',crop=${profile.width}:${profile.height}`;
    } else {
      scaleFilter = `scale='min(${profile.width},iw)':'min(${profile.height},ih)':force_original_aspect_ratio=decrease,pad=${profile.width}:${profile.height}:(ow-iw)/2:(oh-ih)/2`;
    }

    return [
      "-re",
      "-stream_loop", "-1",
      "-i", videoSource,
      "-t", durationSeconds.toString(),
      "-vf", scaleFilter,
      "-r", "30",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-maxrate", profile.maxrate,
      "-bufsize", profile.bufsize,
      "-pix_fmt", "yuv420p",
      "-g", "60",
      "-c:a", "aac",
      "-b:a", "160k",
      "-ar", "44100",
      "-f", "flv",
      rtmpFullUrl,
    ];
  }

  private async startEndpointStream(
    videoSource: string,
    endpoint: RtmpEndpoint,
    durationSeconds: number,
    isReconnect: boolean,
  ): Promise<void> {
    const ffmpegArgs = this.buildFfmpegArgs(videoSource, endpoint, durationSeconds);

    console.log(
      `[${endpoint.name}] ${isReconnect ? "Reconnecting" : "Starting"} stream → ${endpoint.rtmpUrl} ` +
      `(profile: ${endpoint.outputProfile ?? "landscape_1080p"})`
    );

    const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

    ffmpegProcess.stderr.on("data", (data) => {
      const output = data.toString();
      if (output.includes("frame=")) {
        const bitrateMatch = output.match(/bitrate=\s*([\d.]+)kbits/);
        const fpsMatch = output.match(/fps=\s*([\d.]+)/);
        const frameMatch = output.match(/frame=\s*(\d+)/);
        const dropMatch = output.match(/drop=\s*(\d+)/);

        const totalFrames = frameMatch ? parseInt(frameMatch[1]) : 0;
        const droppedFrames = dropMatch ? parseInt(dropMatch[1]) : 0;
        const dropPercentage = totalFrames > 0 ? (droppedFrames / totalFrames) * 100 : 0;
        const bufferHealth = Math.max(0, Math.min(100, 100 - dropPercentage));

        storage.updateEndpointStatus(endpoint.id, {
          status: "live",
          bitrate: bitrateMatch ? parseFloat(bitrateMatch[1]) * 1000 : undefined,
          fps: fpsMatch ? parseFloat(fpsMatch[1]) : undefined,
          healthMetrics: {
            droppedFrames,
            totalFrames,
            bufferHealth: Math.round(bufferHealth),
          },
        });
      }
    });

    ffmpegProcess.on("error", async (error) => {
      console.error(`[${endpoint.name}] Stream error:`, error.message);
      await storage.updateEndpointStatus(endpoint.id, {
        status: "error",
        errorMessage: error.message,
      });

      const emailSettings = await storage.getEmailSettings();
      if (emailSettings?.enabled && emailSettings?.notifyOnError) {
        const rs = this.reconnectStates.get(endpoint.id);
        await emailService.sendErrorAlert(emailSettings, endpoint.name, error.message, rs?.attempts ?? 1);
      }
      await telegramService.notifyStreamError(endpoint.name, error.message);
    });

    ffmpegProcess.on("exit", async (code) => {
      console.log(`[${endpoint.name}] Exited with code ${code}`);
      this.processes.delete(endpoint.id);

      const state = await storage.getStreamingState();
      if (!state.isStreaming) {
        await storage.updateEndpointStatus(endpoint.id, { status: "stopped" });
        return;
      }

      const isCleanExit = code === 0 || code === 255;
      if (isCleanExit) {
        await storage.updateEndpointStatus(endpoint.id, { status: "stopped" });
        return;
      }

      const errorMsg = `Process exited with code ${code}`;
      await storage.updateEndpointStatus(endpoint.id, { status: "error", errorMessage: errorMsg });

      const emailSettings = await storage.getEmailSettings();
      if (emailSettings?.enabled && emailSettings?.notifyOnError) {
        await emailService.sendErrorAlert(emailSettings, endpoint.name, errorMsg, 1);
      }
      await telegramService.notifyStreamError(endpoint.name, errorMsg);

      await this.scheduleReconnect(videoSource, endpoint, durationSeconds);
    });

    this.processes.set(endpoint.id, { endpointId: endpoint.id, ffmpegProcess });

    await storage.updateEndpointStatus(endpoint.id, { status: "connecting" });

    setTimeout(async () => {
      const proc = this.processes.get(endpoint.id);
      if (proc && !proc.ffmpegProcess.killed) {
        const currentRs = this.reconnectStates.get(endpoint.id);
        await storage.updateEndpointStatus(endpoint.id, {
          status: "live",
          startedAt: new Date().toISOString(),
          reconnectCount: currentRs?.attempts ?? 0,
          nextReconnectAt: undefined,
        });
      }
    }, 5000);
  }

  private async scheduleReconnect(
    videoSource: string,
    endpoint: RtmpEndpoint,
    durationSeconds: number,
  ): Promise<void> {
    let rs = this.reconnectStates.get(endpoint.id);

    if (!rs) {
      const newRs: ReconnectState = {
        endpointId: endpoint.id,
        attempts: 0,
        timer: null,
        videoPath: videoSource,
        endpoint,
        durationSeconds,
      };
      this.reconnectStates.set(endpoint.id, newRs);
      rs = newRs;
    }

    rs.attempts += 1;

    if (rs.attempts > MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[${endpoint.name}] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      await storage.updateEndpointStatus(endpoint.id, {
        status: "error",
        errorMessage: `Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) exceeded`,
        nextReconnectAt: undefined,
      });
      this.reconnectStates.delete(endpoint.id);
      return;
    }

    const nextReconnectAt = new Date(Date.now() + RECONNECT_DELAY_MS).toISOString();
    console.log(`[${endpoint.name}] Reconnect attempt ${rs.attempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY_MS / 1000}s`);

    await storage.updateEndpointStatus(endpoint.id, {
      status: "reconnecting",
      reconnectCount: rs.attempts,
      nextReconnectAt,
    });

    if (rs.timer) clearTimeout(rs.timer);

    const capturedRs = rs;
    capturedRs.timer = setTimeout(async () => {
      const state = await storage.getStreamingState();
      if (!state.isStreaming) {
        this.reconnectStates.delete(endpoint.id);
        return;
      }

      const latestEndpoint = await storage.getRtmpEndpoint(endpoint.id);
      if (!latestEndpoint || !latestEndpoint.enabled) {
        this.reconnectStates.delete(endpoint.id);
        return;
      }

      await this.startEndpointStream(capturedRs.videoPath, latestEndpoint, capturedRs.durationSeconds, true);
    }, RECONNECT_DELAY_MS);
  }

  async stopStreaming(): Promise<void> {
    for (const rs of Array.from(this.reconnectStates.values())) {
      if (rs.timer) clearTimeout(rs.timer);
    }
    this.reconnectStates.clear();

    for (const [id, streamProc] of Array.from(this.processes.entries())) {
      streamProc.ffmpegProcess.kill("SIGTERM");
      await storage.updateEndpointStatus(id, { status: "stopped" });
    }
    this.processes.clear();

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    await storage.setStreamingState({ isStreaming: false, startedAt: undefined });

    await telegramService.notifyStreamStop();
  }

  private startMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.monitorInterval = setInterval(async () => {
      const state = await storage.getStreamingState();
      if (!state.isStreaming) {
        if (this.monitorInterval) {
          clearInterval(this.monitorInterval);
          this.monitorInterval = null;
        }
        return;
      }

      const hasActiveProcesses = this.processes.size > 0;
      const hasPendingReconnects = this.reconnectStates.size > 0;

      if (!hasActiveProcesses && !hasPendingReconnects) {
        await this.stopStreaming();
      }
    }, 5000);
  }

  isStreaming(): boolean {
    return this.processes.size > 0 || this.reconnectStates.size > 0;
  }
}

export const streamingService = new StreamingService();
