import { SendEmailConsumer } from './send-email.consumer';
import { SendEmailService } from './handler/send-email.service';
import { initInfrastructure } from '../shared/infra';

export async function startConsumer(): Promise<SendEmailConsumer> {
  const infra = await initInfrastructure();

  infra.logger.info('Infrastructure initialized successfully');

  const emailService = new SendEmailService(infra.emailServer, infra.logger);

  infra.logger.info('Send email service created');

  const consumer = new SendEmailConsumer(emailService, infra.logger);
  await consumer.start();

  return consumer;
}

export { SendEmailConsumer } from './send-email.consumer';
