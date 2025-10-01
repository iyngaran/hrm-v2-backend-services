import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { GenericTypeOrmConfigService } from '../configs/generic-typeorm.config';
import { getPinoConfig } from '../configs/pino';
import { UserServiceEnv, userServiceEnvSchema } from '../env/user-service.env';
import { GenericConfigService } from '../generic-config.service';

// Specific TypeORM config for User Service
@Injectable()
export class UserServiceTypeOrmConfigService extends GenericTypeOrmConfigService<UserServiceEnv> {
  constructor(configService: GenericConfigService<UserServiceEnv>) {
    super(configService, 'USER_SERVICE');
  }
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.user-service.development',
        '.env.user-service',
        '.env',
      ],
      validate: (env) => userServiceEnvSchema.parse(env),
    }),
    LoggerModule.forRootAsync({
      inject: [GenericConfigService],
      useFactory: getPinoConfig,
    }),
    TypeOrmModule.forRootAsync({
      useClass: UserServiceTypeOrmConfigService,
    }),
  ],
  providers: [
    {
      provide: GenericConfigService,
      useFactory: (
        configService: ConfigService<UserServiceEnv, true>,
      ): GenericConfigService<UserServiceEnv> =>
        new GenericConfigService<UserServiceEnv>(configService),
      inject: [ConfigService],
    },
    UserServiceTypeOrmConfigService,
  ],
  exports: [GenericConfigService],
})
export class UserServiceConfigModule {}
