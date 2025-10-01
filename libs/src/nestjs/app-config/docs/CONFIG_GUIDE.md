# Microservices Configuration System

This directory contains a flexible configuration system designed for NestJS microservices. Each service can have its own environment schema while sharing common configuration patterns.

## Overview

The configuration system provides:

- **Service-specific environment schemas** - Each service defines only the environment variables it needs
- **Type-safe configuration** - Full TypeScript support with Zod validation
- **Shared common configurations** - Logger, basic app settings shared across services
- **Database configuration** - Optional database setup for services that need it
- **Validation** - Environment variables are validated at startup

## Architecture

```
env/
├── base.env.ts           # Common environment variables (logger, app settings)
├── database.env.ts       # Database environment schema factory
├── user-service.env.ts   # User service specific schema
├── hrm-service.env.ts    # HRM service specific schema
├── api-gateway.env.ts    # API Gateway specific schema (no database)
└── index.ts              # Exports all schemas

modules/
├── user-service-config.module.ts    # Complete config module for user service
├── hrm-service-config.module.ts     # Complete config module for HRM service
├── api-gateway-config.module.ts     # Complete config module for API gateway
└── index.ts                         # Exports all modules

configs/
├── pino.ts                          # Pino logger configuration
├── typeorm.config.ts                # Original TypeORM config (deprecated)
└── generic-typeorm.config.ts        # Generic TypeORM config for any service
```

## Usage

### 1. For User Service

In your user service's main module:

```typescript
import { UserServiceConfigModule } from '@libs/nestjs/app-config/modules';

@Module({
  imports: [
    UserServiceConfigModule, // This includes database config
    // ... other modules
  ],
  // ...
})
export class UserServiceModule {}
```

### 2. For HRM Service

In your HRM service's main module:

```typescript
import { HrmServiceConfigModule } from '@libs/nestjs/app-config/modules';

@Module({
  imports: [
    HrmServiceConfigModule, // This includes database config
    // ... other modules
  ],
  // ...
})
export class HrmServiceModule {}
```

### 3. For API Gateway

In your API gateway's main module:

```typescript
import { ApiGatewayConfigModule } from '@libs/nestjs/app-config/modules';

@Module({
  imports: [
    ApiGatewayConfigModule, // No database config
    // ... other modules
  ],
  // ...
})
export class ApiGatewayModule {}
```

### 4. Using Configuration in Services

Inject the `GenericConfigService` in any service:

```typescript
import { Injectable } from '@nestjs/common';
import { GenericConfigService } from '@libs/nestjs/app-config/generic-config.service';
import { UserServiceEnv } from '@libs/nestjs/app-config/env/user-service.env';

@Injectable()
export class SomeService {
  constructor(private configService: GenericConfigService<UserServiceEnv>) {}

  getDatabaseHost() {
    return this.configService.get('USER_SERVICE_DB_HOST');
  }

  getLogLevel() {
    return this.configService.get('LOGGER_DEFAULT_LEVEL');
  }
}
```

## Environment Variables

### Common Variables (All Services)

```bash
# App Configuration
NODE_ENV=development
GRPC_URL=0.0.0.0:50002

# Logger Configuration
LOGGER_ENABLE=true
LOGGER_CONSOLE_TARGET_ENABLE=true
LOGGER_FILE_TARGET_ENABLE=true
LOGGER_DEFAULT_LEVEL=info
LOGGER_CONSOLE_LEVEL=info
LOGGER_FILE_LEVEL=info
```

### User Service Variables

```bash
# Database Configuration
USER_SERVICE_DB_HOST=localhost
USER_SERVICE_DB_PORT=5432
USER_SERVICE_DB_USER=postgres
USER_SERVICE_DB_PASSWORD=password
USER_SERVICE_DB_NAME=user_service_db
USER_SERVICE_DB_SYNCHRONIZE=false
USER_SERVICE_DB_LOGGING=false
```

### HRM Service Variables

```bash
# Database Configuration
HRM_SERVICE_DB_HOST=localhost
HRM_SERVICE_DB_PORT=5432
HRM_SERVICE_DB_USER=postgres
HRM_SERVICE_DB_PASSWORD=password
HRM_SERVICE_DB_NAME=hrm_service_db
HRM_SERVICE_DB_SYNCHRONIZE=false
HRM_SERVICE_DB_LOGGING=false
```

### API Gateway Variables

API Gateway only needs the common variables (no database configuration).

## Adding a New Service

### 1. Create Environment Schema

Create `env/new-service.env.ts`:

```typescript
import { createDatabaseEnvSchema, DatabaseEnv } from './database.env';

// For services with database
export const newServiceEnvSchema = createDatabaseEnvSchema('NEW_SERVICE');
export type NewServiceEnv = DatabaseEnv<'NEW_SERVICE'>;

// For services without database
import { baseEnvSchema, BaseEnv } from './base.env';

export const newServiceEnvSchema = baseEnvSchema.extend({
  // Add service-specific variables here
});
export type NewServiceEnv = BaseEnv & {
  // Add service-specific types here
};
```

### 2. Create Configuration Module

Create `modules/new-service-config.module.ts`:

```typescript
import { Global, Module, Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { newServiceEnvSchema, NewServiceEnv } from '../env/new-service.env';
import { GenericConfigService } from '../generic-config.service';
import { GenericTypeOrmConfigService } from '../configs/generic-typeorm.config';
import { getPinoConfig } from '../configs/pino';

// Only if database is needed
@Injectable()
export class NewServiceTypeOrmConfigService extends GenericTypeOrmConfigService<NewServiceEnv> {
  constructor(configService: GenericConfigService<NewServiceEnv>) {
    super(configService, 'NEW_SERVICE');
  }
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      validate: (env) => newServiceEnvSchema.parse(env),
    }),
    LoggerModule.forRootAsync({
      inject: [GenericConfigService],
      useFactory: getPinoConfig,
    }),
    // Include only if database is needed
    TypeOrmModule.forRootAsync({
      useClass: NewServiceTypeOrmConfigService,
    }),
  ],
  providers: [
    {
      provide: GenericConfigService,
      useFactory: (configService: ConfigService<NewServiceEnv, true>) =>
        new GenericConfigService<NewServiceEnv>(configService),
      inject: [ConfigService],
    },
    NewServiceTypeOrmConfigService, // Only if database is needed
  ],
  exports: [GenericConfigService],
})
export class NewServiceConfigModule {}
```

### 3. Update Exports

Add exports to `env/index.ts` and `modules/index.ts`.

### 4. Add Environment Variables

Add the required environment variables to your `.env` files.

## Migration from Old System

If you're migrating from the old `AppConfigModule`, replace:

```typescript
// Old
import { AppConfigModule } from '@libs/nestjs/app-config/app.config.module';

// New
import { UserServiceConfigModule } from '@libs/nestjs/app-config/modules';
```

And update your environment variables to use the service-specific prefixes.

## Benefits

1. **Type Safety**: Each service gets its own typed environment interface
2. **Separation of Concerns**: Services only see the environment variables they need
3. **Validation**: Zod schemas ensure environment variables are valid at startup
4. **Flexibility**: Easy to add new services or modify existing ones
5. **Consistency**: Shared patterns for logger and database configuration
6. **Developer Experience**: Clear error messages and IntelliSense support
