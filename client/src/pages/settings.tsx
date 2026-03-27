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
  Terminal,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
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
      <div className="max-w-3xl mx-auto space-y-4">
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-primary/15 h-auto rounded-lg overflow-hidden p-0">
            <TabsTrigger value="theme" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-[10px] sm:text-xs font-mono py-2.5 rounded-none tracking-widest uppercase">
              <Palette className="w-3 h-3 mr-1.5" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="telegram" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-[10px] sm:text-xs font-mono py-2.5 rounded-none tracking-widest uppercase border-x border-primary/10">
              <SiTelegram className="w-3 h-3 mr-1.5" />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-[10px] sm:text-xs font-mono py-2.5 rounded-none tracking-widest uppercase">
              <Mail className="w-3 h-3 mr-1.5" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* ── Theme tab ─────────────────────────────────── */}
          <TabsContent value="theme" className="mt-4">
            <div className="console-pane rounded-lg">
              <div className="p-4 sm:p-5 border-b border-primary/10 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">Color Theme</span>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
              </div>
              <div className="p-4 sm:p-5 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  {(Object.keys(themePresets) as ThemeColor[]).filter(t => t !== "custom").map((themeKey) => (
                    <button
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      className={`p-2 sm:p-4 rounded border transition-all ${
                        theme === themeKey
                          ? "border-primary bg-primary/10"
                          : "border-primary/15 hover:border-primary/30"
                      }`}
                      data-testid={`button-theme-${themeKey}`}
                    >
                      <div
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto mb-1 sm:mb-2"
                        style={{
                          backgroundColor: themePresets[themeKey].primary,
                          boxShadow: theme === themeKey ? `0 0 12px ${themePresets[themeKey].primary}` : "none",
                        }}
                      />
                      <p className="text-[9px] sm:text-[10px] text-center font-mono truncate text-muted-foreground">
                        {themePresets[themeKey].name.split(" ")[0]}
                      </p>
                      {theme === themeKey && (
                        <CheckCircle className="w-3 h-3 text-primary mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-primary/10 hidden sm:block">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">Preview</p>
                  <div className="border border-primary/15 rounded p-4 space-y-3 bg-primary/3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-mono text-primary">Primary Color Active</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm">Primary</Button>
                      <Button size="sm" variant="outline">Outline</Button>
                      <Button size="sm" variant="ghost">Ghost</Button>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground/60">
                      <span className="text-primary">▸</span> Terminal style text preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Telegram tab ──────────────────────────────── */}
          <TabsContent value="telegram" className="mt-4">
            <div className="console-pane rounded-lg">
              <div className="p-4 sm:p-5 border-b border-primary/10 flex items-center gap-2">
                <SiTelegram className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">Telegram Notifications</span>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
              </div>
              <div className="p-4 sm:p-5">
                <Form {...telegramForm}>
                  <form onSubmit={telegramForm.handleSubmit(onTelegramSubmit)} className="space-y-5">
                    <div className="border border-primary/15 rounded-lg p-4 bg-primary/3 space-y-2">
                      <div className="flex gap-2">
                        <Terminal className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground/70 font-mono">
                          <p className="font-bold text-foreground/80 mb-2">How to set up Telegram Bot:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Message <span className="text-primary">@BotFather</span> on Telegram</li>
                            <li>Send <span className="text-primary">/newbot</span> and follow the prompts</li>
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
                          <FormLabel className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">Bot Token</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showTelegramToken ? "text" : "password"}
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                className="bg-background/50 border-primary/25 focus:border-primary pr-10 font-mono text-xs"
                                data-testid="input-telegram-token"
                              />
                              <button
                                type="button"
                                onClick={() => setShowTelegramToken(!showTelegramToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary"
                                data-testid="button-toggle-token"
                              >
                                {showTelegramToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-[10px] text-muted-foreground/50">Token from @BotFather</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={telegramForm.control}
                      name="chatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">Chat ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="-1001234567890"
                              className="bg-background/50 border-primary/25 focus:border-primary font-mono text-xs"
                              data-testid="input-telegram-chatid"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] text-muted-foreground/50">Your chat or group ID (can be negative)</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2 pt-1">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">Notification Events</p>
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
                            <FormItem className="flex items-center justify-between rounded border border-primary/12 p-3 bg-primary/3">
                              <div>
                                <FormLabel className="text-xs font-mono text-foreground/80">{label}</FormLabel>
                                <FormDescription className="text-[10px] text-muted-foreground/50">{desc}</FormDescription>
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
                          <FormItem className="flex items-center justify-between rounded border border-green-500/20 p-3 bg-green-500/5">
                            <div>
                              <FormLabel className="text-xs font-mono text-foreground/80">Enable Telegram Alerts</FormLabel>
                              <FormDescription className="text-[10px] text-muted-foreground/50">Master switch for all Telegram notifications</FormDescription>
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

          {/* ── Email tab ─────────────────────────────────── */}
          <TabsContent value="email" className="mt-4">
            <div className="console-pane rounded-lg">
              <div className="p-4 sm:p-5 border-b border-primary/10 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">Email Notifications</span>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
              </div>
              <div className="p-4 sm:p-5">
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                    <div className="border border-primary/15 rounded-lg p-4 bg-primary/3">
                      <div className="flex gap-2">
                        <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground/70 font-mono">
                          <p className="font-bold text-foreground/80 mb-2">How to get Gmail App Password:</p>
                          <ol className="list-decimal list-inside space-y-1">
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
                          <FormLabel className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">Gmail Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@gmail.com"
                              className="bg-background/50 border-primary/25 focus:border-primary font-mono text-xs"
                              data-testid="input-gmail-address"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] text-muted-foreground/50">Your Gmail address for sending alerts</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="gmailAppPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">Gmail App Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="16-character app password"
                              className="bg-background/50 border-primary/25 focus:border-primary font-mono text-xs"
                              data-testid="input-gmail-password"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] text-muted-foreground/50">The 16-character password from Google Account</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2 pt-1">
                      <FormField
                        control={emailForm.control}
                        name="notifyOnError"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0 rounded border border-primary/12 p-3 bg-primary/3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-notify-errors"
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-mono text-foreground/80 cursor-pointer">Notify on Stream Errors</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0 rounded border border-green-500/20 p-3 bg-green-500/5">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-enable-email"
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-mono text-foreground/80 cursor-pointer">Enable Email Notifications</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" disabled={updateEmailMutation.isPending} data-testid="button-save-settings">
                        {updateEmailMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={testingEmail || !emailForm.getValues("gmailAddress") || !emailForm.getValues("gmailAppPassword")}
                        onClick={handleTestEmail}
                        data-testid="button-test-connection"
                      >
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
