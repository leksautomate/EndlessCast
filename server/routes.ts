import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import { storage } from "./storage";
import { streamingService } from "./streaming";
import { emailService } from "./email";
import { insertRtmpEndpointSchema, MAX_STORAGE_BYTES, MAX_VIDEOS, insertEmailSettingsSchema } from "@shared/schema";

const execAsync = promisify(exec);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: MAX_STORAGE_BYTES, // Max single file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-matroska"];
    const allowedExts = [".mp4", ".mov", ".mkv"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only MP4, MOV, and MKV files are allowed."));
    }
  },
});

// Get video duration using ffprobe
async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim()) || 0;
  } catch (error) {
    console.error("Error getting video duration:", error);
    return 0;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ VIDEO ROUTES ============
  
  // Get all videos
  app.get("/api/videos", async (req: Request, res: Response) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Upload video
  app.post("/api/videos/upload", upload.single("video"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check video count limit
      const storageInfo = await storage.getStorageInfo();
      if (storageInfo.videoCount >= MAX_VIDEOS) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: `Maximum ${MAX_VIDEOS} videos allowed. Delete one to upload more.` });
      }

      // Check storage limit
      if (storageInfo.used + req.file.size > MAX_STORAGE_BYTES) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Storage limit exceeded. Delete some videos to free up space." });
      }

      // Get video duration
      const duration = await getVideoDuration(req.file.path);

      const video = await storage.addVideo({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        duration,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
      });

      res.json(video);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  // Delete video
  app.delete("/api/videos/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Check if streaming this video
      const state = await storage.getStreamingState();
      if (state.isStreaming && state.selectedVideoId === id) {
        return res.status(400).json({ message: "Cannot delete video while it's being streamed" });
      }

      // Delete file from disk
      const filePath = path.join(uploadsDir, video.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await storage.deleteVideo(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  // ============ RTMP ENDPOINT ROUTES ============
  
  // Get all endpoints
  app.get("/api/rtmp-endpoints", async (req: Request, res: Response) => {
    try {
      const endpoints = await storage.getRtmpEndpoints();
      res.json(endpoints);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch endpoints" });
    }
  });

  // Create endpoint
  app.post("/api/rtmp-endpoints", async (req: Request, res: Response) => {
    try {
      const result = insertRtmpEndpointSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid endpoint data" });
      }

      const endpoint = await storage.createRtmpEndpoint(result.data);
      res.json(endpoint);
    } catch (error) {
      res.status(500).json({ message: "Failed to create endpoint" });
    }
  });

  // Update endpoint
  app.patch("/api/rtmp-endpoints/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const endpoint = await storage.updateRtmpEndpoint(id, req.body);
      
      if (!endpoint) {
        return res.status(404).json({ message: "Endpoint not found" });
      }

      res.json(endpoint);
    } catch (error) {
      res.status(500).json({ message: "Failed to update endpoint" });
    }
  });

  // Delete endpoint
  app.delete("/api/rtmp-endpoints/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRtmpEndpoint(id);
      
      if (!success) {
        return res.status(404).json({ message: "Endpoint not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete endpoint" });
    }
  });

  // ============ STREAMING ROUTES ============
  
  // Get streaming state
  app.get("/api/streaming/state", async (req: Request, res: Response) => {
    try {
      const state = await storage.getStreamingState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch streaming state" });
    }
  });

  // Select video for streaming
  app.post("/api/streaming/select-video", async (req: Request, res: Response) => {
    try {
      const { videoId } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: "Video ID required" });
      }

      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const state = await storage.getStreamingState();
      if (state.isStreaming) {
        return res.status(400).json({ message: "Cannot change video while streaming" });
      }

      await storage.setStreamingState({ selectedVideoId: videoId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to select video" });
    }
  });

  // Start streaming
  app.post("/api/streaming/start", async (req: Request, res: Response) => {
    try {
      const state = await storage.getStreamingState();
      
      if (state.isStreaming) {
        return res.status(400).json({ message: "Already streaming" });
      }

      if (!state.selectedVideoId) {
        return res.status(400).json({ message: "No video selected" });
      }

      const endpoints = await storage.getRtmpEndpoints();
      const enabledEndpoints = endpoints.filter(e => e.enabled);
      
      if (enabledEndpoints.length === 0) {
        return res.status(400).json({ message: "No RTMP endpoints configured" });
      }

      await streamingService.startStreaming();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Start streaming error:", error);
      res.status(500).json({ message: error.message || "Failed to start streaming" });
    }
  });

  // Stop streaming
  app.post("/api/streaming/stop", async (req: Request, res: Response) => {
    try {
      await streamingService.stopStreaming();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Stop streaming error:", error);
      res.status(500).json({ message: error.message || "Failed to stop streaming" });
    }
  });

  // ============ STORAGE ROUTES ============
  
  // Get storage info
  app.get("/api/storage", async (req: Request, res: Response) => {
    try {
      const info = await storage.getStorageInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storage info" });
    }
  });

  // ============ EMAIL SETTINGS ROUTES ============

  // Get email settings
  app.get("/api/email-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getEmailSettings();
      // Return settings without the password for security
      if (settings) {
        const safe = { ...settings, gmailAppPassword: settings.gmailAppPassword ? "****" : "" };
        res.json(safe);
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  // Update email settings
  app.post("/api/email-settings", async (req: Request, res: Response) => {
    try {
      const parsed = insertEmailSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email settings" });
      }

      const settings = await storage.updateEmailSettings(parsed.data);
      res.json({ message: "Email settings updated" });
    } catch (error: any) {
      console.error("Email settings error:", error);
      res.status(500).json({ message: error.message || "Failed to update email settings" });
    }
  });

  // Test email connection
  app.post("/api/email-settings/test", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getEmailSettings();
      if (!settings) {
        return res.status(400).json({ message: "No email settings configured" });
      }

      const success = await emailService.testConnection(settings);
      if (success) {
        res.json({ message: "Gmail connection successful" });
      } else {
        res.status(400).json({ message: "Failed to connect to Gmail. Check your credentials." });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Email test failed" });
    }
  });

  return httpServer;
}
