import { EmailMessage, EmailResult, EmailType } from '../../shared/types/email.types';
import { EmailServer } from '../../shared/infra/mail_server';
import { LoggerClient } from '../../shared/infra/logger';
import { EmailTemplateService } from '../../shared/templates/email.template';

export class SendEmailService {
  private readonly emailServer: EmailServer;
  private readonly logger: LoggerClient;
  private readonly templateService: EmailTemplateService;
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(emailServer: EmailServer, logger: LoggerClient) {
    this.emailServer = emailServer;
    this.logger = logger;
    this.templateService = new EmailTemplateService();
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    const startTime = Date.now();

    this.logger.info('Processing email message', {
      type: message.type,
      recipient: message.recipient,
      contentLength: message.content.length
    });

    try {
      this.validateEmailMessage(message);

      const { html, text, subject } = this.generateEmailContent(message);

      const result = await this.emailServer.sendMail({
        to: message.recipient,
        subject,
        html,
        text
      });

      this.logSuccess(message, result.messageId, Date.now() - startTime);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      this.logError(message, error as Error, Date.now() - startTime);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private validateEmailMessage(message: EmailMessage): void {
    if (!message.recipient || !this.EMAIL_REGEX.test(message.recipient)) {
      throw new Error(`Invalid recipient email: ${message.recipient}`);
    }

    if (!message.content?.trim()) {
      throw new Error('Email content cannot be empty');
    }

    if (!Object.values(EmailType).includes(message.type)) {
      throw new Error(`Invalid email type: ${message.type}`);
    }
  }

  private generateEmailContent(message: EmailMessage) {
    const subject = this.generateSubject(message.type);
    const html = this.templateService.generateEmailHTML({
      type: message.type,
      content: message.content,
      recipientName: message.recipientName,
      actionUrl: message.actionUrl
    });
    const text = this.templateService.generatePlainText({
      type: message.type,
      content: message.content,
      recipientName: message.recipientName
    });

    return { html, text, subject };
  }

  private generateSubject(type: EmailType): string {
    const subjects = {
      [EmailType.NOTIFICATION]: 'Thông báo từ Gauas.lab',
      [EmailType.CONFIRMATION]: 'Xác nhận thành công - Gauas.lab',
      [EmailType.WARNING]: 'Cảnh báo quan trọng - Gauas.lab'
    };

    return subjects[type];
  }

  private logSuccess(message: EmailMessage, messageId: string, duration: number): void {
    this.logger.info('Email sent successfully', {
      type: message.type,
      recipient: message.recipient,
      messageId,
      duration: `${duration}ms`
    });
  }

  private logError(message: EmailMessage, error: Error, duration: number): void {
    this.logger.error('Failed to send email', error, {
      type: message.type,
      recipient: message.recipient,
      duration: `${duration}ms`
    });
  }
}
