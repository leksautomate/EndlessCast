import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Plus, Trash2, Eye, EyeOff, Pencil, Upload, X, ImageIcon, Monitor, Film, Radio, BanIcon } from "lucide-react";
import { SiYoutube, SiFacebook } from "react-icons/si";
import type { RtmpEndpoint, RtmpPlatform, InsertRtmpEndpoint, OutputProfile, Video } from "@shared/schema";
import { platformInfo, rtmpPlatforms, outputProfiles, outputProfileInfo } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface RtmpPanelProps {
  endpoints: RtmpEndpoint[];
  videos: Video[];
  isLoading: boolean;
  onCreate: (endpoint: InsertRtmpEndpoint) => void;
  onUpdate: (endpoint: RtmpEndpoint) => void;
  onDelete: (id: string) => void;
}

function PlatformIcon({ platform, className }: { platform: RtmpPlatform; className?: string }) {
  switch (platform) {
    case "youtube":
      return <SiYoutube className={className} style={{ color: platformInfo.youtube.color }} />;
    case "facebook":
      return <SiFacebook className={className} style={{ color: platformInfo.facebook.color }} />;
    case "rumble":
      return (
        <div className={`font-bold text-xs ${className}`} style={{ color: platformInfo.rumble.color }}>
          R
        </div>
      );
    case "odysee":
      return (
        <div className={`font-bold text-xs ${className}`} style={{ color: platformInfo.odysee.color }}>
          O
        </div>
      );
    case "twitter":
      return (
        <div className={`font-bold text-xs ${className}`}>
          X
        </div>
      );
    default:
      return <Settings className={className} />;
  }
}

