# Service-Specific GRPC URLs Configuration

## Overview

Each service now has its own GRPC URL configuration instead of sharing a common `GRPC_URL`. This allows for:

- **Service isolation**: Each service can run on different ports
- **Independent scaling**: Services can be deployed on different hosts/ports
- **Better service discovery**: API Gateway knows exactly where each service is located
- **Development flexibility**: Run services on different ports locally

## GRPC URL Configuration by Service

### User Service

- **Environment Variable**: `GRPC_USER_SERVICE_URL`
- **Default Port**: `0.0.0.0:50002`
- **Usage**: User service listens on this URL for GRPC requests

### HRM Service

- **Environment Variable**: `GRPC_HRM_SERVICE_URL`
- **Default Port**: `0.0.0.0:50003`
- **Usage**: HRM service listens on this URL for GRPC requests

### API Gateway

- **Environment Variables**:
  - `GRPC_USER_SERVICE_URL=0.0.0.0:50002` (to connect to user service)
  - `GRPC_HRM_SERVICE_URL=0.0.0.0:50003` (to connect to HRM service)
- **Usage**: API Gateway uses these URLs to connect to respective services

## Environment File Configuration

### For User Service (`.env.development`)

```bash
NODE_ENV=development
GRPC_USER_SERVICE_URL=0.0.0.0:50002

# Database config
USER_SERVICE_DB_HOST=localhost
# ... other user service configs
```

### For HRM Service (`.env.development`)

```bash
NODE_ENV=development
GRPC_HRM_SERVICE_URL=0.0.0.0:50003

# Database config
HRM_SERVICE_DB_HOST=localhost
# ... other HRM service configs
```

### For API Gateway (`.env.development`)

```bash
NODE_ENV=development
GRPC_USER_SERVICE_URL=0.0.0.0:50002
GRPC_HRM_SERVICE_URL=0.0.0.0:50003

# No database config needed
```

## Usage in Code

### User Service - Server Setup

```typescript
@Injectable()
export class UserService {
  constructor(private configService: GenericConfigService<UserServiceEnv>) {}

  async startServer() {
    const grpcUrl = this.configService.get('GRPC_USER_SERVICE_URL');
    // Setup GRPC server to listen on grpcUrl
  }
}
```

### API Gateway - Client Setup

```typescript
@Injectable()
export class ApiGatewayService {
  constructor(private configService: GenericConfigService<ApiGatewayEnv>) {}

  async connectToServices() {
    const userServiceUrl = this.configService.get('GRPC_USER_SERVICE_URL');
    const hrmServiceUrl = this.configService.get('GRPC_HRM_SERVICE_URL');

    // Create GRPC clients
    this.userServiceClient = new UserServiceClient(userServiceUrl);
    this.hrmServiceClient = new HrmServiceClient(hrmServiceUrl);
  }
}
```

## Development Setup

1. **Copy the appropriate environment file**:

   ```bash
   # For user service
   cp .env.user-service.example .env.development

   # For HRM service
   cp .env.hrm-service.example .env.development

   # For API Gateway
   cp .env.api-gateway.example .env.development
   ```

2. **Update the GRPC URLs as needed**:
   - Different ports for local development
   - Different hosts for distributed deployment
   - Load balancer URLs for production

3. **Start services on their designated ports**:

   ```bash
   # Terminal 1 - User Service (port 50002)
   pnpm run start:dev user-service

   # Terminal 2 - HRM Service (port 50003)
   pnpm run start:dev hrm-service

   # Terminal 3 - API Gateway
   pnpm run start:dev api-gateway
   ```

## Production Deployment

In production, you can:

- Use different hosts: `user-service.example.com:50002`
- Use load balancers: `lb-user-service.internal:443`
- Use service discovery: `consul://user-service`

Example production environment:

```bash
# Production API Gateway
GRPC_USER_SERVICE_URL=user-service.internal:443
GRPC_HRM_SERVICE_URL=hrm-service.internal:443
```

## Migration from Old Configuration

**Before** (shared GRPC_URL):

```bash
GRPC_URL=0.0.0.0:50002  # All services used this
```

**After** (service-specific):

```bash
# User Service
GRPC_USER_SERVICE_URL=0.0.0.0:50002

# HRM Service
GRPC_HRM_SERVICE_URL=0.0.0.0:50003

# API Gateway
GRPC_USER_SERVICE_URL=0.0.0.0:50002
GRPC_HRM_SERVICE_URL=0.0.0.0:50003
```

Update your code to use the new service-specific environment variables instead of the old `GRPC_URL`.
