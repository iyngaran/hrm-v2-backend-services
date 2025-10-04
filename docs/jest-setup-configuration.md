# Jest Setup Files Configuration for gRPC Services

This document explains how to configure service-specific Jest setup files for each gRPC service in your NestJS monorepo.

## Table of Contents

- [Overview](#overview)
- [Current Structure](#current-structure)
- [Configuration Options](#configuration-options)
- [Service-Specific Setup Files](#service-specific-setup-files)
- [Implementation Examples](#implementation-examples)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

## Overview

In a monorepo with multiple gRPC services, each service may require different test setup configurations:

- **Different environment variables**
- **Service-specific mocks**
- **Different timeouts or configurations**
- **Unique database connections**
- **Service-specific gRPC client mocks**

## Current Structure

Your project structure with Jest setup files:

```
backend-services/
├── package.json                    # Global Jest config with setupFilesAfterEnv
├── test/
│   └── setup.ts                   # Global setup file
├── apps/
│   ├── api-gateway/
│   │   └── test/
│   │       ├── jest-e2e.json     # Service-specific Jest config
│   │       └── setup.ts          # Service-specific setup
│   ├── user-service/
│   │   └── test/
│   │       ├── jest-e2e.json     # Service-specific Jest config
│   │       └── setup.ts          # Service-specific setup
│   └── hrm-service/
│       └── test/
│           ├── jest-e2e.json     # Service-specific Jest config
│           └── setup.ts          # Service-specific setup
```

## Configuration Options

### Option 1: Service-Specific Jest Configurations (Recommended)

Each service has its own `jest-e2e.json` with `setupFilesAfterEnv` pointing to its own setup file:

```json
// apps/user-service/test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "setupFilesAfterEnv": ["<rootDir>/test/setup.ts"],
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^@app/libs(|/.*)$": "<rootDir>/../../../libs/src/$1"
  }
}
```

### Option 2: Dynamic Setup File Resolution

Use a single setup file that dynamically loads service-specific configurations:

```typescript
// test/setup.ts (Global)
import 'source-map-support/register';

// Dynamically load service-specific setup based on test context
const currentTestPath = expect.getState().testPath;
const serviceName = extractServiceName(currentTestPath);

switch (serviceName) {
  case 'user-service':
    require('../apps/user-service/test/setup');
    break;
  case 'api-gateway':
    require('../apps/api-gateway/test/setup');
    break;
  case 'hrm-service':
    require('../apps/hrm-service/test/setup');
    break;
}
```

### Option 3: Environment-Based Configuration

Use environment variables to determine which setup to load:

```typescript
// test/setup.ts
import 'source-map-support/register';

const serviceType = process.env.TEST_SERVICE_TYPE;

if (serviceType === 'user-service') {
  // User service specific setup
  jest.setTimeout(30000);
  process.env.DATABASE_URL = 'postgresql://localhost:5432/user_test';
} else if (serviceType === 'api-gateway') {
  // API Gateway specific setup
  jest.setTimeout(45000);
  process.env.GRPC_USER_SERVICE_URL = 'localhost:50051';
}
```

## Service-Specific Setup Files

### User Service Setup

```typescript
// apps/user-service/test/setup.ts
import 'source-map-support/register';

// User Service specific test setup
jest.setTimeout(30000);

// Environment configuration for User Service
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://localhost:5432/user_service_test';
process.env.GRPC_PORT = '0'; // Random available port

// Mock external dependencies
beforeAll(async () => {
  // Setup test database connection
  // Mock external gRPC services that User Service depends on
});

afterAll(async () => {
  // Cleanup database connections
  // Close gRPC connections
});

// User Service specific global test utilities
global.createTestUser = async (userData: any) => {
  // Helper function for creating test users
};
```

### API Gateway Setup

```typescript
// apps/api-gateway/test/setup.ts
import 'source-map-support/register';

// API Gateway specific test setup
jest.setTimeout(45000); // Longer timeout for integration tests

// Environment configuration for API Gateway
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port
process.env.GRPC_USER_SERVICE_URL = 'localhost:50051';
process.env.GRPC_HRM_SERVICE_URL = 'localhost:50052';

// Mock gRPC clients
beforeAll(async () => {
  // Setup mock gRPC services
  // Start test server
});

afterAll(async () => {
  // Cleanup mock services
  // Stop test server
});

// API Gateway specific test utilities
global.makeAuthenticatedRequest = (token: string) => {
  // Helper for authenticated API requests
};
```

### HRM Service Setup

```typescript
// apps/hrm-service/test/setup.ts
import 'source-map-support/register';

// HRM Service specific test setup
jest.setTimeout(30000);

// Environment configuration for HRM Service
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://localhost:5432/hrm_service_test';
process.env.GRPC_PORT = '0';

// Mock external dependencies
beforeAll(async () => {
  // Setup HRM-specific test data
  // Mock user service calls
});

afterAll(async () => {
  // Cleanup HRM test data
});

// HRM Service specific test utilities
global.createTestEmployee = async (employeeData: any) => {
  // Helper for creating test employees
};
```

## Implementation Examples

### Running Service-Specific Tests

```json
// package.json scripts
{
  "scripts": {
    "test:user-service": "jest --config ./apps/user-service/test/jest-e2e.json",
    "test:api-gateway": "jest --config ./apps/api-gateway/test/jest-e2e.json",
    "test:hrm-service": "jest --config ./apps/hrm-service/test/jest-e2e.json",
    "test:all-services": "pnpm test:user-service && pnpm test:api-gateway && pnpm test:hrm-service"
  }
}
```

### Service-Specific Test Example

```typescript
// apps/user-service/test/users/user.e2e-spec.ts
describe('User Service E2E', () => {
  beforeEach(async () => {
    // This will use apps/user-service/test/setup.ts
    // which has User Service specific configurations
  });

  it('should create a user via gRPC', async () => {
    // Test uses User Service specific setup
    const user = await global.createTestUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user).toBeDefined();
  });
});
```

### Cross-Service Integration Tests

```typescript
// apps/api-gateway/test/integration.e2e-spec.ts
describe('API Gateway Integration', () => {
  beforeEach(async () => {
    // This uses apps/api-gateway/test/setup.ts
    // which mocks the gRPC services
  });

  it('should handle user creation through API', async () => {
    const response = await global
      .makeAuthenticatedRequest('valid-token')
      .post('/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
  });
});
```

## Best Practices

### 1. **Isolation by Service**

```typescript
// ✅ Good: Each service has isolated setup
// apps/user-service/test/setup.ts - Only User Service concerns
// apps/hrm-service/test/setup.ts - Only HRM Service concerns

// ❌ Avoid: Mixing service concerns in one setup file
```

### 2. **Environment Variable Namespacing**

```typescript
// ✅ Good: Service-specific environment variables
process.env.USER_SERVICE_DATABASE_URL = 'postgresql://localhost:5432/user_test';
process.env.HRM_SERVICE_DATABASE_URL = 'postgresql://localhost:5432/hrm_test';

// ❌ Avoid: Generic environment variables that might conflict
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
```

### 3. **Port Management for gRPC Services**

```typescript
// ✅ Good: Dynamic port allocation
process.env.GRPC_PORT = '0'; // Let system assign available port

// ❌ Avoid: Fixed ports that might conflict
process.env.GRPC_PORT = '50051'; // Might conflict in parallel tests
```

### 4. **Cleanup and Resource Management**

```typescript
// ✅ Good: Proper cleanup in afterAll
afterAll(async () => {
  await closeDatabaseConnections();
  await stopGrpcServer();
  await cleanupTempFiles();
});

// ❌ Avoid: Leaving resources hanging
afterAll(async () => {
  // No cleanup - causes resource leaks
});
```

### 5. **Shared Utilities**

```typescript
// ✅ Good: Service-specific utilities
// apps/user-service/test/setup.ts
global.createTestUser = async (userData) => {
  /* User-specific */
};

// apps/hrm-service/test/setup.ts
global.createTestEmployee = async (empData) => {
  /* HRM-specific */
};

// ❌ Avoid: Generic utilities that don't fit all services
```

## Common Use Cases

### Database Per Service

```typescript
// User Service Setup
beforeAll(async () => {
  await setupDatabase('user_service_test');
});

// HRM Service Setup
beforeAll(async () => {
  await setupDatabase('hrm_service_test');
});
```

### gRPC Client Mocking

```typescript
// API Gateway Setup - Mocks downstream services
beforeAll(async () => {
  mockGrpcService('UserService', {
    CreateUser: jest.fn().mockResolvedValue({ id: '123' }),
    GetUser: jest.fn().mockResolvedValue({ id: '123', name: 'Test' }),
  });
});
```

### Service-Specific Timeouts

```typescript
// User Service - Standard timeout
jest.setTimeout(30000);

// API Gateway - Longer timeout for integration tests
jest.setTimeout(60000);

// HRM Service - Standard timeout
jest.setTimeout(30000);
```

### Authentication Mocking

```typescript
// API Gateway Setup
global.mockAuthentication = (permissions: string[]) => {
  // Mock JWT validation for API tests
};

// Service Setup (User/HRM)
global.mockServiceAuth = () => {
  // Mock inter-service authentication
};
```

## Troubleshooting

### Setup File Not Loading

**Problem**: Service-specific setup file is not being executed

**Solution**:

```bash
# Verify Jest configuration
cat apps/user-service/test/jest-e2e.json

# Check if setup file exists
ls -la apps/user-service/test/setup.ts

# Run with verbose output
pnpm test:user-service --verbose
```

### Environment Variable Conflicts

**Problem**: Services are using conflicting environment variables

**Solution**:

```typescript
// Namespace environment variables by service
process.env.USER_SERVICE_DB_HOST = 'localhost';
process.env.HRM_SERVICE_DB_HOST = 'localhost';

// Or use different test databases
process.env.DATABASE_URL = `postgresql://localhost:5432/${serviceName}_test`;
```

### Port Conflicts in Parallel Tests

**Problem**: Multiple services trying to use the same ports

**Solution**:

```typescript
// Use dynamic port allocation
process.env.GRPC_PORT = '0'; // System assigns available port

// Or use port ranges
const basePort = 50000 + Math.floor(Math.random() * 1000);
process.env.GRPC_PORT = basePort.toString();
```

### Global Utilities Conflicts

**Problem**: Different services defining conflicting global utilities

**Solution**:

```typescript
// Namespace global utilities
global.userService = {
  createTestUser: async (data) => {
    /* ... */
  },
};

global.hrmService = {
  createTestEmployee: async (data) => {
    /* ... */
  },
};
```

## Summary

You now have service-specific Jest setup files configured for each of your gRPC services:

- **User Service**: `apps/user-service/test/setup.ts`
- **API Gateway**: `apps/api-gateway/test/setup.ts`
- **HRM Service**: `apps/hrm-service/test/setup.ts`

Each service can now have its own:

- ✅ Environment configurations
- ✅ Database connections
- ✅ gRPC client mocks
- ✅ Test utilities
- ✅ Timeouts and settings

Run tests using:

```bash
pnpm test:user-service:e2e    # Uses user-service setup
pnpm test:api-gateway:e2e     # Uses api-gateway setup
pnpm test:hrm-service:e2e     # Uses hrm-service setup (when you create it)
```