function EditEndpointDialog({
  endpoint,
  videos,
  onUpdate,
}: {
  endpoint: RtmpEndpoint;
  videos: Video[];
  onUpdate: (endpoint: RtmpEndpoint) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RtmpEndpoint>(endpoint);
  const [showKey, setShowKey] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailRemoving, setThumbnailRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isYouTube = endpoint.platform === "youtube";

  const handleSave = () => {
    onUpdate(form);
    setOpen(false);
  };

  const handleThumbnailUpload = async (file: File) => {
    setThumbnailUploading(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      const formData = new FormData();
      formData.append("thumbnail", file);

      const res = await fetch(`/api/rtmp-endpoints/${endpoint.id}/thumbnail`, {
        method: "POST",
        headers: { "x-session-id": sessionId || "" },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const updated = await res.json();
      setForm(updated);
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({ title: "Thumbnail uploaded" });
    } catch {
      toast({ title: "Failed to upload thumbnail", variant: "destructive" });
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleThumbnailRemove = async () => {
    setThumbnailRemoving(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/rtmp-endpoints/${endpoint.id}/thumbnail`, {
        method: "DELETE",
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) throw new Error("Remove failed");
      const updated = await res.json();
      setForm(updated);
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({ title: "Thumbnail removed" });
    } catch {
      toast({ title: "Failed to remove thumbnail", variant: "destructive" });
    } finally {
      setThumbnailRemoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          data-testid={`button-edit-endpoint-${endpoint.id}`}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlatformIcon platform={endpoint.platform} className="w-4 h-4" />
            Edit {platformInfo[endpoint.platform].name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="input-edit-endpoint-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-rtmpUrl">RTMP URL</Label>
            <Input
              id="edit-rtmpUrl"
              value={form.rtmpUrl}
              onChange={(e) => setForm({ ...form, rtmpUrl: e.target.value })}
              className="text-sm"
              data-testid="input-edit-rtmp-url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-streamKey">Stream Key</Label>
            <div className="flex gap-1">
              <Input
                id="edit-streamKey"
                type={showKey ? "text" : "password"}
                value={form.streamKey}
                onChange={(e) => setForm({ ...form, streamKey: e.target.value })}
                className="text-sm"
                data-testid="input-edit-stream-key"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowKey(!showKey)}
                data-testid="button-toggle-edit-key"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              Output Profile
            </Label>
            <Select
              value={form.outputProfile ?? "landscape_1080p"}
              onValueChange={(v) => setForm({ ...form, outputProfile: v as OutputProfile })}
            >
              <SelectTrigger data-testid="select-edit-output-profile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outputProfiles.map((p) => (
                  <SelectItem key={p} value={p}>
                    {outputProfileInfo[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controls the resolution and aspect ratio sent to this destination.
            </p>
          </div>

          {videos.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Film className="w-3 h-3" />
                Video Source
              </Label>
              <Select
                value={form.videoId ?? "global"}
                onValueChange={(v) =>
                  setForm({ ...form, videoId: v === "global" ? null : v })
                }
              >
                <SelectTrigger data-testid="select-edit-video-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    Use global selected video (default)
                  </SelectItem>
                  {videos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.originalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Override the video playing on this destination independently. Leave as default to use the globally selected video.
              </p>
            </div>
          )}

          {isYouTube && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <SiYoutube className="w-4 h-4" style={{ color: platformInfo.youtube.color }} />
                <p className="text-sm font-semibold">YouTube Metadata</p>
                <span className="text-[10px] text-muted-foreground/50 bg-muted/40 border border-border/40 px-1.5 py-0.5 rounded ml-auto">
                  auto-syncs on stream start
                </span>
              </div>

              {/* Broadcast ID */}
              <div className="space-y-2">
                <Label htmlFor="edit-broadcastId">Broadcast ID</Label>
                <Input
                  id="edit-broadcastId"
                  value={form.youtubeBroadcastId || ""}
                  onChange={(e) => setForm({ ...form, youtubeBroadcastId: e.target.value })}
                  placeholder="e.g. abc123def456"
                  data-testid="input-edit-broadcast-id"
                />
                <p className="text-xs text-muted-foreground/50">
                  From YouTube Studio — the video ID in your stream URL: youtube.com/watch?v=<strong>ID</strong>
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-streamTitle">Title</Label>
                <Input
                  id="edit-streamTitle"
                  value={form.streamTitle || ""}
                  onChange={(e) => setForm({ ...form, streamTitle: e.target.value })}
                  placeholder="Stream title..."
                  data-testid="input-edit-stream-title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-streamDescription">Description</Label>
                <Textarea
                  id="edit-streamDescription"
                  value={form.streamDescription || ""}
                  onChange={(e) => setForm({ ...form, streamDescription: e.target.value })}
                  placeholder="Stream description..."
                  rows={3}
                  data-testid="input-edit-stream-description"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="edit-streamTags">Tags</Label>
                <Input
                  id="edit-streamTags"
                  value={(form.streamTags ?? []).join(", ")}
                  onChange={(e) => {
                    const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                    setForm({ ...form, streamTags: tags });
                  }}
                  placeholder="gaming, news, livestream..."
                  data-testid="input-edit-stream-tags"
                />
                <p className="text-xs text-muted-foreground/50">Comma-separated tags</p>
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                {form.thumbnailPath ? (
                  <div className="relative">
                    <img
                      src={form.thumbnailPath}
                      alt="Stream thumbnail"
                      className="w-full rounded-lg object-cover aspect-video border"
                      data-testid="img-stream-thumbnail"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={thumbnailUploading}
                        data-testid="button-replace-thumbnail"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Replace
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={handleThumbnailRemove}
                        disabled={thumbnailRemoving}
                        data-testid="button-remove-thumbnail"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-thumbnail"
                  >
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {thumbnailUploading ? "Uploading..." : "Click to upload thumbnail"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP up to 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleThumbnailUpload(file);
                    e.target.value = "";
                  }}
                  data-testid="input-thumbnail-file"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            className="w-full"
            disabled={!form.rtmpUrl || !form.streamKey}
            data-testid="button-save-edit-endpoint"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RtmpPanel({
  endpoints,
  videos,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: RtmpPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newEndpoint, setNewEndpoint] = useState<InsertRtmpEndpoint>({
    platform: "youtube",
    name: "",
    rtmpUrl: platformInfo.youtube.defaultUrl,
    streamKey: "",
    enabled: true,
    outputProfile: "landscape_1080p",
  });

  const handlePlatformChange = (platform: RtmpPlatform) => {
    setNewEndpoint({
      ...newEndpoint,
      platform,
      name: newEndpoint.name || platformInfo[platform].name,
      rtmpUrl: platformInfo[platform].defaultUrl,
    });
  };

  const handleCreate = () => {
    if (newEndpoint.rtmpUrl && newEndpoint.streamKey) {
      onCreate({
        ...newEndpoint,
        name: newEndpoint.name || platformInfo[newEndpoint.platform].name,
      });
      setNewEndpoint({
        platform: "youtube",
        name: "",
        rtmpUrl: platformInfo.youtube.defaultUrl,
        streamKey: "",
        enabled: true,
        outputProfile: "landscape_1080p",
      });
      setIsDialogOpen(false);
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            RTMP Endpoints
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-endpoint">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add RTMP Endpoint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={newEndpoint.platform}
                    onValueChange={(v) => handlePlatformChange(v as RtmpPlatform)}
                  >
                    <SelectTrigger data-testid="select-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rtmpPlatforms.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={platform} className="w-4 h-4" />
                            {platformInfo[platform].name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Display Name (optional)</Label>
                  <Input
                    id="name"
                    value={newEndpoint.name}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                    placeholder={platformInfo[newEndpoint.platform].name}
                    data-testid="input-endpoint-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rtmpUrl">RTMP URL</Label>
                  <Input
                    id="rtmpUrl"
                    value={newEndpoint.rtmpUrl}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, rtmpUrl: e.target.value })}
                    placeholder="rtmp://..."
                    className="text-sm"
                    data-testid="input-rtmp-url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streamKey">Stream Key</Label>
                  <Input
                    id="streamKey"
                    type="password"
                    value={newEndpoint.streamKey}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, streamKey: e.target.value })}
                    placeholder="Enter your stream key"
                    className="text-sm"
                    data-testid="input-stream-key"
                  />
                </div>

                {newEndpoint.platform === "youtube" && (
                  <div className="border-t pt-3 space-y-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <SiYoutube className="w-3 h-3" style={{ color: platformInfo.youtube.color }} />
                      YouTube metadata (for reference only)
                    </p>
                    <p className="text-[10px]  text-muted-foreground/50">
                      Set your live stream title and description in YouTube Studio before going live.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="streamTitle">Stream Title</Label>
                      <Input
                        id="streamTitle"
                        value={newEndpoint.streamTitle || ""}
                        onChange={(e) => setNewEndpoint({ ...newEndpoint, streamTitle: e.target.value })}
                        placeholder="Enter stream title..."
                        data-testid="input-stream-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="streamDescription">Description</Label>
                      <Textarea
                        id="streamDescription"
                        value={newEndpoint.streamDescription || ""}
                        onChange={(e) => setNewEndpoint({ ...newEndpoint, streamDescription: e.target.value })}
                        placeholder="Enter stream description..."
                        rows={2}
                        data-testid="input-stream-description"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thumbnail can be uploaded after saving the endpoint.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  className="w-full"
                  disabled={!newEndpoint.rtmpUrl || !newEndpoint.streamKey}
                  data-testid="button-save-endpoint"
                >
                  Add Endpoint
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : endpoints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No endpoints configured</p>
            <p className="text-xs mt-1">Add an RTMP endpoint to start streaming</p>
          </div>
        ) : (
          endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`rounded-lg border-l-4 border border-l-transparent transition-all overflow-hidden ${
                endpoint.enabled
                  ? "border-l-green-500 bg-card"
                  : "border-l-muted-foreground/20 bg-muted/20"
              }`}
              data-testid={`endpoint-card-${endpoint.id}`}
            >
              {/* YouTube thumbnail preview */}
              {endpoint.platform === "youtube" && endpoint.thumbnailPath && (
                <div className={`relative ${!endpoint.enabled ? "opacity-40" : ""}`}>
                  <img
                    src={endpoint.thumbnailPath}
                    alt="Stream thumbnail"
                    className="w-full object-cover aspect-video"
                    data-testid={`img-thumbnail-${endpoint.id}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {endpoint.streamTitle && (
                    <p
                      className="absolute bottom-2 left-3 right-3 text-white text-sm font-medium truncate"
                      data-testid={`text-thumbnail-title-${endpoint.id}`}
                    >
                      {endpoint.streamTitle}
                    </p>
                  )}
                </div>
              )}

              <div className={`p-4 ${!endpoint.enabled ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${platformInfo[endpoint.platform].color}15` }}
                  >
                    <PlatformIcon platform={endpoint.platform} className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm flex-1 min-w-0 truncate" data-testid={`text-endpoint-name-${endpoint.id}`}>
                        {endpoint.name}
                      </p>
                      {endpoint.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[9px]  tracking-widest uppercase px-1.5 py-0.5 rounded border border-green-500/40 bg-green-500/10 text-green-400 flex-shrink-0">
                          <Radio className="w-2.5 h-2.5" />
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px]  tracking-widest uppercase px-1.5 py-0.5 rounded border border-muted-foreground/20 bg-muted/30 text-muted-foreground/50 flex-shrink-0">
                          <BanIcon className="w-2.5 h-2.5" />
                          Excluded
                        </span>
                      )}
                    </div>

                    {/* YouTube title (when no thumbnail) */}
                    {endpoint.platform === "youtube" && endpoint.streamTitle && !endpoint.thumbnailPath && (
                      <p
                        className="text-xs text-foreground/80 mt-0.5 truncate"
                        data-testid={`text-stream-title-${endpoint.id}`}
                      >
                        {endpoint.streamTitle}
                      </p>
                    )}

                    {/* YouTube description */}
                    {endpoint.platform === "youtube" && endpoint.streamDescription && (
                      <p
                        className="text-xs text-muted-foreground mt-0.5 line-clamp-2"
                        data-testid={`text-stream-description-${endpoint.id}`}
                      >
                        {endpoint.streamDescription}
                      </p>
                    )}

                    <p className="text-xs  text-muted-foreground mt-1 truncate">
                      {endpoint.rtmpUrl}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 "
                        data-testid={`badge-profile-${endpoint.id}`}
                      >
                        <Monitor className="w-2.5 h-2.5 mr-1" />
                        {outputProfileInfo[endpoint.outputProfile ?? "landscape_1080p"].badge}
                      </Badge>
                      {endpoint.videoId ? (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0  border-primary/40 text-primary/80"
                          data-testid={`badge-video-${endpoint.id}`}
                        >
                          <Film className="w-2.5 h-2.5 mr-1" />
                          {videos.find(v => v.id === endpoint.videoId)?.originalName ?? "Custom video"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0  text-muted-foreground"
                          data-testid={`badge-video-global-${endpoint.id}`}
                        >
                          <Film className="w-2.5 h-2.5 mr-1" />
                          Global video
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded  flex-1 truncate">
                          {showKeys[endpoint.id]
                            ? endpoint.streamKey
                            : "••••••••••••••••"}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(endpoint.id)}
                          data-testid={`button-toggle-key-${endpoint.id}`}
                        >
                          {showKeys[endpoint.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <EditEndpointDialog endpoint={endpoint} videos={videos} onUpdate={onUpdate} />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(endpoint.id)}
                        data-testid={`button-delete-endpoint-${endpoint.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Broadcast inclusion toggle — clearly labeled row at the bottom */}
              <div
                className={`flex items-center justify-between px-4 py-2.5 border-t cursor-pointer transition-colors select-none ${
                  endpoint.enabled
                    ? "border-green-500/15 bg-green-500/5 hover:bg-green-500/10"
                    : "border-muted-foreground/10 bg-muted/10 hover:bg-muted/20"
                }`}
                onClick={() => onUpdate({ ...endpoint, enabled: !endpoint.enabled })}
                data-testid={`button-toggle-broadcast-${endpoint.id}`}
              >
                <div className="flex items-center gap-2">
                  <Radio className={`w-3 h-3 ${endpoint.enabled ? "text-green-400" : "text-muted-foreground/40"}`} />
                  <span className={`text-[10px]  tracking-widest uppercase ${endpoint.enabled ? "text-green-400" : "text-muted-foreground/40"}`}>
                    {endpoint.enabled ? "Included in broadcast — click to exclude" : "Not broadcasting — click to include"}
                  </span>
                </div>
                <Switch
                  checked={endpoint.enabled}
                  onCheckedChange={(enabled) => onUpdate({ ...endpoint, enabled })}
                  data-testid={`switch-endpoint-${endpoint.id}`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ))
        )}

        {/* Quick-add buttons for common platforms */}
        {endpoints.length < 6 && (
          <div className="pt-2 border-t mt-4">
            <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-2">
              {rtmpPlatforms
                .filter(p => p !== "custom" && !endpoints.some(e => e.platform === p))
                .slice(0, 3)
                .map(platform => (
                  <Badge
                    key={platform}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      setNewEndpoint({
                        platform,
                        name: platformInfo[platform].name,
                        rtmpUrl: platformInfo[platform].defaultUrl,
                        streamKey: "",
                        enabled: true,
                        outputProfile: "landscape_1080p",
                      });
                      setIsDialogOpen(true);
                    }}
                    data-testid={`badge-quick-add-${platform}`}
                  >
                    <PlatformIcon platform={platform} className="w-3 h-3 mr-1" />
                    {platformInfo[platform].name}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
