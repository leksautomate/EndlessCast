import type { TelegramSettings } from "@shared/schema";
import { storage } from "./storage";

class TelegramService {
  private async sendMessage(settings: TelegramSettings, message: string): Promise<void> {
    const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const description = error?.description || "Unknown Telegram API error";
      console.error("Telegram API error:", error);
      throw new Error(description);
    }
  }

  async notifyStreamStart(endpointNames: string[]): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyOnStart) return;

    const message = `<b>STREAM STARTED</b>

<code>Endpoints:</code> ${endpointNames.join(", ")}
<code>Time:</code> ${new Date().toLocaleString()}

Status: LIVE`;

    try { await this.sendMessage(settings, message); } catch (e) { console.error("Telegram notify error:", e); }
  }

  async notifyStreamStop(): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyOnStop) return;

    const message = `<b>STREAM STOPPED</b>

<code>Time:</code> ${new Date().toLocaleString()}

Status: OFFLINE`;

    try { await this.sendMessage(settings, message); } catch (e) { console.error("Telegram notify error:", e); }
  }

  async notifyStreamError(endpointName: string, errorMessage: string): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyOnError) return;

    const message = `<b>STREAM ERROR</b>

<code>Endpoint:</code> ${endpointName}
<code>Error:</code> ${errorMessage}
<code>Time:</code> ${new Date().toLocaleString()}

Status: ERROR`;

    try { await this.sendMessage(settings, message); } catch (e) { console.error("Telegram notify error:", e); }
  }

  async testConnection(settings: TelegramSettings): Promise<void> {
    const message = `<b>EndlessCast Test</b>

Connection successful!
Your Telegram notifications are now configured.`;

    await this.sendMessage(settings, message);
  }

  async notifyServerCrash(errorType: string, errorMessage: string): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyOnError) return;

    const message = `<b>SERVER CRASH</b>

<code>Type:</code> ${errorType}
<code>Error:</code> ${errorMessage.substring(0, 500)}
<code>Time:</code> ${new Date().toLocaleString()}

Status: CRITICAL - Server is restarting...`;

    try { await this.sendMessage(settings, message); } catch (e) { console.error("Telegram notify error:", e); }
  }

  async notifyServerStart(): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled) return;

    const message = `<b>SERVER STARTED</b>

<code>Time:</code> ${new Date().toLocaleString()}

Status: ONLINE - EndlessCast is ready`;

    try { await this.sendMessage(settings, message); } catch (e) { console.error("Telegram notify error:", e); }
  }
}

export const telegramService = new TelegramService();
