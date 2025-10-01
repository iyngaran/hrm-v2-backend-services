import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { GenericConfigService } from '../generic-config.service';

/**
 * Generic TypeORM config service that can work with any service
 */
@Injectable()
export class GenericTypeOrmConfigService<T extends Record<string, unknown>>
  implements TypeOrmOptionsFactory
{
  private readonly options: TypeOrmModuleOptions;

  constructor(
    private readonly configService: GenericConfigService<T>,
    private readonly servicePrefix: string,
  ) {
    this.options = {
      type: 'postgres',
      host: this.configService.get(
        `${servicePrefix}_DB_HOST` as keyof T,
      ) as string,
      port: parseInt(
        this.configService.get(`${servicePrefix}_DB_PORT` as keyof T) as string,
        10,
      ),
      username: this.configService.get(
        `${servicePrefix}_DB_USER` as keyof T,
      ) as string,
      password: this.configService.get(
        `${servicePrefix}_DB_PASSWORD` as keyof T,
      ) as string,
      database: this.configService.get(
        `${servicePrefix}_DB_NAME` as keyof T,
      ) as string,
      autoLoadEntities: true,
      synchronize: this.configService.get(
        `${servicePrefix}_DB_SYNCHRONIZE` as keyof T,
      ) as boolean,
      logging: this.configService.get(
        `${servicePrefix}_DB_LOGGING` as keyof T,
      ) as boolean,
    };
  }

  createTypeOrmOptions(): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    if (process.env.NODE_ENV === 'test') {
      return this.options;
    }
    if (process.env.NODE_ENV === 'development') {
      return this.options;
    }
    if (process.env.NODE_ENV === 'production') {
      return { ...this.options, synchronize: false };
    }
    return this.options;
  }
}
