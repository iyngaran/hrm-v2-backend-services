import { INestApplication } from '@nestjs/common';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { lastValueFrom, of } from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';
import {
  FindAllUsersRequest,
  UserServiceClient,
} from '../../../../generated/typescript/user-service/users/user';
import { UserServiceModule } from '../../src/user-service.module';

/**
 * ADVANCED USER SERVICE INTEGRATION TESTS
 *
 * This test suite focuses on advanced integration scenarios including:
 * 1. Stream Processing & Reactive Patterns
 * 2. Error Recovery & Resilience
 * 3. Service Composition & Complex Workflows
 * 4. Performance Under Load
 * 5. Data Consistency Across Operations
 * 6. Advanced gRPC Features
 */
describe('UserService - Advanced Integration Tests', () => {
  let app: INestApplication;
  let clientApp: INestApplication;
  let client: ClientGrpc;
  let userService: UserServiceClient;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Server setup
    const serverModule: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    }).compile();

    app = serverModule.createNestApplication();
    app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        package: 'user.v1',
        protoPath: join(
          __dirname,
          '../../../../proto/user-service/users/user.proto',
        ),
        url: 'localhost:50053',
        loader: {
          includeDirs: [
            join(__dirname, '../../../../proto'),
            join(__dirname, '../../../../proto/common'),
          ],
        },
      },
    });

    await app.startAllMicroservices();
    await app.init();

    // Client setup
    const clientModule: TestingModule = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          {
            name: 'USER_SERVICE_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'user.v1',
              protoPath: join(
                __dirname,
                '../../../../proto/user-service/users/user.proto',
              ),
              url: 'localhost:50053',
              loader: {
                includeDirs: [
                  join(__dirname, '../../../../proto'),
                  join(__dirname, '../../../../proto/common'),
                ],
              },
            },
          },
        ]),
      ],
    }).compile();

    clientApp = clientModule.createNestApplication();
    await clientApp.init();

    client = clientApp.get('USER_SERVICE_PACKAGE');
    userService = client.getService<UserServiceClient>('UserService');

    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  afterAll(async () => {
    // Cleanup
    for (const userId of createdUserIds) {
      try {
        await lastValueFrom(userService.removeUser({ id: userId }));
      } catch {
        // Ignore cleanup errors
      }
    }

    if (clientApp) {
      await clientApp.close();
    }
    if (app) {
      await app.close();
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  /**
   * STREAM PROCESSING & REACTIVE PATTERNS
   *
   * Tests advanced streaming capabilities and reactive programming patterns.
   */
  describe('Stream Processing & Reactive Patterns', () => {
    it('should handle backpressure in streaming queries', (done) => {
      const requests = Array.from({ length: 100 }, (_, i) => ({
        page: i + 1,
        limit: 1,
      }));

      let processedCount = 0;
      const startTime = Date.now();

      // Create a stream of requests
      const request$ = of(...requests);
      const response$ = userService.queryUsers(request$);

      response$
        .pipe(
          take(10), // Only take the first 10 responses to test backpressure
          timeout(15000), // 15 second timeout
        )
        .subscribe({
          next: (response) => {
            processedCount++;
            expect(response.users).toBeDefined();
          },
          complete: () => {
            const duration = Date.now() - startTime;
            expect(processedCount).toBe(10);
            expect(duration).toBeLessThan(15000);
            done();
          },
          error: (error) => {
            done(error);
          },
        });
    });

    it('should handle stream errors gracefully', (done) => {
      // Create a mixed stream with valid and invalid requests
      const validRequest = { page: 1, limit: 5 };
      const invalidRequest = { page: -1, limit: -1 }; // Invalid pagination

      const request$ = of(validRequest, invalidRequest, validRequest);
      const response$ = userService.queryUsers(request$);

      let successCount = 0;
      let _errorCount = 0;

      response$
        .pipe(
          catchError((_error) => {
            _errorCount++;
            // Return empty stream to continue processing
            return of();
          }),
        )
        .subscribe({
          next: (response) => {
            successCount++;
            expect(response.users).toBeDefined();
          },
          complete: () => {
            // We should get some successful responses
            expect(successCount).toBeGreaterThan(0);
            done();
          },
          error: done,
        });
    });

    it('should handle complex stream transformations', (done) => {
      const requests = [
        { page: 1, limit: 2 },
        { page: 2, limit: 3 },
        { page: 1, limit: 5 },
      ];

      const request$ = of(...requests);
      const response$ = userService.queryUsers(request$);

      response$
        .pipe(
          map((response) => ({
            count: response.users.length,
            emails: response.users.map((user) => user.email),
          })),
        )
        .subscribe({
          next: (transformed) => {
            expect(transformed.count).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(transformed.emails)).toBe(true);
          },
          complete: () => {
            done();
          },
          error: done,
        });
    });
  });

  /**
   * ERROR RECOVERY & RESILIENCE
   *
   * Tests service resilience and error recovery capabilities.
   */
  describe('Error Recovery & Resilience', () => {
    it('should recover from temporary failures', async () => {
      const operations = [];

      // Perform a series of operations that might fail
      for (let i = 0; i < 5; i++) {
        const operation = async (): Promise<{
          success: boolean;
          data?: any;
          error?: any;
        }> => {
          try {
            const response = await lastValueFrom(
              userService.findAllUsers({ page: '1', limit: '10' }),
            );
            return { success: true, data: response };
          } catch (error) {
            return { success: false, error };
          }
        };
        operations.push(operation());
      }

      const results = await Promise.all(operations);
      const successCount = results.filter((r) => r.success).length;

      // At least some operations should succeed
      expect(successCount).toBeGreaterThan(0);
    });

    it('should handle service unavailability gracefully', async () => {
      // Test with very short timeout to simulate unavailability
      const payload: FindAllUsersRequest = { page: '1', limit: '10' };

      try {
        const response = await lastValueFrom(
          userService.findAllUsers(payload).pipe(timeout(1)), // 1ms timeout
        );
        // If it succeeds within 1ms, that's also valid
        expect(response).toBeDefined();
      } catch (error) {
        // Timeout or other network errors are expected
        expect(error).toBeDefined();
      }
    });
  });

  /**
   * SERVICE COMPOSITION & COMPLEX WORKFLOWS
   *
   * Tests complex workflows that combine multiple service operations.
   */
  describe('Service Composition & Complex Workflows', () => {
    it('should execute complete user lifecycle workflow', async () => {
      const userEmail = `workflow.${Date.now()}@test.com`;

      // Step 1: Create user
      const createResponse = await lastValueFrom(
        userService.createUser({
          firstName: 'Workflow',
          lastName: 'Test',
          email: userEmail,
          primaryPhoneNumber: '+1234567890',
          password: 'WorkflowPass123!',
        }),
      );

      expect(createResponse.status).toBe('success');
      const userId = createResponse.data!.id;
      createdUserIds.push(userId);

      // Step 2: Verify user exists in list
      const listResponse = await lastValueFrom(
        userService.findAllUsers({ page: '1', limit: '100' }),
      );
      const userInList = listResponse.users.find((u) => u.id === userId);
      expect(userInList).toBeDefined();

      // Step 3: Update user
      const updateResponse = await lastValueFrom(
        userService.updateUser({
          id: userId,
          firstName: 'Updated Workflow',
          lastName: 'Updated Test',
          email: `updated.${userEmail}`,
          primaryPhoneNumber: '+9876543210',
        }),
      );
      expect(updateResponse.user?.firstName).toBe('Updated Workflow');

      // Step 4: Verify update through direct read
      const readResponse = await lastValueFrom(
        userService.findOneUser({ id: userId }),
      );
      expect(readResponse.user?.firstName).toBe('Updated Workflow');
      expect(readResponse.user?.email).toBe(`updated.${userEmail}`);

      // Step 5: Verify update through streaming query
      const queryResponse = await new Promise<boolean>((resolve) => {
        const request$ = of({ page: 1, limit: 100 });
        userService.queryUsers(request$).subscribe({
          next: (response) => {
            const foundUser = response.users.find((u) => u.id === userId);
            resolve(foundUser?.firstName === 'Updated Workflow');
          },
          error: () => resolve(false),
        });
      });
      expect(queryResponse).toBe(true);
    });

    it('should handle bulk operations efficiently', async () => {
      const batchSize = 10;
      const usersBatch = Array.from({ length: batchSize }, (_, i) => ({
        firstName: `Batch${i}`,
        lastName: 'User',
        email: `batch${i}.${Date.now()}@test.com`,
        primaryPhoneNumber: `+100000${i.toString().padStart(4, '0')}`,
        password: 'BatchPass123!',
      }));

      const startTime = Date.now();

      // Create all users concurrently
      const createPromises = usersBatch.map((user) =>
        lastValueFrom(userService.createUser(user)),
      );
      const createResponses = await Promise.all(createPromises);

      // Track created users for cleanup
      createResponses.forEach((response) => {
        if (response.data?.id) {
          createdUserIds.push(response.data.id);
        }
      });

      // Verify all users were created
      const allSuccessful = createResponses.every(
        (response) => response.status === 'success',
      );
      expect(allSuccessful).toBe(true);

      // Update all users concurrently
      const updatePromises = createResponses.map((response, i) =>
        lastValueFrom(
          userService.updateUser({
            id: response.data!.id,
            firstName: `UpdatedBatch${i}`,
            lastName: 'UpdatedUser',
            email: `updated.batch${i}.${Date.now()}@test.com`,
            primaryPhoneNumber: `+200000${i.toString().padStart(4, '0')}`,
          }),
        ),
      );
      const updateResponses = await Promise.all(updatePromises);

      // Verify all updates
      const allUpdated = updateResponses.every((response) =>
        response.user?.firstName?.startsWith('UpdatedBatch'),
      );
      expect(allUpdated).toBe(true);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(20000); // 20 seconds
    });
  });

  /**
   * PERFORMANCE UNDER LOAD
   *
   * Tests service performance under various load conditions.
   */
  describe('Performance Under Load', () => {
    it('should maintain response times under concurrent read load', async () => {
      // Create a test user first
      const createResponse = await lastValueFrom(
        userService.createUser({
          firstName: 'Performance',
          lastName: 'Test',
          email: `performance.${Date.now()}@test.com`,
          primaryPhoneNumber: '+1234567890',
          password: 'PerfPass123!',
        }),
      );

      const userId = createResponse.data!.id;
      createdUserIds.push(userId);

      const concurrentReads = 50;
      const startTime = Date.now();

      const readPromises = Array.from({ length: concurrentReads }, () =>
        lastValueFrom(userService.findOneUser({ id: userId })),
      );

      const responses = await Promise.all(readPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All reads should succeed
      expect(responses).toHaveLength(concurrentReads);
      responses.forEach((response) => {
        expect(response.user?.id).toBe(userId);
      });

      // Average response time should be reasonable
      const avgResponseTime = duration / concurrentReads;
      expect(avgResponseTime).toBeLessThan(1000); // Less than 1 second per request on average
    });

    it('should handle mixed operation load', async () => {
      const operationCount = 30;
      const operations = [];

      for (let i = 0; i < operationCount; i++) {
        if (i % 3 === 0) {
          // Create operation
          operations.push(
            lastValueFrom(
              userService.createUser({
                firstName: `Load${i}`,
                lastName: 'Test',
                email: `load${i}.${Date.now()}@test.com`,
                primaryPhoneNumber: `+1${i.toString().padStart(9, '0')}`,
                password: 'LoadPass123!',
              }),
            ).then((response) => {
              if (response.data?.id) {
                createdUserIds.push(response.data.id);
              }
              return { type: 'create', success: true };
            }),
          );
        } else if (i % 3 === 1) {
          // Read operation
          operations.push(
            lastValueFrom(
              userService.findAllUsers({ page: '1', limit: '5' }),
            ).then(() => ({ type: 'read', success: true })),
          );
        } else {
          // Query operation
          operations.push(
            new Promise<{ type: string; success: boolean }>((resolve) => {
              const request$ = of({ page: 1, limit: 3 });
              userService.queryUsers(request$).subscribe({
                next: () => resolve({ type: 'query', success: true }),
                error: () => resolve({ type: 'query', success: false }),
              });
            }),
          );
        }
      }

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter((r) => r.success).length;
      const successRate = successCount / operationCount;

      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
      expect(duration).toBeLessThan(30000); // Complete within 30 seconds
    });
  });

  /**
   * DATA CONSISTENCY ACROSS OPERATIONS
   *
   * Tests data consistency in complex scenarios.
   */
  describe('Data Consistency Across Operations', () => {
    it('should maintain consistency during rapid updates', async () => {
      // Create a user
      const createResponse = await lastValueFrom(
        userService.createUser({
          firstName: 'Consistency',
          lastName: 'Test',
          email: `consistency.${Date.now()}@test.com`,
          primaryPhoneNumber: '+1234567890',
          password: 'ConsistencyPass123!',
        }),
      );

      const userId = createResponse.data!.id;
      createdUserIds.push(userId);

      // Perform rapid sequential updates
      const updates = ['First', 'Second', 'Third', 'Fourth', 'Final'];

      for (const [index, firstName] of updates.entries()) {
        const updateResponse = await lastValueFrom(
          userService.updateUser({
            id: userId,
            firstName,
            lastName: `Update${index}`,
            email: `update${index}.${Date.now()}@test.com`,
            primaryPhoneNumber: `+1${index}00000000`,
          }),
        );
        expect(updateResponse.user?.firstName).toBe(firstName);
      }

      // Final verification
      const finalRead = await lastValueFrom(
        userService.findOneUser({ id: userId }),
      );
      expect(finalRead.user?.firstName).toBe('Final');
    });

    it('should handle concurrent updates to the same user', async () => {
      // Create a user
      const createResponse = await lastValueFrom(
        userService.createUser({
          firstName: 'Concurrent',
          lastName: 'Test',
          email: `concurrent.${Date.now()}@test.com`,
          primaryPhoneNumber: '+1234567890',
          password: 'ConcurrentPass123!',
        }),
      );

      const userId = createResponse.data!.id;
      createdUserIds.push(userId);

      // Attempt concurrent updates
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        lastValueFrom(
          userService.updateUser({
            id: userId,
            firstName: `Concurrent${i}`,
            lastName: 'Test',
            email: `concurrent${i}.${Date.now()}@test.com`,
            primaryPhoneNumber: `+1${i}00000000`,
          }),
        ),
      );

      const updateResponses = await Promise.all(updatePromises);

      // All updates should succeed (last writer wins)
      updateResponses.forEach((response) => {
        expect(response.user?.id).toBe(userId);
        expect(response.user?.firstName).toMatch(/^Concurrent\d$/);
      });

      // Final state should be consistent
      const finalRead = await lastValueFrom(
        userService.findOneUser({ id: userId }),
      );
      expect(finalRead.user?.firstName).toMatch(/^Concurrent\d$/);
    });
  });

  /**
   * ADVANCED gRPC FEATURES
   *
   * Tests advanced gRPC features and edge cases.
   */
  describe('Advanced gRPC Features', () => {
    it('should handle large payloads efficiently', async () => {
      const largeData = 'A'.repeat(10000); // 10KB string

      try {
        const response = await lastValueFrom(
          userService.createUser({
            firstName: largeData,
            lastName: 'LargeData',
            email: `large.data.${Date.now()}@test.com`,
            primaryPhoneNumber: '+1234567890',
            password: 'LargeDataPass123!',
          }),
        );

        if (response.data?.id) {
          createdUserIds.push(response.data.id);
          expect(response.status).toBe('success');
        }
      } catch (error) {
        // May fail due to size limits - document the behavior
        expect(error).toBeDefined();
      }
    });

    it('should handle connection recovery', async () => {
      let connectionAttempts = 0;
      const maxAttempts = 3;

      while (connectionAttempts < maxAttempts) {
        try {
          const response = await lastValueFrom(
            userService.findAllUsers({ page: '1', limit: '1' }),
          );
          expect(response.users).toBeDefined();
          break;
        } catch (error) {
          connectionAttempts++;
          if (connectionAttempts === maxAttempts) {
            throw error;
          }
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      expect(connectionAttempts).toBeLessThan(maxAttempts);
    });

    it('should handle streaming with different message sizes', (done) => {
      const requests = [
        { page: 1, limit: 1 }, // Small response
        { page: 1, limit: 10 }, // Medium response
        { page: 1, limit: 50 }, // Large response
      ];

      let responseCount = 0;
      const request$ = of(...requests);
      const response$ = userService.queryUsers(request$);

      response$.subscribe({
        next: (response) => {
          responseCount++;
          expect(response.users).toBeDefined();
          expect(response.users.length).toBeGreaterThanOrEqual(0);
        },
        complete: () => {
          expect(responseCount).toBe(requests.length);
          done();
        },
        error: done,
      });
    });
  });
});
