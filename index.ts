import { startConsumer } from './consumer';
import { logger } from './shared/infra/logger';

async function main() {
  logger.info('🐼 Starting Gau Email Service...');

  try {
    const consumer = await startConsumer();

    logger.info('Email service is running and listening for messages');

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await consumer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await consumer.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start email service', error as Error);
    process.exit(1);
  }
}

main();
