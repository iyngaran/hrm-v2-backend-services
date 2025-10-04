import { NestFactory } from '@nestjs/core';
import { Logger, PinoLogger } from 'nestjs-pino';
import 'source-map-support/register';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Ensures logs are not lost early in lifecycle
  });
  app.useLogger(app.get(Logger));
  await app.listen(process.env.API_GATEWAY_PORT ?? 3000);

  // Show the service is running on the specified port
  const pinoLogger = await app.resolve(PinoLogger);
  pinoLogger.setContext('API Gateway Service');
  pinoLogger.info('='.repeat(40));
  pinoLogger.info(`🚀 Running on port ${process.env.API_GATEWAY_PORT ?? 3000}`);
  pinoLogger.info('='.repeat(40));
}
void bootstrap();
