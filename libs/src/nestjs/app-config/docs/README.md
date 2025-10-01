# Flexible NestJS Configuration System

This configuration system provides a flexible way to handle environment variables for different microservices in your NestJS application.

## Architecture Overview

The configuration system is built with the following components:

1. **Base Environment Schema** (`base.env.ts`) - Common variables for all services
2. **Database Environment Schema** (`database.env.ts`) - Database-specific variables with service prefix
3. **Service-Specific Environment Schemas** - Each service has its own environment schema
4. **Generic Config Service** - Type-safe configuration service
5. **Service-Specific Config Modules** - Pre-configured modules for each service

## Directory Structure

```
libs/src/nestjs/app-config/
├── env/
│   ├── base.env.ts              # Base environment variables
│   ├── database.env.ts          # Database environment helpers
│   ├── user-service.env.ts      # User service specific env
│   ├── hrm-service.env.ts       # HRM service specific env
│   ├── api-gateway.env.ts       # API Gateway specific env
│   └── index.ts                 # Export all env types
├── modules/
│   ├── user-service-config.module.ts    # User service config module
│   ├── hrm-service-config.module.ts     # HRM service config module
│   ├── api-gateway-config.module.ts     # API Gateway config module
│   └── index.ts                         # Export all modules
├── configs/
│   ├── generic-typeorm.config.ts        # Generic TypeORM configuration
│   └── pino.ts                          # Pino logger configuration
├── generic-config.service.ts            # Generic type-safe config service
└── generic-config.module.ts             # Generic config module factory
```

## Usage by Service

### 1. User Service (with Database)

**Environment Variables Required:**

```env
# Base variables (all services)
NODE_ENV=development
GRPC_URL=0.0.0.0:50002
LOGGER_ENABLE=true
# ... other logger settings

# User service specific database variables
USER_SERVICE_DB_HOST=localhost
USER_SERVICE_DB_PORT=5432
USER_SERVICE_DB_USER=user_db_user
USER_SERVICE_DB_PASSWORD=password
USER_SERVICE_DB_NAME=user_service_db
USER_SERVICE_DB_SYNCHRONIZE=false
USER_SERVICE_DB_LOGGING=false
```

**Module Setup:**

```typescript
import { Module } from '@nestjs/common';
import { UserServiceConfigModule } from '@app/libs/nestjs/app-config/modules/user-service-config.module';

@Module({
  imports: [UserServiceConfigModule /* other modules */],
  // ... rest of module
})
export class UserServiceModule {}
```

**Service Usage:**

```typescript
import { Injectable } from '@nestjs/common';
import { GenericConfigService } from '@app/libs';
import { UserServiceEnv } from '@app/libs/nestjs/app-config/env/user-service.env';

@Injectable()
export class SomeUserService {
  constructor(
    private readonly configService: GenericConfigService<UserServiceEnv>,
  ) {
    // Type-safe access to environment variables
    const dbHost = this.configService.get('USER_SERVICE_DB_HOST'); // string
    const nodeEnv = this.configService.get('NODE_ENV'); // 'development' | 'production' | 'staging' | 'test'
    const loggerEnabled = this.configService.get('LOGGER_ENABLE'); // boolean
  }
}
```

### 2. HRM Service (with Database)

**Environment Variables Required:**

```env
# Base variables (all services)
NODE_ENV=development
GRPC_URL=0.0.0.0:50002
# ... logger settings

# HRM service specific database variables
HRM_SERVICE_DB_HOST=localhost
HRM_SERVICE_DB_PORT=5432
HRM_SERVICE_DB_USER=hrm_db_user
HRM_SERVICE_DB_PASSWORD=password
HRM_SERVICE_DB_NAME=hrm_service_db
HRM_SERVICE_DB_SYNCHRONIZE=false
HRM_SERVICE_DB_LOGGING=false
```

**Module Setup:**

```typescript
import { Module } from '@nestjs/common';
import { HrmServiceConfigModule } from '@app/libs/nestjs/app-config/modules/hrm-service-config.module';

@Module({
  imports: [HrmServiceConfigModule /* other modules */],
  // ... rest of module
})
export class HrmServiceModule {}
```

### 3. API Gateway (No Database)

**Environment Variables Required:**

```env
# Base variables only (no database variables needed)
NODE_ENV=development
GRPC_URL=0.0.0.0:50002
# ... logger settings
```

**Module Setup:**

```typescript
import { Module } from '@nestjs/common';
import { ApiGatewayConfigModule } from '@app/libs/nestjs/app-config/modules/api-gateway-config.module';

@Module({
  imports: [ApiGatewayConfigModule /* other modules */],
  // ... rest of module
})
export class AppModule {}
```

## Adding a New Service

To add a new service with its own configuration:

### 1. Create Service Environment Schema

Create `libs/src/nestjs/app-config/env/new-service.env.ts`:

```typescript
import { createDatabaseEnvSchema, DatabaseEnv } from './database.env';

// For services with database
export const newServiceEnvSchema = createDatabaseEnvSchema('NEW_SERVICE');
export type NewServiceEnv = DatabaseEnv<'NEW_SERVICE'>;

// OR for services without database
import { baseEnvSchema, BaseEnv } from './base.env';

export const newServiceEnvSchema = baseEnvSchema.extend({
  // Add service-specific variables here
  NEW_SERVICE_SPECIFIC_VAR: z.string().default('default_value'),
});

export type NewServiceEnv = BaseEnv & {
  NEW_SERVICE_SPECIFIC_VAR: string;
};
```

### 2. Create Service Config Module

Create `libs/src/nestjs/app-config/modules/new-service-config.module.ts`:

```typescript
import { Global, Module, Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { newServiceEnvSchema, NewServiceEnv } from '../env/new-service.env';
import { GenericConfigService } from '../generic-config.service';
import { getPinoConfig } from '../configs/pino';
import { TypeOrmModule } from '@nestjs/typeorm'; // Only if database needed
import { GenericTypeOrmConfigService } from '../configs/generic-typeorm.config';

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
    // Only include TypeOrmModule if database is needed
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
    NewServiceTypeOrmConfigService, // Only if database needed
  ],
  exports: [GenericConfigService],
})
export class NewServiceConfigModule {}
```

### 3. Update Exports

Add exports to relevant index files:

- `libs/src/nestjs/app-config/env/index.ts`
- `libs/src/nestjs/app-config/modules/index.ts`

## Benefits

1. **Type Safety**: Full TypeScript support with proper typing for environment variables
2. **Service Isolation**: Each service only sees its relevant environment variables
3. **Code Reuse**: Common configuration logic is shared across services
4. **Validation**: Zod schema validation ensures environment variables are correct
5. **Flexibility**: Easy to add new services or modify existing ones
6. **No Database Pollution**: Services without databases don't get database configuration

## Environment Variable Naming Convention

- **Base variables**: Use standard names (e.g., `NODE_ENV`, `LOGGER_ENABLE`)
- **Service-specific variables**: Use `{SERVICE_NAME}_` prefix (e.g., `USER_SERVICE_DB_HOST`, `HRM_SERVICE_DB_HOST`)
- **Database variables**: Follow pattern `{SERVICE_NAME}_DB_{PROPERTY}` (e.g., `USER_SERVICE_DB_HOST`)

This ensures no conflicts between services and makes it clear which service owns which variable.
