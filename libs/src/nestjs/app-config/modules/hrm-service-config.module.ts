import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { GenericTypeOrmConfigService } from '../configs/generic-typeorm.config';
import { getPinoConfig } from '../configs/pino';
import { HrmServiceEnv, hrmServiceEnvSchema } from '../env/hrm-service.env';
import { GenericConfigService } from '../generic-config.service';

// Specific TypeORM config for HRM Service
@Injectable()
export class HrmServiceTypeOrmConfigService extends GenericTypeOrmConfigService<HrmServiceEnv> {
  constructor(configService: GenericConfigService<HrmServiceEnv>) {
    super(configService, 'HRM_SERVICE');
  }
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.hrm-service.development', '.env.hrm-service', '.env'],
      validate: (env) => hrmServiceEnvSchema.parse(env),
    }),
    LoggerModule.forRootAsync({
      inject: [GenericConfigService],
      useFactory: getPinoConfig,
    }),
    TypeOrmModule.forRootAsync({
      useClass: HrmServiceTypeOrmConfigService,
    }),
  ],
  providers: [
    {
      provide: GenericConfigService,
      useFactory: (
        configService: ConfigService<HrmServiceEnv, true>,
      ): GenericConfigService<HrmServiceEnv> =>
        new GenericConfigService<HrmServiceEnv>(configService),
      inject: [ConfigService],
    },
    HrmServiceTypeOrmConfigService,
  ],
  exports: [GenericConfigService],
})
export class HrmServiceConfigModule {}
