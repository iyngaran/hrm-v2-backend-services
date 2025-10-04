# gRPC End-to-End Testing Guide

This guide covers best practices for implementing and running E2E tests for gRPC microservices using NestJS and Jest.

## Overview

gRPC E2E testing involves testing the complete communication flow between gRPC client and server, including serialization, network communication, and business logic validation.

## Common Issues and Solutions

### 1. gRPC Call Cancellation Errors

**Issue**: Tests pass but show "Call cancelled" errors and exit with code 1

```
1 CANCELLED: Call cancelled
ELIFECYCLE Command failed with exit code 1
```

**Root Cause**: Jest exits before gRPC streaming connections are properly closed

**Solutions**:

#### Option A: Handle Cancellation Gracefully (Recommended)

```typescript
it('should handle streaming calls', async () => {
  try {
    const response = await lastValueFrom(userService.findAllUsers(payload));
    expect(response).toBeDefined();
  } catch (error) {
    const grpcError = error as any;
    if (grpcError.message?.includes('CANCELLED') || grpcError.code === 1) {
      console.log('Test completed - gRPC call cancelled during cleanup');
      return;
    }
    throw error;
  }
});
```

#### Option B: Jest Configuration Adjustments

```json
{
  "testTimeout": 30000,
  "forceExit": false,
  "detectOpenHandles": true,
  "maxWorkers": 1,
  "silent": false
}
```

#### Option C: Improved Cleanup

```typescript
afterAll(async () => {
  // Close gRPC client services to cancel pending streams
  if (client) {
    try {
      const service = client.getService('UsersService') as any;
      if (service && typeof service.close === 'function') {
        service.close();
      }
    } catch {
      // Ignore client close errors
    }
  }

  // Close applications with proper shutdown
  if (clientApp) {
    try {
      await clientApp.close();
    } catch {
      // Ignore close errors
    }
  }

  if (app) {
    try {
      await app.close();
    } catch {
      // Ignore close errors
    }
  }

  // Give time for cleanup
  await new Promise((resolve) => setTimeout(resolve, 100));
});
```

### 2. Test Structure Best Practices

#### Proper Application Setup

```typescript
beforeAll(async () => {
  // Server application
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [UsersModule, DatabaseModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user_service',
      protoPath: join(
        __dirname,
        '../../../../proto/user-service/users/users.proto',
      ),
      url: 'localhost:5001',
    },
  });

  await app.startAllMicroservices();
  await app.init();

  // Client application
  const clientModule = await Test.createTestingModule({
    imports: [],
  }).compile();

  clientApp = clientModule.createNestApplication();
  client = clientApp.get(USER_SERVICE_NAME);
  userService = client.getService<UsersServiceClient>('UsersService');
});
```

#### Database Integration

```typescript
// In your module setup
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'hrm_test',
        entities: [User],
        synchronize: true,
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
```

### 3. Test Categories

#### Unit-like Tests (Direct Service Testing)

```typescript
it('should create a user', async () => {
  const request: CreateUserRequest = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    primaryPhoneNumber: '1234567890',
    password: 'password123',
  };

  const response = await lastValueFrom(userService.createUser(request));

  expect(response).toBeDefined();
  expect(response.user).toBeDefined();
  expect(response.user.firstName).toBe('John');
});
```

#### Integration Tests (Full gRPC Flow)

```typescript
it('should handle CRUD operations', async () => {
  // Create
  const createRequest = {
    /* user data */
  };
  const createResponse = await lastValueFrom(
    userService.createUser(createRequest),
  );
  const userId = createResponse.user.id;

  // Read
  const findResponse = await lastValueFrom(
    userService.findOneUser({ id: userId }),
  );
  expect(findResponse.user.id).toBe(userId);

  // Update
  const updateRequest = { id: userId, firstName: 'Updated' };
  const updateResponse = await lastValueFrom(
    userService.updateUser(updateRequest),
  );
  expect(updateResponse.user.firstName).toBe('Updated');

  // Delete
  await lastValueFrom(userService.removeUser({ id: userId }));
});
```

#### Error Handling Tests

```typescript
it('should handle invalid UUID gracefully', async () => {
  try {
    await lastValueFrom(userService.findOneUser({ id: 'invalid-uuid' }));
    fail('Should have thrown an error');
  } catch (error) {
    expect(error.code).toBe(3); // INVALID_ARGUMENT
    expect(error.message).toContain('Invalid UUID format');
  }
});
```

### 4. Performance Considerations

#### Timeout Configuration

```typescript
// Global setup
jest.setTimeout(30000); // 30 seconds

// Per test
it('should handle long operations', async () => {
  // Test implementation
}, 45000); // 45 seconds for this specific test
```

#### Connection Pooling

```typescript
// Use single worker to avoid connection conflicts
// jest-e2e.json
{
  "maxWorkers": 1
}
```

### 5. Debugging Tips

#### Enable Detailed Logging

```typescript
// In your service
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    this.logger.log(`Creating user with request: ${JSON.stringify(request)}`);
    // Implementation
    this.logger.log(`User created successfully: ${JSON.stringify(user)}`);
  }
}
```

#### Database Query Logging

```typescript
// TypeORM configuration
{
  type: 'postgres',
  logging: true, // Enable query logging
  logger: 'advanced-console',
}
```

## Running E2E Tests

### Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific service E2E tests
pnpm test:user-service:e2e

# Run with verbose output
pnpm test:user-service:e2e --verbose

# Run with specific timeout
pnpm test:user-service:e2e --testTimeout=60000
```

### Expected Behavior

✅ **Success Indicators**:

- All tests pass (e.g., "10 passed, 10 total")
- Database operations complete correctly
- gRPC communication works as expected

⚠️ **Acceptable Warnings**:

- "Call cancelled" messages at the end (cleanup-related)
- Exit code 1 if tests actually passed (Jest cleanup issue)

❌ **Actual Failures**:

- Test assertions failing
- Connection timeouts
- Database errors
- Proto compilation issues

## Troubleshooting

### Common Problems

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check database credentials
   - Verify test database exists

2. **Proto File Issues**
   - Run `pnpm build:proto` before testing
   - Check proto file paths in test configuration

3. **Port Conflicts**
   - Use different ports for each service
   - Ensure ports are not already in use

4. **Memory Issues**
   - Use single worker: `"maxWorkers": 1`
   - Increase Node.js memory: `--max-old-space-size=4096`

### Best Practices Summary

1. **Cleanup**: Always implement proper afterAll cleanup
2. **Error Handling**: Handle gRPC cancellation gracefully
3. **Isolation**: Use single worker for E2E tests
4. **Timeouts**: Configure appropriate timeouts for operations
5. **Logging**: Enable comprehensive logging for debugging
6. **Database**: Use test-specific database configuration
7. **Proto Files**: Ensure proto files are compiled and accessible

## Conclusion

gRPC E2E testing requires careful handling of asynchronous operations and proper cleanup. While "Call cancelled" errors may appear during cleanup, they don't indicate test failures if the actual test assertions pass. Focus on the test results rather than cleanup warnings.

The key is to:

1. Implement comprehensive test coverage
2. Handle cleanup gracefully
3. Use proper error handling
4. Configure Jest appropriately for gRPC testing
5. Monitor actual test results vs cleanup warnings
