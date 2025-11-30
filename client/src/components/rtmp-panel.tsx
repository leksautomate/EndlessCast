import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Settings, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { SiYoutube, SiFacebook } from "react-icons/si";
import type { RtmpEndpoint, RtmpPlatform, InsertRtmpEndpoint } from "@shared/schema";
import { platformInfo, rtmpPlatforms } from "@shared/schema";

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
              className={`p-4 border rounded-lg transition-all ${
                endpoint.enabled ? "bg-card" : "bg-muted/30 opacity-70"
              }`}
              data-testid={`endpoint-card-${endpoint.id}`}
            >
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
                  
                  <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                    {endpoint.rtmpUrl}
                  </p>
                  
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
