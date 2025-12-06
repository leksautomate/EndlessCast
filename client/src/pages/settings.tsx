import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft, 
  Palette, 
  Send,
  Terminal,
  Wifi,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { 
  insertEmailSettingsSchema, 
  insertTelegramSettingsSchema,
  type InsertEmailSettings, 
  type InsertTelegramSettings,
  type ThemeColor
} from "@shared/schema";

interface SettingsProps {
  onLogout?: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
    if (emailSettings) {
      emailForm.reset(emailSettings);
    }
  }, [emailSettings]);

  useEffect(() => {
    if (telegramSettings) {
      telegramForm.reset(telegramSettings);
    }
  }, [telegramSettings]);

  const updateEmailMutation = useMutation({
    mutationFn: async (data: InsertEmailSettings) => {
      const res = await apiRequest("POST", "/api/email-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({
        title: "Settings Saved",
        description: "Email configuration updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
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
      toast({
        title: "Settings Saved",
        description: "Telegram configuration updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onEmailSubmit = async (data: InsertEmailSettings) => {
    updateEmailMutation.mutate(data);
  };

  const onTelegramSubmit = async (data: InsertTelegramSettings) => {
    updateTelegramMutation.mutate(data);
  };

  const handleTestEmail = async () => {
    const formValues = emailForm.getValues();
    if (!formValues.gmailAddress || !formValues.gmailAppPassword) {
      toast({
        title: "Missing Information",
        description: "Enter Gmail address and app password first",
        variant: "destructive",
      });
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
      toast({
        title: "Connection Successful",
        description: "Gmail SMTP verified.",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to Gmail",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestTelegram = async () => {
    const formValues = telegramForm.getValues();
    if (!formValues.botToken || !formValues.chatId) {
      toast({
        title: "Missing Information",
        description: "Enter bot token and chat ID first",
        variant: "destructive",
      });
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
      toast({
        title: "Connection Successful",
        description: "Telegram bot verified. Check your chat for a test message.",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to Telegram",
        variant: "destructive",
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/app")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-primary/50 flex items-center justify-center bg-primary/10">
              <Wifi className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary glow-sm" data-testid="heading-settings">
                System Settings
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                <span className="text-primary">&gt;</span> Configure EndlessCast
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-primary/20">
            <TabsTrigger value="theme" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Palette className="w-4 h-4 mr-2" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="telegram" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <SiTelegram className="w-4 h-4 mr-2" />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="space-y-4 mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Palette className="w-5 h-5 text-primary" />
                  Color Theme
                </CardTitle>
                <CardDescription>
                  Choose your preferred interface color scheme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(themePresets) as ThemeColor[]).filter(t => t !== 'custom').map((themeKey) => (
                    <button
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      className={`p-4 rounded border transition-all ${
                        theme === themeKey 
                          ? 'border-primary bg-primary/10 box-glow-sm' 
                          : 'border-primary/20 hover:border-primary/40'
                      }`}
                      data-testid={`button-theme-${themeKey}`}
                    >
                      <div 
                        className="w-8 h-8 rounded-full mx-auto mb-2 border-2"
                        style={{ 
                          backgroundColor: themePresets[themeKey].primary,
                          borderColor: themePresets[themeKey].accent 
                        }}
                      />
                      <p className="text-sm text-center font-mono">
                        {themePresets[themeKey].name}
                      </p>
                      {theme === themeKey && (
                        <CheckCircle className="w-4 h-4 text-primary mx-auto mt-2" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-primary/10">
                  <h3 className="text-sm font-semibold mb-4 text-foreground">Preview</h3>
                  <div className="bg-card/50 border border-primary/20 rounded p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-mono text-primary">Primary Color</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">Primary Button</Button>
                      <Button size="sm" variant="outline">Outline</Button>
                      <Button size="sm" variant="ghost">Ghost</Button>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      <span className="text-primary">&gt;</span> Terminal style text preview
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-4 mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <SiTelegram className="w-5 h-5 text-primary" />
                  Telegram Notifications
                </CardTitle>
                <CardDescription>
                  Receive alerts when your streams start, stop, or encounter errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...telegramForm}>
                  <form onSubmit={telegramForm.handleSubmit(onTelegramSubmit)} className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                      <div className="flex gap-2">
                        <Terminal className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground">How to set up Telegram Bot:</p>
                          <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Message <span className="text-primary font-mono">@BotFather</span> on Telegram</li>
                            <li>Send <span className="text-primary font-mono">/newbot</span> and follow the prompts</li>
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
                          <FormLabel>Bot Token</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showTelegramToken ? "text" : "password"}
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                className="bg-background/50 border-primary/30 focus:border-primary pr-10"
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
                          <FormDescription>Token from @BotFather</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={telegramForm.control}
                      name="chatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="-1001234567890"
                              className="bg-background/50 border-primary/30 focus:border-primary"
                              data-testid="input-telegram-chatid"
                            />
                          </FormControl>
                          <FormDescription>Your chat or group ID (can be negative)</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-semibold text-foreground">Notification Types</h4>
                      
                      <FormField
                        control={telegramForm.control}
                        name="notifyOnStart"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-primary/20 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Stream Started</FormLabel>
                              <FormDescription>Get notified when broadcast begins</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-telegram-start"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={telegramForm.control}
                        name="notifyOnStop"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-primary/20 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Stream Stopped</FormLabel>
                              <FormDescription>Get notified when broadcast ends</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-telegram-stop"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={telegramForm.control}
                        name="notifyOnError"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-primary/20 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Stream Errors</FormLabel>
                              <FormDescription>Get notified when errors occur</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-telegram-error"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={telegramForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Telegram Alerts</FormLabel>
                              <FormDescription>Master switch for all Telegram notifications</FormDescription>
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

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={updateTelegramMutation.isPending}
                        data-testid="button-save-telegram"
                      >
                        {updateTelegramMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={testingTelegram || !telegramForm.getValues("botToken") || !telegramForm.getValues("chatId")}
                        onClick={handleTestTelegram}
                        data-testid="button-test-telegram"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {testingTelegram ? "Testing..." : "Send Test Message"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Mail className="w-5 h-5 text-primary" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Set up Gmail to receive error notifications when your streams fail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground">How to get Gmail App Password:</p>
                          <ol className="list-decimal list-inside mt-2 space-y-1">
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
                          <FormLabel>Gmail Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@gmail.com"
                              className="bg-background/50 border-primary/30 focus:border-primary"
                              data-testid="input-gmail-address"
                            />
                          </FormControl>
                          <FormDescription>Your Gmail address for sending alerts</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="gmailAppPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gmail App Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="16-character app password"
                              className="bg-background/50 border-primary/30 focus:border-primary"
                              data-testid="input-gmail-password"
                            />
                          </FormControl>
                          <FormDescription>The 16-character password from Google Account</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="notifyOnError"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-notify-errors"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">Notify on Stream Errors</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-enable-email"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">Enable Email Notifications</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={updateEmailMutation.isPending}
                        data-testid="button-save-settings"
                      >
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
