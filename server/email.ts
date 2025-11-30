import nodemailer from "nodemailer";
import type { EmailSettings } from "@shared/schema";

class EmailService {
  async sendErrorAlert(
    settings: EmailSettings,
    endpointName: string,
    errorMessage: string,
    restartAttempt: number
  ): Promise<boolean> {
    if (!settings.enabled || !settings.notifyOnError) {
      return false;
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: settings.gmailAddress,
          pass: settings.gmailAppPassword,
        },
      });

      const subject = `EndlessCast Stream Error: ${endpointName}`;
      const html = `
        <h2>Stream Error Alert</h2>
        <p><strong>Platform:</strong> ${endpointName}</p>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p><strong>Restart Attempt:</strong> ${restartAttempt} of 3</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr/>
        <p>EndlessCast is automatically attempting to restart the stream.</p>
      `;

      await transporter.sendMail({
        from: settings.gmailAddress,
        to: settings.gmailAddress,
        subject,
        html,
      });

      console.log(`Email sent for ${endpointName} error`);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendStreamStartedAlert(
    settings: EmailSettings,
    videoName: string,
    platformsCount: number
  ): Promise<boolean> {
    if (!settings.enabled) {
      return false;
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: settings.gmailAddress,
          pass: settings.gmailAppPassword,
        },
      });

      const subject = `EndlessCast Stream Started`;
      const html = `
        <h2>Stream Started</h2>
        <p><strong>Video:</strong> ${videoName}</p>
        <p><strong>Streaming to:</strong> ${platformsCount} platform(s)</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr/>
        <p>Your 24/7 stream is now live!</p>
      `;

      await transporter.sendMail({
        from: settings.gmailAddress,
        to: settings.gmailAddress,
        subject,
        html,
      });

      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async testConnection(settings: EmailSettings): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: settings.gmailAddress,
          pass: settings.gmailAppPassword,
        },
      });

      await transporter.verify();
      return true;
    } catch (error) {
      console.error("Gmail connection failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
