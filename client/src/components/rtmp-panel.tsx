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
import { Settings, Plus, Trash2, Eye, EyeOff, Pencil, Upload, X, ImageIcon, Monitor } from "lucide-react";
import { SiYoutube, SiFacebook } from "react-icons/si";
import type { RtmpEndpoint, RtmpPlatform, InsertRtmpEndpoint, OutputProfile } from "@shared/schema";
import { platformInfo, rtmpPlatforms, outputProfiles, outputProfileInfo } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface RtmpPanelProps {
  endpoints: RtmpEndpoint[];
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
  onUpdate,
}: {
  endpoint: RtmpEndpoint;
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
              className="font-mono text-sm"
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
                className="font-mono text-sm"
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

          {isYouTube && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <SiYoutube className="w-4 h-4" style={{ color: platformInfo.youtube.color }} />
                  YouTube Stream Metadata
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-streamTitle">Stream Title</Label>
                    <Input
                      id="edit-streamTitle"
                      value={form.streamTitle || ""}
                      onChange={(e) => setForm({ ...form, streamTitle: e.target.value })}
                      placeholder="Enter stream title..."
                      data-testid="input-edit-stream-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-streamDescription">Description</Label>
                    <Textarea
                      id="edit-streamDescription"
                      value={form.streamDescription || ""}
                      onChange={(e) => setForm({ ...form, streamDescription: e.target.value })}
                      placeholder="Enter stream description..."
                      rows={3}
                      data-testid="input-edit-stream-description"
                    />
                  </div>

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
                        <p className="text-xs text-muted-foreground mt-1">
                          JPEG, PNG, WebP up to 10MB
                        </p>
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
              </div>
            </>
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
                    className="font-mono text-sm"
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
                    className="font-mono text-sm"
                    data-testid="input-stream-key"
                  />
                </div>

                {newEndpoint.platform === "youtube" && (
                  <div className="border-t pt-3 space-y-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <SiYoutube className="w-3 h-3" style={{ color: platformInfo.youtube.color }} />
                      YouTube metadata (optional — add after creating)
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
              className={`border rounded-lg transition-all overflow-hidden ${
                endpoint.enabled ? "bg-card" : "bg-muted/30 opacity-70"
              }`}
              data-testid={`endpoint-card-${endpoint.id}`}
            >
              {/* YouTube thumbnail preview */}
              {endpoint.platform === "youtube" && endpoint.thumbnailPath && (
                <div className="relative">
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

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${platformInfo[endpoint.platform].color}15` }}
                  >
                    <PlatformIcon platform={endpoint.platform} className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm" data-testid={`text-endpoint-name-${endpoint.id}`}>
                        {endpoint.name}
                      </p>
                      <Switch
                        checked={endpoint.enabled}
                        onCheckedChange={(enabled) => onUpdate({ ...endpoint, enabled })}
                        data-testid={`switch-endpoint-${endpoint.id}`}
                      />
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

                    <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                      {endpoint.rtmpUrl}
                    </p>

                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 font-mono"
                        data-testid={`badge-profile-${endpoint.id}`}
                      >
                        <Monitor className="w-2.5 h-2.5 mr-1" />
                        {outputProfileInfo[endpoint.outputProfile ?? "landscape_1080p"].badge}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
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
                      <EditEndpointDialog endpoint={endpoint} onUpdate={onUpdate} />
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
