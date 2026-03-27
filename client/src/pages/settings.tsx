import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTheme, themePresets } from "@/components/theme-provider";
import {
  Mail,
  AlertCircle,
  Palette,
  Send,
  Info,
  Eye,
  EyeOff,
  CheckCircle,
  Link2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { SiTelegram, SiYoutube } from "react-icons/si";
import {
  insertEmailSettingsSchema,
  insertTelegramSettingsSchema,
  type InsertEmailSettings,
  type InsertTelegramSettings,
  type ThemeColor,
} from "@shared/schema";

interface SettingsProps {
  onLogout?: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  const { toast } = useToast();
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [ytClientId, setYtClientId] = useState("");
  const [ytClientSecret, setYtClientSecret] = useState("");
  const [ytSaving, setYtSaving] = useState(false);
  const [ytConnecting, setYtConnecting] = useState(false);
  const [ytDisconnecting, setYtDisconnecting] = useState(false);
  const { theme, setTheme, settings: themeSettings } = useTheme();

  const { data: emailSettings } = useQuery({
    queryKey: ["/api/email-settings"],
    queryFn: async () => {
      const res = await fetch("/api/email-settings");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: telegramSettings } = useQuery({
    queryKey: ["/api/telegram-settings"],
    queryFn: async () => {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/telegram-settings", {
        headers: sessionId ? { "x-session-id": sessionId } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: ytSettings, refetch: refetchYt } = useQuery({
    queryKey: ["/api/youtube/settings"],
    queryFn: async () => {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/youtube/settings", {
        headers: sessionId ? { "x-session-id": sessionId } : {},
      });
      if (!res.ok) return null;
      return res.json() as Promise<{ clientId: string; clientSecret: string; connected: boolean; connectedEmail?: string } | null>;
    },
  });

  useEffect(() => {
    if (ytSettings) {
      setYtClientId(ytSettings.clientId || "");
      setYtClientSecret(ytSettings.clientSecret || "");
    }
  }, [ytSettings]);

  const handleYtSave = async () => {
    setYtSaving(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/youtube/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(sessionId ? { "x-session-id": sessionId } : {}) },
        body: JSON.stringify({ clientId: ytClientId, clientSecret: ytClientSecret }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Credentials saved" });
      refetchYt();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setYtSaving(false);
    }
  };

  const handleYtConnect = async () => {
    setYtConnecting(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/youtube/auth-url", {
        headers: sessionId ? { "x-session-id": sessionId } : {},
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }
      const { url, redirectUri } = await res.json();
      toast({ title: "Opening Google OAuth…", description: `Redirect URI: ${redirectUri}` });
      const popup = window.open(url, "_blank", "width=500,height=600");
      const handler = (e: MessageEvent) => {
        if (e.data?.type === "youtube-auth") {
          window.removeEventListener("message", handler);
          if (e.data.success) {
            toast({ title: "YouTube Connected", description: `Signed in as ${e.data.email}` });
            refetchYt();
          } else {
            toast({ title: "Connection Failed", description: e.data.error || "OAuth error", variant: "destructive" });
          }
          setYtConnecting(false);
        }
      };
      window.addEventListener("message", handler);
      setTimeout(() => { window.removeEventListener("message", handler); setYtConnecting(false); }, 120_000);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setYtConnecting(false);
    }
  };

  const handleYtDisconnect = async () => {
    setYtDisconnecting(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      await fetch("/api/youtube/disconnect", {
        method: "DELETE",
        headers: sessionId ? { "x-session-id": sessionId } : {},
      });
      toast({ title: "YouTube Disconnected" });
      refetchYt();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setYtDisconnecting(false);
    }
  };

  const emailForm = useForm<InsertEmailSettings>({
    resolver: zodResolver(insertEmailSettingsSchema),
    defaultValues: {
      enabled: false,
      gmailAddress: "",
      gmailAppPassword: "",
      notifyOnError: true,
    },
  });

  const telegramForm = useForm<InsertTelegramSettings>({
    resolver: zodResolver(insertTelegramSettingsSchema),
    defaultValues: {
      enabled: false,
      botToken: "",
      chatId: "",
      notifyOnStart: true,
      notifyOnStop: true,
      notifyOnError: true,
    },
  });

  useEffect(() => {
    if (emailSettings) emailForm.reset(emailSettings);
  }, [emailSettings]);

  useEffect(() => {
    if (telegramSettings) telegramForm.reset(telegramSettings);
  }, [telegramSettings]);

  const updateEmailMutation = useMutation({
    mutationFn: async (data: InsertEmailSettings) => {
      const res = await apiRequest("POST", "/api/email-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({ title: "Settings Saved", description: "Email configuration updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save settings", variant: "destructive" });
    },
  });

  const updateTelegramMutation = useMutation({
    mutationFn: async (data: InsertTelegramSettings) => {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/telegram-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telegram-settings"] });
      toast({ title: "Settings Saved", description: "Telegram configuration updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save settings", variant: "destructive" });
    },
  });

  const onEmailSubmit = (data: InsertEmailSettings) => updateEmailMutation.mutate(data);
  const onTelegramSubmit = (data: InsertTelegramSettings) => updateTelegramMutation.mutate(data);

  const handleTestEmail = async () => {
    const formValues = emailForm.getValues();
    if (!formValues.gmailAddress || !formValues.gmailAppPassword) {
      toast({ title: "Missing Information", description: "Enter Gmail address and app password first", variant: "destructive" });
      return;
    }
    setTestingEmail(true);
    try {
      const res = await fetch("/api/email-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Connection failed");
      }
      toast({ title: "Connection Successful", description: "Gmail SMTP verified." });
    } catch (error: any) {
      toast({ title: "Connection Failed", description: error.message || "Could not connect to Gmail", variant: "destructive" });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestTelegram = async () => {
    const formValues = telegramForm.getValues();
    if (!formValues.botToken || !formValues.chatId) {
      toast({ title: "Missing Information", description: "Enter bot token and chat ID first", variant: "destructive" });
      return;
    }
    setTestingTelegram(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/telegram-settings/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Connection failed");
      }
      toast({ title: "Connection Successful", description: "Telegram bot verified. Check your chat for a test message." });
    } catch (error: any) {
      toast({ title: "Connection Failed", description: error.message || "Could not connect to Telegram", variant: "destructive" });
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border/60 h-auto rounded-lg overflow-hidden p-0">
            <TabsTrigger value="theme" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs py-2.5 rounded-none">
              <Palette className="w-3.5 h-3.5 mr-1.5" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="youtube" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs py-2.5 rounded-none border-x border-border/40">
              <SiYoutube className="w-3.5 h-3.5 mr-1.5" style={{ color: "currentColor" }} />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="telegram" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs py-2.5 rounded-none border-r border-border/40">
              <SiTelegram className="w-3.5 h-3.5 mr-1.5" />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs py-2.5 rounded-none">
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="mt-5">
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <SiYoutube className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">YouTube API</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically sync title, description, tags, and thumbnail to your broadcasts
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Connection status */}
                {ytSettings?.connected ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-green-500">Connected</p>
                        {ytSettings.connectedEmail && (
                          <p className="text-[11px] text-muted-foreground/60">{ytSettings.connectedEmail}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleYtDisconnect}
                      disabled={ytDisconnecting}
                    >
                      <LogOut className="w-3 h-3 mr-1.5" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/40 bg-muted/20">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground/60">Not connected — enter credentials below and click Connect</p>
                  </div>
                )}

                {/* Setup instructions */}
                <div className="rounded-lg bg-muted/20 border border-border/40 p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Setup (one-time)</p>
                  <ol className="text-xs text-muted-foreground/70 space-y-1 list-decimal list-inside">
                    <li>Go to <strong>console.cloud.google.com</strong> → Create a project</li>
                    <li>Enable <strong>YouTube Data API v3</strong></li>
                    <li>Create <strong>OAuth 2.0 credentials</strong> (Desktop or Web app)</li>
                    <li>Add this as an authorized redirect URI: <code className="text-primary/80 bg-primary/5 px-1 rounded">{window.location.origin}/api/youtube/callback</code></li>
                    <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> below</li>
                  </ol>
                </div>

                {/* Credentials */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Client ID</label>
                    <Input
                      value={ytClientId}
                      onChange={(e) => setYtClientId(e.target.value)}
                      placeholder="123456789-abc...apps.googleusercontent.com"
                      className="text-sm bg-muted/20 border-border/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Client Secret</label>
                    <Input
                      type="password"
                      value={ytClientSecret}
                      onChange={(e) => setYtClientSecret(e.target.value)}
                      placeholder="GOCSPX-..."
                      className="text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleYtSave}
                      disabled={ytSaving || !ytClientId}
                      className="h-8 text-xs"
                    >
                      {ytSaving ? <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> : null}
                      Save Credentials
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleYtConnect}
                      disabled={ytConnecting || !ytSettings?.clientId}
                      className="h-8 text-xs bg-red-600 hover:bg-red-500 text-white border-0"
                    >
                      {ytConnecting
                        ? <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                        : <Link2 className="w-3 h-3 mr-1.5" />
                      }
                      {ytSettings?.connected ? "Re-connect Account" : "Connect YouTube Account"}
                    </Button>
                  </div>
                </div>

                {/* How it works */}
                <div className="border-t border-border/40 pt-4">
                  <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                    Once connected, go to <strong>Destinations</strong> → Edit any YouTube endpoint → fill in Title, Description, Tags, Thumbnail, and Broadcast ID.
                    All metadata syncs automatically each time you click Start Broadcast.
                    You can also sync manually via the endpoint settings.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="mt-5">
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Color Theme</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose a color scheme for your dashboard</p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(themePresets) as ThemeColor[]).map((themeKey) => {
                    const preset = themePresets[themeKey];
                    const isActive = theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => setTheme(themeKey)}
                        className={`group relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                          isActive
                            ? "border-current ring-1 ring-current/20 scale-[1.02]"
                            : "border-border/40 hover:border-border hover:scale-[1.01]"
                        }`}
                        style={isActive ? { borderColor: preset.primary, color: preset.primary } : undefined}
                        data-testid={`button-theme-${themeKey}`}
                      >
                        <div
                          className="h-16 w-full relative"
                          style={{ backgroundColor: preset.bg }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 p-2">
                            <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: preset.bg, border: `1px solid ${preset.primary}20` }} />
                            <div className="flex-1 h-10 rounded-md flex flex-col gap-1 p-1.5" style={{ backgroundColor: `${preset.primary}10`, border: `1px solid ${preset.primary}15` }}>
                              <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: `${preset.primary}40` }} />
                              <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: `${preset.primary}25` }} />
                            </div>
                          </div>
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5">
                              <CheckCircle className="w-4 h-4" style={{ color: preset.primary }} />
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: `${preset.bg}` }}>
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-1"
                            style={{
                              backgroundColor: preset.primary,
                              ringColor: isActive ? preset.primary : "transparent",
                              ringOffsetColor: preset.bg,
                              boxShadow: isActive ? `0 0 8px ${preset.primary}60` : "none",
                            }}
                          />
                          <span className="text-xs font-medium truncate" style={{ color: isActive ? preset.primary : "#9CA3AF" }}>
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3">Live Preview</p>
                  <div className="rounded-xl border border-border/40 overflow-hidden">
                    <div className="bg-card p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Active Stream</span>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Live</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">24</p>
                          <p className="text-[10px] text-muted-foreground">Hours</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                          <p className="text-lg font-bold text-primary">3</p>
                          <p className="text-[10px] text-muted-foreground">Channels</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">67%</p>
                          <p className="text-[10px] text-muted-foreground">Storage</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" data-testid="button-preview-primary">Primary</Button>
                        <Button size="sm" variant="outline" data-testid="button-preview-outline">Outline</Button>
                        <Button size="sm" variant="secondary" data-testid="button-preview-secondary">Secondary</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="telegram" className="mt-5">
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <SiTelegram className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Telegram Notifications</h3>
              </div>
              <div className="p-5">
                <Form {...telegramForm}>
                  <form onSubmit={telegramForm.handleSubmit(onTelegramSubmit)} className="space-y-5">
                    <div className="border border-border/40 rounded-lg p-4 bg-muted/20 space-y-2">
                      <div className="flex gap-2.5">
                        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground mb-2">How to set up Telegram Bot:</p>
                          <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Message <span className="text-primary font-medium">@BotFather</span> on Telegram</li>
                            <li>Send <span className="text-primary font-medium">/newbot</span> and follow the prompts</li>
                            <li>Copy the bot token provided</li>
                            <li>Add your bot to a chat/group and get the chat ID</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={telegramForm.control}
                      name="botToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Bot Token</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showTelegramToken ? "text" : "password"}
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                className="pr-10"
                                data-testid="input-telegram-token"
                              />
                              <button
                                type="button"
                                onClick={() => setShowTelegramToken(!showTelegramToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                data-testid="button-toggle-token"
                              >
                                {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">Token from @BotFather</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={telegramForm.control}
                      name="chatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Chat ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="-1001234567890"
                              data-testid="input-telegram-chatid"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Your chat or group ID (can be negative)</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-muted-foreground mb-2">Notification Events</p>
                      {[
                        { name: "notifyOnStart" as const, label: "Stream Started", desc: "When broadcast begins" },
                        { name: "notifyOnStop" as const, label: "Stream Stopped", desc: "When broadcast ends" },
                        { name: "notifyOnError" as const, label: "Stream Errors", desc: "When errors occur" },
                      ].map(({ name, label, desc }) => (
                        <FormField
                          key={name}
                          control={telegramForm.control}
                          name={name}
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-muted/10">
                              <div>
                                <FormLabel className="text-sm text-foreground">{label}</FormLabel>
                                <FormDescription className="text-xs">{desc}</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid={`switch-telegram-${name.replace("notifyOn", "").toLowerCase()}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}

                      <FormField
                        control={telegramForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-green-500/20 p-3 bg-green-500/5">
                            <div>
                              <FormLabel className="text-sm text-foreground">Enable Telegram Alerts</FormLabel>
                              <FormDescription className="text-xs">Master switch for all Telegram notifications</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-telegram-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" disabled={updateTelegramMutation.isPending} data-testid="button-save-telegram">
                        {updateTelegramMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={testingTelegram || !telegramForm.getValues("botToken") || !telegramForm.getValues("chatId")}
                        onClick={handleTestTelegram}
                        data-testid="button-test-telegram"
                      >
                        <Send className="w-3.5 h-3.5 mr-2" />
                        {testingTelegram ? "Testing..." : "Send Test Message"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-5">
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Email Notifications</h3>
              </div>
              <div className="p-5">
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                    <div className="border border-border/40 rounded-lg p-4 bg-muted/20">
                      <div className="flex gap-2.5">
                        <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground mb-2">How to get Gmail App Password:</p>
                          <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary underline">myaccount.google.com/apppasswords</a></li>
                            <li>Select "Mail" and "Windows Device"</li>
                            <li>Copy the 16-character password</li>
                            <li>Paste it below</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={emailForm.control}
                      name="gmailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Gmail Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@gmail.com"
                              data-testid="input-gmail-address"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Your Gmail address for sending alerts</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="gmailAppPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Gmail App Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="16-character app password"
                              data-testid="input-gmail-password"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">The 16-character password from Google Account</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2 pt-1">
                      <FormField
                        control={emailForm.control}
                        name="notifyOnError"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-border/40 p-3 bg-muted/10">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-email-error"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="text-sm">Notify on errors</FormLabel>
                              <FormDescription className="text-xs">Receive alerts when stream errors occur</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-green-500/20 p-3 bg-green-500/5">
                            <div>
                              <FormLabel className="text-sm text-foreground">Enable Email Alerts</FormLabel>
                              <FormDescription className="text-xs">Master switch for all email notifications</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-email-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" disabled={updateEmailMutation.isPending} data-testid="button-save-email">
                        {updateEmailMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={testingEmail || !emailForm.getValues("gmailAddress")}
                        onClick={handleTestEmail}
                        data-testid="button-test-email"
                      >
                        <Send className="w-3.5 h-3.5 mr-2" />
                        {testingEmail ? "Testing..." : "Test Connection"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
