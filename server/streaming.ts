import { spawn, ChildProcess } from "child_process";
import { storage } from "./storage";
import { emailService } from "./email";
import type { RtmpEndpoint } from "@shared/schema";
import path from "path";

interface StreamProcess {
  endpointId: string;
  ffmpegProcess: ChildProcess;
}

class StreamingService {
  private processes: Map<string, StreamProcess> = new Map();
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

    // Update streaming state
    await storage.setStreamingState({
      isStreaming: true,
      startedAt: new Date().toISOString(),
      endpointStatuses: enabledEndpoints.map(e => ({
        endpointId: e.id,
        status: "connecting" as const,
      })),
    });

    // Default duration to 11 hours 55 minutes if not provided
    // 11 * 3600 + 55 * 60 = 39600 + 3300 = 42900 seconds
    const limit = durationSeconds || 42900;

    // Start streaming to each endpoint
    for (const endpoint of enabledEndpoints) {
      await this.startEndpointStream(video, endpoint, limit);
    }

    // Start monitoring
    this.startMonitoring();
  }

  private async startEndpointStream(video: any, endpoint: RtmpEndpoint, durationSeconds: number): Promise<void> {
    // Use local file storage only
    const videoSource = path.join(process.cwd(), "uploads", video.filename);
    console.log(`Streaming from local storage: ${videoSource}`);

    const rtmpFullUrl = `${endpoint.rtmpUrl}/${endpoint.streamKey}`;

    // FFmpeg command to loop video and stream to RTMP
    // Scale to max 1920x1080 while maintaining aspect ratio (for Facebook compatibility)
    const ffmpegArgs = [
      "-re",                          // Read input at native frame rate
      "-stream_loop", "-1",           // Loop indefinitely
      "-i", videoSource,              // Input file (local storage)
      "-t", durationSeconds.toString(), // Stop writing output after duration
      "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
      "-r", "30",                     // Force 30 fps output (YouTube minimum)
      "-c:v", "libx264",              // Video codec
      "-preset", "veryfast",          // Encoding speed (RAM-efficient)
      "-maxrate", "3000k",            // Max bitrate
      "-bufsize", "6000k",            // Buffer size
      "-pix_fmt", "yuv420p",          // Pixel format
      "-g", "60",                     // Keyframe interval (2 seconds at 30fps)
      "-c:a", "aac",                  // Audio codec
      "-b:a", "160k",                 // Audio bitrate
      "-ar", "44100",                 // Audio sample rate
      "-f", "flv",                    // Output format
      rtmpFullUrl                     // RTMP destination
    ];

    console.log(`Starting stream to ${endpoint.name}: ${endpoint.rtmpUrl} for ${durationSeconds} seconds`);

    const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

    ffmpegProcess.stderr.on("data", (data) => {
      const output = data.toString();
      // Parse FFmpeg output for stats
      if (output.includes("frame=")) {
        // Extract metrics from FFmpeg output
        const bitrateMatch = output.match(/bitrate=\s*([\d.]+)kbits/);
        const fpsMatch = output.match(/fps=\s*([\d.]+)/);
        const frameMatch = output.match(/frame=\s*(\d+)/);
        const dropMatch = output.match(/drop=\s*(\d+)/);

        const totalFrames = frameMatch ? parseInt(frameMatch[1]) : 0;
        const droppedFrames = dropMatch ? parseInt(dropMatch[1]) : 0;

        // Calculate buffer health (100% - drop percentage)
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
      console.error(`Stream error for ${endpoint.name}:`, error.message);
      await storage.updateEndpointStatus(endpoint.id, {
        status: "error",
        errorMessage: error.message,
      });

      // Send email alert if enabled
      const emailSettings = await storage.getEmailSettings();
      if (emailSettings?.enabled && emailSettings?.notifyOnError) {
        await emailService.sendErrorAlert(
          emailSettings,
          endpoint.name,
          error.message,
          1
        );
      }
    });

    ffmpegProcess.on("exit", async (code) => {
      console.log(`Stream to ${endpoint.name} exited with code ${code}`);
      this.processes.delete(endpoint.id);

      const state = await storage.getStreamingState();
      if (state.isStreaming) {
        if (code !== 0 && code !== 255) { // 255 is often returned when killed via signal or -t
          // Stream ended unexpectedly with error
          const errorMsg = `Process exited with code ${code}`;
          await storage.updateEndpointStatus(endpoint.id, {
            status: "error",
            errorMessage: errorMsg,
          });

          // Send email alert if enabled
          const emailSettings = await storage.getEmailSettings();
          if (emailSettings?.enabled && emailSettings?.notifyOnError) {
            await emailService.sendErrorAlert(
              emailSettings,
              endpoint.name,
              errorMsg,
              1
            );
          }
        } else {
          // Clean exit (e.g. duration reached)
          await storage.updateEndpointStatus(endpoint.id, {
            status: "stopped",
          });
        }
      } else {
        await storage.updateEndpointStatus(endpoint.id, {
          status: "stopped",
        });
      }
    });

    this.processes.set(endpoint.id, {
      endpointId: endpoint.id,
      ffmpegProcess,
    });

    // Mark as connecting initially
    await storage.updateEndpointStatus(endpoint.id, {
      status: "connecting",
    });

    // Assume live after a short delay (FFmpeg doesn't clearly indicate connection success)
    setTimeout(async () => {
      const proc = this.processes.get(endpoint.id);
      if (proc && !proc.ffmpegProcess.killed) {
        await storage.updateEndpointStatus(endpoint.id, {
          status: "live",
          startedAt: new Date().toISOString(),
        });
      }
    }, 5000);
  }

  async stopStreaming(): Promise<void> {
    // Stop all processes
    const entries = Array.from(this.processes.entries());
    for (const [id, streamProc] of entries) {
      streamProc.ffmpegProcess.kill("SIGTERM");
      await storage.updateEndpointStatus(id, {
        status: "stopped",
      });
    }
    this.processes.clear();

    // Stop monitoring
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    // Update state
    await storage.setStreamingState({
      isStreaming: false,
      startedAt: undefined,
    });
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

      // Check if all processes are dead
      let allDead = true;
      const entries = Array.from(this.processes.entries());
      for (const [, streamProc] of entries) {
        if (!streamProc.ffmpegProcess.killed) {
          allDead = false;
        }
      }

      if (allDead && this.processes.size === 0) {
        await this.stopStreaming();
      }
    }, 5000);
  }

  isStreaming(): boolean {
    return this.processes.size > 0;
  }
}

export const streamingService = new StreamingService();
