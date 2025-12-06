import type { TelegramSettings } from "@shared/schema";
import { storage } from "./storage";

class TelegramService {
  private async sendMessage(settings: TelegramSettings, message: string): Promise<boolean> {
    try {
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
        console.error("Telegram API error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
      return false;
    }
  }

  async notifyStreamStart(endpointNames: string[]): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyOnStart) return;

    const message = `<b>STREAM STARTED</b>

<code>Endpoints:</code> ${endpointNames.join(", ")}
<code>Time:</code> ${new Date().toLocaleString()}

Status: LIVE`;

    await this.sendMessage(settings, message);
  }

  async notifyStreamStop(): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyOnStop) return;

    const message = `<b>STREAM STOPPED</b>

<code>Time:</code> ${new Date().toLocaleString()}

Status: OFFLINE`;

    await this.sendMessage(settings, message);
  }

  async notifyStreamError(endpointName: string, errorMessage: string): Promise<void> {
    const settings = await storage.getTelegramSettings();
    if (!settings?.enabled || !settings.notifyOnError) return;

    const message = `<b>STREAM ERROR</b>

<code>Endpoint:</code> ${endpointName}
<code>Error:</code> ${errorMessage}
<code>Time:</code> ${new Date().toLocaleString()}

Status: ERROR`;

    await this.sendMessage(settings, message);
  }

  async testConnection(settings: TelegramSettings): Promise<boolean> {
    const message = `<b>EndlessCast Test</b>

Connection successful!
Your Telegram notifications are now configured.`;

    return this.sendMessage(settings, message);
  }
}

export const telegramService = new TelegramService();
