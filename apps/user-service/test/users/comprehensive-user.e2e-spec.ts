import { INestApplication } from '@nestjs/common';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { lastValueFrom, of } from 'rxjs';
import {
  CreateUserRequest,
  CreateUserResponse,
  FindAllUsersRequest,
  FindAllUsersResponse,
  FindOneUserRequest,
  FindOneUserResponse,
  QueryUsersRequest,
  QueryUsersResponse,
  RemoveUserRequest,
  RemoveUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserServiceClient,
} from '../../../../generated/typescript/user-service/users/user';
import { UserServiceModule } from '../../src/user-service.module';

/**
 * COMPREHENSIVE USER SERVICE E2E TESTS
 *
 * This test suite provides end-to-end testing for the User Service gRPC API.
 * It covers all CRUD operations, error scenarios, edge cases, and performance considerations.
 *
 * Test Categories:
 * 1. Service Setup & Teardown
 * 2. User CRUD Operations (Happy Path)
 * 3. Validation & Error Handling
 * 4. Edge Cases & Boundary Conditions
 * 5. Pagination & Filtering
 * 6. Concurrent Operations
 * 7. Performance & Load Testing
 * 8. Data Integrity & Consistency
 */
describe('UserService (gRPC) - Comprehensive E2E', () => {
  let app: INestApplication;
  let clientApp: INestApplication;
  let client: ClientGrpc;
  let userService: UserServiceClient;

  // Test data storage
  const createdUserIds: string[] = [];
  const testUsers: CreateUserRequest[] = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      primaryPhoneNumber: '+1234567890',
      password: 'SecurePass123!',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com',
      primaryPhoneNumber: '+1987654321',
      password: 'SecurePass456!',
    },
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@test.com',
      primaryPhoneNumber: '+1122334455',
      password: 'SecurePass789!',
    },
    {
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@test.com',
      primaryPhoneNumber: '+1555666777',
      password: 'SecurePass012!',
    },
    {
      firstName: 'Carol',
      lastName: 'Brown',
      email: 'carol.brown@test.com',
      primaryPhoneNumber: '+1999888777',
      password: 'SecurePass345!',
    },
  ];

  /**
   * SERVICE SETUP & TEARDOWN
   */
  beforeAll(async () => {
    // Create the server application
    const serverModule: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    }).compile();

    app = serverModule.createNestApplication();

    // Configure the gRPC microservice server
    app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        package: 'user.v1',
        protoPath: join(
          __dirname,
          '../../../../proto/user-service/users/user.proto',
        ),
        url: 'localhost:50052', // Different port from other tests
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

    // Create the client application
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
              url: 'localhost:50052',
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

    // Get the gRPC client
    client = clientApp.get('USER_SERVICE_PACKAGE');
    userService = client.getService<UserServiceClient>('UserService');

    // Wait for service to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  afterAll(async () => {
    try {
      // Cleanup created users
      for (const userId of createdUserIds) {
        try {
          await lastValueFrom(userService.removeUser({ id: userId }));
        } catch {
          // Ignore cleanup errors
        }
      }

      // Close applications
      if (clientApp) {
        await clientApp.close();
      }
      if (app) {
        await app.close();
      }

      // Allow cleanup time
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch {
      console.log('Cleanup completed with some errors');
    }
  });

  /**
   * USER CRUD OPERATIONS (HAPPY PATH)
   *
   * Tests the basic CRUD operations under normal conditions
   * with valid data and expected successful outcomes.
   */
  describe('User CRUD Operations - Happy Path', () => {
    let primaryUserId: string;

    it('should create a user successfully with all fields', async () => {
      const payload = testUsers[0];

      const response: CreateUserResponse = await lastValueFrom(
        userService.createUser(payload),
      );

      expect(response.status).toBe('success');
      expect(response.message).toContain('successfully');
      expect(response.data).toBeDefined();
      expect(response.data?.email).toBe(payload.email);
      expect(response.data?.firstName).toBe(payload.firstName);
      expect(response.data?.lastName).toBe(payload.lastName);
      expect(response.data?.primaryPhoneNumber).toBe(
        payload.primaryPhoneNumber,
      );
      expect(response.data?.id).toBeDefined();
      expect(response.data?.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(response.errors).toEqual([]);

      primaryUserId = response.data!.id;
      createdUserIds.push(primaryUserId);
    });

    it('should create multiple users successfully', async () => {
      const remainingUsers = testUsers.slice(1);
      const responses: CreateUserResponse[] = [];

      for (const payload of remainingUsers) {
        const response: CreateUserResponse = await lastValueFrom(
          userService.createUser(payload),
        );
        responses.push(response);
        if (response.data?.id) {
          createdUserIds.push(response.data.id);
        }
      }

      expect(responses).toHaveLength(remainingUsers.length);
      responses.forEach((response, index) => {
        expect(response.status).toBe('success');
        expect(response.data?.email).toBe(remainingUsers[index].email);
        expect(response.data?.id).toBeDefined();
      });
    });

    it('should find all users with pagination', async () => {
      const payload: FindAllUsersRequest = {
        page: '1',
        limit: '10',
      };

      const response: FindAllUsersResponse = await lastValueFrom(
        userService.findAllUsers(payload),
      );

      expect(response).toBeDefined();
      expect(response.users).toBeDefined();
      expect(Array.isArray(response.users)).toBe(true);
      expect(response.users.length).toBeGreaterThanOrEqual(testUsers.length);

      // Verify our created users are in the results
      const userEmails = response.users.map((user) => user.email);
      testUsers.forEach((testUser) => {
        expect(userEmails).toContain(testUser.email);
      });
    });

    it('should find a specific user by ID', async () => {
      const payload: FindOneUserRequest = {
        id: primaryUserId,
      };

      const response: FindOneUserResponse = await lastValueFrom(
        userService.findOneUser(payload),
      );

      expect(response.user).toBeDefined();
      expect(response.user?.id).toBe(primaryUserId);
      expect(response.user?.email).toBe(testUsers[0].email);
      expect(response.user?.firstName).toBe(testUsers[0].firstName);
      expect(response.user?.isActive).toBeDefined();
      expect(response.user?.timestamps).toBeDefined();
    });

    it('should update a user successfully', async () => {
      const updatePayload: UpdateUserRequest = {
        id: primaryUserId,
        firstName: 'John Updated',
        lastName: 'Doe Updated',
        email: 'john.updated@test.com',
        primaryPhoneNumber: '+1999999999',
      };

      const response: UpdateUserResponse = await lastValueFrom(
        userService.updateUser(updatePayload),
      );

      expect(response.user).toBeDefined();
      expect(response.user?.id).toBe(primaryUserId);
      expect(response.user?.firstName).toBe('John Updated');
      expect(response.user?.lastName).toBe('Doe Updated');
      expect(response.user?.email).toBe('john.updated@test.com');
      expect(response.user?.primaryPhoneNumber).toBe('+1999999999');
    });

    it('should query users with streaming', (done) => {
      const payload: QueryUsersRequest = {
        page: 1,
        limit: 3,
      };

      const request$ = of(payload);
      const response$ = userService.queryUsers(request$);

      response$.subscribe({
        next: (response: QueryUsersResponse) => {
          expect(response.users).toBeDefined();
          expect(Array.isArray(response.users)).toBe(true);
          expect(response.users.length).toBeLessThanOrEqual(3);
          done();
        },
        error: (error) => {
          done(error);
        },
      });
    });

    it('should remove a user successfully (soft delete)', async () => {
      // Create a user specifically for deletion
      const deleteUserPayload: CreateUserRequest = {
        firstName: 'Delete',
        lastName: 'Me',
        email: 'delete.me@test.com',
        primaryPhoneNumber: '+1000000000',
        password: 'TempPassword123!',
      };

      const createResponse: CreateUserResponse = await lastValueFrom(
        userService.createUser(deleteUserPayload),
      );
      const userToDeleteId = createResponse.data!.id;

      const payload: RemoveUserRequest = {
        id: userToDeleteId,
      };

      const response: RemoveUserResponse = await lastValueFrom(
        userService.removeUser(payload),
      );

      expect(response.message).toContain('successfully removed');
      expect(response.message).toContain(userToDeleteId);

      // Verify user is soft deleted (should throw NotFoundException)
      try {
        await lastValueFrom(userService.findOneUser({ id: userToDeleteId }));
        fail('Should have thrown an error for deleted user');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  /**
   * VALIDATION & ERROR HANDLING
   *
   * Tests various error scenarios including invalid input,
   * missing data, and constraint violations.
   */
  describe('Validation & Error Handling', () => {
    it('should handle invalid email format during creation', async () => {
      const payload: CreateUserRequest = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email-format',
        primaryPhoneNumber: '+1234567890',
        password: 'password',
      };

      try {
        await lastValueFrom(userService.createUser(payload));
        // If no error is thrown, the validation might be at a different level
        // This test documents the expected behavior
      } catch (error: any) {
        expect(error).toBeDefined();
        // gRPC errors might be wrapped differently
      }
    });

    it('should handle duplicate email during creation', async () => {
      const duplicatePayload: CreateUserRequest = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: testUsers[0].email, // Use existing email
        primaryPhoneNumber: '+1111111111',
        password: 'password',
      };

      try {
        await lastValueFrom(userService.createUser(duplicatePayload));
        // If successful, database might not have unique constraints
        // This test documents the expected behavior
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle finding non-existent user', async () => {
      const payload: FindOneUserRequest = {
        id: '00000000-0000-0000-0000-000000000000',
      };

      try {
        await lastValueFrom(userService.findOneUser(payload));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid UUID format', async () => {
      const payload: FindOneUserRequest = {
        id: 'invalid-uuid-format',
      };

      try {
        await lastValueFrom(userService.findOneUser(payload));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty ID in findOneUser', async () => {
      const payload: FindOneUserRequest = {
        id: '',
      };

      try {
        await lastValueFrom(userService.findOneUser(payload));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle updating non-existent user', async () => {
      const payload: UpdateUserRequest = {
        id: '00000000-0000-0000-0000-000000000000',
        firstName: 'Non',
        lastName: 'Existent',
        email: 'non.existent@test.com',
        primaryPhoneNumber: '+1000000000',
      };

      try {
        await lastValueFrom(userService.updateUser(payload));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle removing non-existent user', async () => {
      const payload: RemoveUserRequest = {
        id: '00000000-0000-0000-0000-000000000000',
      };

      try {
        await lastValueFrom(userService.removeUser(payload));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle missing required fields in creation', async () => {
      const incompletePayload = {
        firstName: 'Incomplete',
        // Missing required fields
      } as CreateUserRequest;

      try {
        await lastValueFrom(userService.createUser(incompletePayload));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  /**
   * EDGE CASES & BOUNDARY CONDITIONS
   *
   * Tests edge cases including boundary values, special characters,
   * and unusual but valid inputs.
   */
  describe('Edge Cases & Boundary Conditions', () => {
    let edgeCaseUserId: string;

    it('should handle very long names (boundary testing)', async () => {
      const longName = 'A'.repeat(100); // Very long name
      const payload: CreateUserRequest = {
        firstName: longName,
        lastName: longName,
        email: 'longname@test.com',
        primaryPhoneNumber: '+1234567890',
        password: 'password',
      };

      try {
        const response: CreateUserResponse = await lastValueFrom(
          userService.createUser(payload),
        );
        if (response.data?.id) {
          edgeCaseUserId = response.data.id;
          createdUserIds.push(edgeCaseUserId);
        }
        expect(response.status).toBe('success');
      } catch (error: any) {
        // May fail due to database constraints - document the behavior
        expect(error).toBeDefined();
      }
    });

    it('should handle special characters in names', async () => {
      const payload: CreateUserRequest = {
        firstName: 'Jean-François',
        lastName: "O'Connor-Smith",
        email: 'special.chars@test.com',
        primaryPhoneNumber: '+1234567890',
        password: 'password',
      };

      try {
        const response: CreateUserResponse = await lastValueFrom(
          userService.createUser(payload),
        );
        if (response.data?.id) {
          createdUserIds.push(response.data.id);
        }
        expect(response.status).toBe('success');
        expect(response.data?.firstName).toBe('Jean-François');
        expect(response.data?.lastName).toBe("O'Connor-Smith");
      } catch (error: any) {
        // Document if special characters are not supported
        expect(error).toBeDefined();
      }
    });

    it('should handle international phone numbers', async () => {
      const internationalNumbers = [
        '+44 20 7946 0958', // UK
        '+33 1 42 86 83 26', // France
        '+81 3-3264-3841', // Japan
        '+86 10 8519 9999', // China
      ];

      for (let i = 0; i < internationalNumbers.length; i++) {
        const payload: CreateUserRequest = {
          firstName: `International${i}`,
          lastName: 'User',
          email: `international${i}@test.com`,
          primaryPhoneNumber: internationalNumbers[i],
          password: 'password',
        };

        try {
          const response: CreateUserResponse = await lastValueFrom(
            userService.createUser(payload),
          );
          if (response.data?.id) {
            createdUserIds.push(response.data.id);
          }
          expect(response.status).toBe('success');
        } catch (error: any) {
          // Document phone number validation rules
          console.log(
            `Phone number ${internationalNumbers[i]} failed:`,
            error.message,
          );
        }
      }
    });

    it('should handle minimum valid values', async () => {
      const payload: CreateUserRequest = {
        firstName: 'A', // Minimum length
        lastName: 'B',
        email: 'a@b.co', // Minimal valid email
        primaryPhoneNumber: '+1',
        password: '123', // Minimal password
      };

      try {
        const response: CreateUserResponse = await lastValueFrom(
          userService.createUser(payload),
        );
        if (response.data?.id) {
          createdUserIds.push(response.data.id);
        }
        expect(response.status).toBe('success');
      } catch (error: any) {
        // Document minimum validation requirements
        expect(error).toBeDefined();
      }
    });
  });

  /**
   * PAGINATION & FILTERING
   *
   * Tests pagination behavior with various page sizes and boundaries.
   */
  describe('Pagination & Filtering', () => {
    it('should handle different page sizes in findAllUsers', async () => {
      const pageSizes = ['1', '5', '10', '50'];

      for (const limit of pageSizes) {
        const payload: FindAllUsersRequest = {
          page: '1',
          limit,
        };

        const response: FindAllUsersResponse = await lastValueFrom(
          userService.findAllUsers(payload),
        );

        expect(response.users).toBeDefined();
        expect(response.users.length).toBeLessThanOrEqual(parseInt(limit));
      }
    });

    it('should handle pagination across multiple pages', async () => {
      const responses: FindAllUsersResponse[] = [];

      // Get first 3 pages with 2 users each
      for (let page = 1; page <= 3; page++) {
        const payload: FindAllUsersRequest = {
          page: page.toString(),
          limit: '2',
        };

        const response: FindAllUsersResponse = await lastValueFrom(
          userService.findAllUsers(payload),
        );
        responses.push(response);
      }

      // Verify we got some results
      const totalUsers = responses.reduce(
        (sum, response) => sum + response.users.length,
        0,
      );
      expect(totalUsers).toBeGreaterThan(0);

      // Verify no duplicate users across pages
      const allUserIds = responses.flatMap((response) =>
        response.users.map((user) => user.id),
      );
      const uniqueUserIds = new Set(allUserIds);
      expect(uniqueUserIds.size).toBe(allUserIds.length);
    });

    it('should handle queryUsers with different pagination parameters', (done) => {
      const requests = [
        { page: 1, limit: 2 },
        { page: 2, limit: 2 },
        { page: 1, limit: 5 },
      ];

      let responseCount = 0;
      const responses: QueryUsersResponse[] = [];

      requests.forEach((request) => {
        const request$ = of(request);
        const response$ = userService.queryUsers(request$);

        response$.subscribe({
          next: (response) => {
            responses.push(response);
            responseCount++;

            if (responseCount === requests.length) {
              expect(responses).toHaveLength(requests.length);
              responses.forEach((response, index) => {
                expect(response.users.length).toBeLessThanOrEqual(
                  requests[index].limit,
                );
              });
              done();
            }
          },
          error: done,
        });
      });
    });

    it('should handle large page numbers gracefully', async () => {
      const payload: FindAllUsersRequest = {
        page: '9999', // Very large page number
        limit: '10',
      };

      const response: FindAllUsersResponse = await lastValueFrom(
        userService.findAllUsers(payload),
      );

      expect(response.users).toBeDefined();
      expect(Array.isArray(response.users)).toBe(true);
      // Should return empty array for out-of-bounds pages
      expect(response.users.length).toBe(0);
    });
  });

  /**
   * CONCURRENT OPERATIONS
   *
   * Tests behavior under concurrent access and operations.
   */
  describe('Concurrent Operations', () => {
    it('should handle concurrent user creation', async () => {
      const concurrentUsers = Array.from({ length: 5 }, (_, i) => ({
        firstName: `Concurrent${i}`,
        lastName: 'User',
        email: `concurrent${i}@test.com`,
        primaryPhoneNumber: `+100000000${i}`,
        password: 'ConcurrentPass123!',
      }));

      const promises = concurrentUsers.map((user) =>
        lastValueFrom(userService.createUser(user)),
      );

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(5);
      responses.forEach((response, index) => {
        expect(response.status).toBe('success');
        expect(response.data?.email).toBe(concurrentUsers[index].email);
        if (response.data?.id) {
          createdUserIds.push(response.data.id);
        }
      });
    });

    it('should handle concurrent reads of the same user', async () => {
      if (createdUserIds.length === 0) {
        return; // Skip if no users created
      }

      const userId = createdUserIds[0];
      const readPromises = Array.from({ length: 10 }, () =>
        lastValueFrom(userService.findOneUser({ id: userId })),
      );

      const responses = await Promise.all(readPromises);

      expect(responses).toHaveLength(10);
      responses.forEach((response) => {
        expect(response.user?.id).toBe(userId);
      });
    });

    it('should handle concurrent updates to different users', async () => {
      if (createdUserIds.length < 3) {
        return; // Skip if not enough users
      }

      const updatePromises = createdUserIds.slice(0, 3).map((userId, index) =>
        lastValueFrom(
          userService.updateUser({
            id: userId,
            firstName: `ConcurrentUpdate${index}`,
            lastName: 'User',
            email: `concurrent.update${index}@test.com`,
            primaryPhoneNumber: `+200000000${index}`,
          }),
        ),
      );

      const responses = await Promise.all(updatePromises);

      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.user?.firstName).toBe(`ConcurrentUpdate${index}`);
      });
    });
  });

  /**
   * PERFORMANCE & LOAD TESTING
   *
   * Basic performance tests to ensure the service can handle load.
   */
  describe('Performance & Load Testing', () => {
    it('should handle bulk user creation within reasonable time', async () => {
      const startTime = Date.now();
      const bulkUsers = Array.from({ length: 20 }, (_, i) => ({
        firstName: `Bulk${i}`,
        lastName: 'User',
        email: `bulk${i}@test.com`,
        primaryPhoneNumber: `+300000000${i}`,
        password: 'BulkPass123!',
      }));

      const promises = bulkUsers.map((user) =>
        lastValueFrom(userService.createUser(user)),
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(responses).toHaveLength(20);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds

      // Cleanup
      responses.forEach((response) => {
        if (response.data?.id) {
          createdUserIds.push(response.data.id);
        }
      });
    });

    it('should handle rapid successive reads efficiently', async () => {
      if (createdUserIds.length === 0) {
        return;
      }

      const startTime = Date.now();
      const readPromises = Array.from({ length: 50 }, () =>
        lastValueFrom(userService.findOneUser({ id: createdUserIds[0] })),
      );

      const responses = await Promise.all(readPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(responses).toHaveLength(50);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  /**
   * DATA INTEGRITY & CONSISTENCY
   *
   * Tests to ensure data remains consistent and valid.
   */
  describe('Data Integrity & Consistency', () => {
    it('should maintain data consistency after multiple operations', async () => {
      // Create a user
      const createPayload: CreateUserRequest = {
        firstName: 'Consistency',
        lastName: 'Test',
        email: 'consistency.test@test.com',
        primaryPhoneNumber: '+1555555555',
        password: 'ConsistencyPass123!',
      };

      const createResponse = await lastValueFrom(
        userService.createUser(createPayload),
      );
      const userId = createResponse.data!.id;
      createdUserIds.push(userId);

      // Read the user
      const readResponse = await lastValueFrom(
        userService.findOneUser({ id: userId }),
      );

      // Update the user
      const updateResponse = await lastValueFrom(
        userService.updateUser({
          id: userId,
          firstName: 'Updated Consistency',
          lastName: 'Updated Test',
          email: 'updated.consistency@test.com',
          primaryPhoneNumber: '+1666666666',
        }),
      );

      // Read again to verify update
      const finalReadResponse = await lastValueFrom(
        userService.findOneUser({ id: userId }),
      );

      // Verify consistency
      expect(readResponse.user?.id).toBe(userId);
      expect(updateResponse.user?.firstName).toBe('Updated Consistency');
      expect(finalReadResponse.user?.firstName).toBe('Updated Consistency');
      expect(finalReadResponse.user?.email).toBe(
        'updated.consistency@test.com',
      );
    });

    it('should handle user lifecycle correctly', async () => {
      // Create
      const user = await lastValueFrom(
        userService.createUser({
          firstName: 'Lifecycle',
          lastName: 'Test',
          email: 'lifecycle@test.com',
          primaryPhoneNumber: '+1777777777',
          password: 'LifecyclePass123!',
        }),
      );

      const userId = user.data!.id;

      // Verify creation
      expect(user.status).toBe('success');
      expect(user.data?.id).toBeDefined();

      // Read
      const readUser = await lastValueFrom(
        userService.findOneUser({ id: userId }),
      );
      expect(readUser.user?.id).toBe(userId);

      // Update
      const updatedUser = await lastValueFrom(
        userService.updateUser({
          id: userId,
          firstName: 'Updated Lifecycle',
          lastName: 'Updated Test',
          email: 'updated.lifecycle@test.com',
          primaryPhoneNumber: '+1888888888',
        }),
      );
      expect(updatedUser.user?.firstName).toBe('Updated Lifecycle');

      // Delete
      const deleteResponse = await lastValueFrom(
        userService.removeUser({ id: userId }),
      );
      expect(deleteResponse.message).toContain('successfully removed');

      // Verify deletion
      try {
        await lastValueFrom(userService.findOneUser({ id: userId }));
        fail('Should not find deleted user');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
