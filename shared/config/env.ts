import { z } from "zod";

// Không load file .env - chỉ dùng environment variables từ system
// Environment variables được inject bởi:
// - Kubernetes ConfigMap/Secret
// - Docker environment
// - Shell: export VAR=value hoặc source .env

const envSchema = z.object({
    app: z.object({
        port: z.coerce.number().default(3000),
        env: z.enum(["development", "production", "staging","test"]).default("development"),
        host: z.string().default("localhost"),
    }),

    grafana: z.object({
        otlpEndpoint: z.string().default("http://localhost:3100/otlp"),
        serviceName: z.string().default("gau-email-service"),
        group: z.string().default("green-mindmap"),
    }),

    email: z.object({
        smtpHost: z.string().default("smtp.gmail.com"),
        smtpPort: z.coerce.number().default(587),
        smtpSecure: z.coerce.boolean().default(false),
        smtpUser: z.string().default(""),
        smtpPassword: z.string().default(""),
        fromEmail: z.string().default("noreply@gauas.com"),
        fromName: z.string().default("Gấu Trúc System"),
    }),

    rabbitmq: z.object({
        url: z.string().default("amqp://localhost"),
        queue: z.string().default("email_queue"),
        exchange: z.string().default("email_exchange"),
    }),
});

const parsed = envSchema.safeParse({
    app: {
        port: process.env.APP_PORT,
        env: process.env.APP_ENV,
        host: process.env.APP_HOST,
    },
    grafana: {
        otlpEndpoint: process.env.GRAFANA_OTLP_ENDPOINT,
        serviceName: process.env.GRAFANA_SERVICE_NAME,
        group: process.env.GRAFANA_GROUP,
    },
    email: {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT,
        smtpSecure: process.env.SMTP_SECURE,
        smtpUser: process.env.SMTP_USER,
        smtpPassword: process.env.SMTP_PASSWORD,
        fromEmail: process.env.FROM_EMAIL,
        fromName: process.env.FROM_NAME,
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL,
        queue: process.env.RABBITMQ_QUEUE,
        exchange: process.env.RABBITMQ_EXCHANGE,
    },
});

if (!parsed.success) {
    console.error("❌ Environment variable validation error:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = parsed.data;
