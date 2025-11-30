import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { insertEmailSettingsSchema, type InsertEmailSettings } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [testingConnection, setTestingConnection] = useState(false);

  // Fetch email settings
  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ["/api/email-settings"],
    queryFn: async () => {
      const res = await fetch("/api/email-settings");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const form = useForm<InsertEmailSettings>({
    resolver: zodResolver(insertEmailSettingsSchema),
    defaultValues: {
      enabled: emailSettings?.enabled ?? false,
      gmailAddress: emailSettings?.gmailAddress ?? "",
      gmailAppPassword: emailSettings?.gmailAppPassword ?? "",
      notifyOnError: emailSettings?.notifyOnError ?? true,
    },
  });

  // Update email settings mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (data: InsertEmailSettings) => {
      const res = await apiRequest("POST", "/api/email-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({
        title: "Success",
        description: "Email settings updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertEmailSettings) => {
    updateEmailMutation.mutate(data);
  };

  const handleTestConnection = async () => {
    const formValues = form.getValues();
    if (!formValues.gmailAddress || !formValues.gmailAppPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter Gmail address and app password",
        variant: "destructive",
      });
      return;
    }
    setTestingConnection(true);
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
        title: "Success",
        description: "Gmail connection successful!",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Gmail",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-settings">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure your EndlessCast preferences</p>
          </div>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="email">Email Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Gmail Configuration
                </CardTitle>
                <CardDescription>
                  Set up Gmail to receive error notifications when your streams fail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                          <p className="font-semibold">How to get Gmail App Password:</p>
                          <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-medium">myaccount.google.com/apppasswords</a></li>
                            <li>Select "Mail" and "Windows Device"</li>
                            <li>Copy the 16-character password</li>
                            <li>Paste it below</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="gmailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gmail Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@gmail.com"
                              data-testid="input-gmail-address"
                            />
                          </FormControl>
                          <FormDescription>Your Gmail address for sending alerts</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gmailAppPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gmail App Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="16-character app password"
                              data-testid="input-gmail-password"
                            />
                          </FormControl>
                          <FormDescription>The 16-character password from Google Account</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                        disabled={testingConnection || !form.getValues("gmailAddress") || !form.getValues("gmailAppPassword")}
                        onClick={handleTestConnection}
                        data-testid="button-test-connection"
                      >
                        {testingConnection ? "Testing..." : "Test Connection"}
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
