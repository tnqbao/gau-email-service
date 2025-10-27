import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { LoggerClient } from './logger';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailServer {
  private readonly transporter: Transporter;
  private readonly logger: LoggerClient;
  private isConnected: boolean = false;

  constructor(logger: LoggerClient) {
    this.logger = logger;
    this.transporter = this.createTransporter();
  }

  private createTransporter(): Transporter {
    const isDevelopment = config.app.env === 'development' && !config.email.smtpUser;

    this.logger.info('Initializing SMTP transporter', {
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      mode: isDevelopment ? 'development' : 'production'
    });

    return nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpSecure,
      auth: config.email.smtpUser ? {
        user: config.email.smtpUser,
        pass: config.email.smtpPassword,
      } : undefined,
      ...(isDevelopment && {
        streamTransport: true,
        newline: 'unix',
        buffer: true
      })
    });
  }

  async connect(): Promise<void> {
    const isDevelopment = config.app.env === 'development' && !config.email.smtpUser;

    if (isDevelopment) {
      this.logger.info('Development mode: Using stream transport');
      this.isConnected = true;
      return;
    }

    try {
      this.logger.info('Verifying SMTP connection...');
      await this.transporter.verify();
      this.isConnected = true;
      this.logger.info('SMTP connection verified successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to verify SMTP connection', error as Error);
      throw error;
    }
  }

  async sendMail(options: SendMailOptions): Promise<{ messageId: string }> {
    if (!this.isConnected) {
      throw new Error('Email server is not connected');
    }

    const startTime = Date.now();

    try {
      const info = await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      });

      this.logger.info('Email sent successfully', {
        to: options.to,
        messageId: info.messageId,
        duration: `${Date.now() - startTime}ms`
      });

      return { messageId: info.messageId };
    } catch (error) {
      this.logger.error('Failed to send email', error as Error, {
        to: options.to,
        duration: `${Date.now() - startTime}ms`
      });
      throw error;
    }
  }

  disconnect(): void {
    if (this.transporter) {
      this.transporter.close();
      this.isConnected = false;
      this.logger.info('SMTP connection closed');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let emailServerInstance: EmailServer | null = null;

export function getEmailServer(logger: LoggerClient): EmailServer {
  if (!emailServerInstance) {
    emailServerInstance = new EmailServer(logger);
  }
  return emailServerInstance;
}

export async function initEmailServer(logger: LoggerClient): Promise<EmailServer> {
  const server = getEmailServer(logger);
  await server.connect();
  return server;
}
