import * as amqp from 'amqplib';
import { EmailMessage, EmailType } from '../shared/types/email.types';
import { SendEmailService } from './handler/send-email.service';
import { LoggerClient } from '../shared/infra/logger';
import { config } from '../shared/config/env';

export class SendEmailConsumer {
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private isRunning: boolean = false;
  private readonly emailService: SendEmailService;
  private readonly logger: LoggerClient;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAY = 5000;
  private readonly MAX_RETRIES = 3;

  constructor(emailService: SendEmailService, logger: LoggerClient) {
    this.emailService = emailService;
    this.logger = logger;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Email consumer already running');
      return;
    }

    this.logger.info('Starting email consumer', {
      url: config.rabbitmq.url,
      queue: config.rabbitmq.queue,
      exchange: config.rabbitmq.exchange
    });

    try {
      await this.connect();
      await this.setupQueue();
      await this.startConsuming();

      this.isRunning = true;
      this.reconnectAttempts = 0;

      this.logger.info('Email consumer started successfully');
    } catch (error) {
      this.logger.error('Failed to start consumer', error as Error);
      await this.handleReconnect();
    }
  }

  private async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ...');

      const connection = (await amqp.connect(config.rabbitmq.url)) as any;
      this.connection = connection;
      this.channel = await connection.createChannel();

      this.logger.info('Connected to RabbitMQ');

      this.setupConnectionHandlers(connection);
    } catch (error) {
      this.logger.error('RabbitMQ connection failed', error as Error);
      throw error;
    }
  }

  private setupConnectionHandlers(connection: any): void {
    connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
      this.isRunning = false;
      this.handleReconnect();
    });

    connection.on('error', (error: Error) => {
      this.logger.error('RabbitMQ connection error', error);
    });
  }

  private async setupQueue(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    this.logger.info('Setting up queue and exchange');

    await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });

    await this.channel.assertQueue(config.rabbitmq.queue, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000,
        'x-max-length': 10000
      }
    });

    await this.channel.bindQueue(config.rabbitmq.queue, config.rabbitmq.exchange, 'email.*');
    await this.channel.prefetch(1);

    this.logger.info('Queue setup completed');
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    this.logger.info('Starting message consumption');

    await this.channel.consume(
      config.rabbitmq.queue,
      (msg) => msg && this.handleMessage(msg),
      { noAck: false }
    );

    this.logger.info('Consumer registered');
  }

  private async handleMessage(msg: amqp.Message): Promise<void> {
    const startTime = Date.now();
    const messageId = msg.properties.messageId || 'unknown';

    this.logger.info('Received message', {
      messageId,
      routingKey: msg.fields.routingKey
    });

    try {
      const emailMessage = this.parseMessage(msg.content.toString());

      this.logger.info('Message parsed', {
        messageId,
        type: emailMessage.type,
        recipient: emailMessage.recipient
      });

      const result = await this.emailService.sendEmail(emailMessage);

      if (result.success) {
        this.channel?.ack(msg);
        this.logger.info('Message processed', {
          messageId,
          emailMessageId: result.messageId,
          duration: `${Date.now() - startTime}ms`
        });
      } else {
        await this.handleFailedMessage(msg, result.error || 'Unknown error');
      }
    } catch (error) {
      this.logger.error('Message handling failed', error as Error, { messageId });
      await this.handleFailedMessage(msg, (error as Error).message);
    }
  }

  private parseMessage(content: string): EmailMessage {
    const parsed = JSON.parse(content);

    if (!parsed.recipient || typeof parsed.recipient !== 'string') {
      throw new Error('Invalid recipient');
    }

    if (!parsed.content || typeof parsed.content !== 'string') {
      throw new Error('Invalid content');
    }

    if (!parsed.type || typeof parsed.type !== 'string') {
      throw new Error('Invalid type');
    }

    return {
      type: this.mapEmailType(parsed.type),
      content: parsed.content,
      recipient: parsed.recipient,
      recipientName: parsed.recipientName || parsed.recipient.split('@')[0]
    };
  }

  private mapEmailType(type: string): EmailType {
    const lowerType = type.toLowerCase().trim();

    const typeMap: Record<string, EmailType> = {
      // Vietnamese
      'thông báo': EmailType.NOTIFICATION,
      'xác nhận': EmailType.CONFIRMATION,
      'cảnh báo': EmailType.WARNING,
      // English
      'notification': EmailType.NOTIFICATION,
      'confirmation': EmailType.CONFIRMATION,
      'warning': EmailType.WARNING,
      // Alternative
      'info': EmailType.NOTIFICATION,
      'success': EmailType.CONFIRMATION,
      'alert': EmailType.WARNING,
      'danger': EmailType.WARNING
    };

    if (typeMap[lowerType]) {
      return typeMap[lowerType];
    }

    this.logger.warn('Unknown email type, using NOTIFICATION', { type });
    return EmailType.NOTIFICATION;
  }

  private async handleFailedMessage(msg: amqp.Message, error: string): Promise<void> {
    const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) as number;

    this.logger.warn('Message failed', {
      messageId: msg.properties.messageId,
      error,
      retryCount
    });

    if (retryCount < this.MAX_RETRIES) {
      this.channel?.nack(msg, false, true);
      this.logger.info('Message requeued', { retry: retryCount + 1 });
    } else {
      this.channel?.nack(msg, false, false);
      this.logger.error('Message rejected after max retries', undefined, { retryCount });
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('Max reconnect attempts reached', undefined, {
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;

    this.logger.info('Reconnecting...', {
      attempt: this.reconnectAttempts,
      delay: `${this.RECONNECT_DELAY}ms`
    });

    setTimeout(() => this.start().catch((err) =>
      this.logger.error('Reconnect failed', err)
    ), this.RECONNECT_DELAY);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Consumer not running');
      return;
    }

    this.logger.info('Stopping consumer');

    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        this.connection.removeAllListeners();
        await (this.connection as any).close();
        this.connection = null;
      }

      this.isRunning = false;
      this.logger.info('Consumer stopped');
    } catch (error) {
      this.logger.error('Error stopping consumer', error as Error);
      throw error;
    }
  }

  getStatus(): { isRunning: boolean; reconnectAttempts: number } {
    return {
      isRunning: this.isRunning,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
