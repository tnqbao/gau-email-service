import { EventEmitter } from 'events';
import * as amqp from 'amqplib';

interface EmailJob {
    id: string;
    to: string;
    from: string;
    subject: string;
    body: string;
    html?: string;
    attachments?: any[];
}

export class EmailConsumer extends EventEmitter {
    private isRunning: boolean = false;
    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;
    private readonly queueName: string = 'email_queue';
    private readonly rabbitMQUrl: string;

    constructor(rabbitMQUrl: string = 'amqp://localhost') {
        super();
        this.rabbitMQUrl = rabbitMQUrl;
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('Email consumer is already running');
            return;
        }

        try {
            // Connect to RabbitMQ
            this.connection = await amqp.connect(this.rabbitMQUrl);
            this.channel = await this.connection.createChannel();

            // Ensure queue exists
            await this.channel.assertQueue(this.queueName, { durable: true });

            // Set prefetch to 1 to process one message at a time
            await this.channel.prefetch(1);

            // Start consuming messages
            await this.channel.consume(this.queueName, async (msg) => {
                if (msg) {
                    try {
                        const emailJob: EmailJob = JSON.parse(msg.content.toString());
                        await this.processEmailJob(emailJob);

                        // Acknowledge successful processing
                        this.channel?.ack(msg);
                    } catch (error) {
                        console.error('Error processing email job:', error);

                        // Reject and requeue the message
                        this.channel?.nack(msg, false, true);
                    }
                }
            });

            this.isRunning = true;
            console.log(`Email consumer started, connected to RabbitMQ at ${this.rabbitMQUrl}`);
            this.emit('started');

            // Handle connection close
            this.connection.on('close', () => {
                console.log('RabbitMQ connection closed');
                this.isRunning = false;
                this.emit('disconnected');
            });

            this.connection.on('error', (error) => {
                console.error('RabbitMQ connection error:', error);
                this.emit('error', error);
            });

        } catch (error) {
            console.error('Failed to start email consumer:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            console.log('Email consumer is not running');
            return;
        }

        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }

            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }

            this.isRunning = false;
            console.log('Email consumer stopped');
            this.emit('stopped');
        } catch (error) {
            console.error('Error stopping email consumer:', error);
            throw error;
        }
    }

    async processEmailJob(job: EmailJob): Promise<void> {
        try {
            console.log('Processing email job:', job.id);
            console.log(`Sending email to: ${job.to}, subject: ${job.subject}`);

            // TODO: Implement actual email sending logic here
            // For example, using nodemailer, AWS SES, SendGrid, etc.

            // Simulate email sending delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Email job processed successfully:', job.id);
            this.emit('jobProcessed', job);
        } catch (error) {
            console.error('Error processing email job:', error);
            this.emit('jobFailed', job, error);
            throw error;
        }
    }

    async publishEmailJob(emailJob: EmailJob): Promise<void> {
        if (!this.channel) {
            throw new Error('Consumer not started. Call start() first.');
        }

        try {
            const message = Buffer.from(JSON.stringify(emailJob));
            await this.channel.sendToQueue(this.queueName, message, { persistent: true });
            console.log('Email job published to queue:', emailJob.id);
        } catch (error) {
            console.error('Error publishing email job:', error);
            throw error;
        }
    }

    getStatus(): { isRunning: boolean; queueName: string; rabbitMQUrl: string } {
        return {
            isRunning: this.isRunning,
            queueName: this.queueName,
            rabbitMQUrl: this.rabbitMQUrl
        };
    }
}

export default new EmailConsumer();