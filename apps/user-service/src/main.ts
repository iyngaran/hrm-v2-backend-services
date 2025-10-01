import { USER_V1_PACKAGE_NAME } from '@app/libs';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { Logger, PinoLogger } from 'nestjs-pino';
import { join } from 'node:path';
import { UserServiceModule } from './user-service.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(UserServiceModule, {
    bufferLogs: true, // Ensures logs are not lost early in lifecycle
  });
  const config = app.get(ConfigService);

  const grpcUrl =
    config.get<string>('GRPC_USER_SERVICE_URL') ?? 'localhost:50051';

  // Determine the correct proto path based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const protoPath = isProduction
    ? join(__dirname, '../../../proto/user-service/users/user.proto')
    : join(process.cwd(), 'proto/user-service/users/user.proto');

  // Set the proto root directory for import resolution
  const protoRoot = isProduction
    ? join(__dirname, '../../../proto')
    : join(process.cwd(), 'proto');

  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      package: USER_V1_PACKAGE_NAME as string,
      protoPath,
      loader: {
        includeDirs: [protoRoot],
      },
      url: grpcUrl,
    },
  };

  app.connectMicroservice<MicroserviceOptions>(microserviceOptions);
  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();

  // Show the service is running on the specified gRPC URL
  const pinoLogger = await app.resolve(PinoLogger);
  pinoLogger.setContext('User Service');
  pinoLogger.info('='.repeat(40));
  pinoLogger.info(`🚀 Running on port ${grpcUrl}`);
  pinoLogger.info('='.repeat(40));
}
void bootstrap();
