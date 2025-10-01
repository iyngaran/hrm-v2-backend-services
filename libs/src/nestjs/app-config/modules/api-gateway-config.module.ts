import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { getPinoConfig } from '../configs/pino';
import { ApiGatewayEnv, apiGatewayEnvSchema } from '../env/api-gateway.env';
import { GenericConfigService } from '../generic-config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.api-gateway.development', '.env.api-gateway', '.env'],
      validate: (env) => apiGatewayEnvSchema.parse(env),
    }),
    LoggerModule.forRootAsync({
      inject: [GenericConfigService],
      useFactory: getPinoConfig,
    }),
    // No TypeORM for API Gateway
  ],
  providers: [
    {
      provide: GenericConfigService,
      useFactory: (
        configService: ConfigService<ApiGatewayEnv, true>,
      ): GenericConfigService<ApiGatewayEnv> =>
        new GenericConfigService<ApiGatewayEnv>(configService),
      inject: [ConfigService],
    },
  ],
  exports: [GenericConfigService],
})
export class ApiGatewayConfigModule {}
