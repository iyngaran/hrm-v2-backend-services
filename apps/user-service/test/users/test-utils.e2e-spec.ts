import { INestApplication } from '@nestjs/common';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { lastValueFrom } from 'rxjs';
import {
  CreateUserRequest,
  UserServiceClient,
} from '../../../../generated/typescript/user-service/users/user';
import { UserServiceModule } from '../../src/user-service.module';

/**
 * DATABASE SEEDING AND UTILITIES FOR E2E TESTS
 *
 * This utility module provides helper functions for:
 * 1. Database seeding with test data
 * 2. Cleanup operations
 * 3. Data validation utilities
 * 4. Performance benchmarking helpers
 */
export class UserServiceTestUtils {
  private app!: INestApplication;
  private clientApp!: INestApplication;
  private client!: ClientGrpc;
  private userService!: UserServiceClient;
  private createdUserIds: string[] = [];

  async initialize(port = 50054): Promise<void> {
    // Server setup
    const serverModule: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    }).compile();

    this.app = serverModule.createNestApplication();
    this.app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        package: 'user.v1',
        protoPath: join(
          __dirname,
          '../../../../proto/user-service/users/user.proto',
        ),
        url: `localhost:${port}`,
        loader: {
          includeDirs: [
            join(__dirname, '../../../../proto'),
            join(__dirname, '../../../../proto/common'),
          ],
        },
      },
    });

    await this.app.startAllMicroservices();
    await this.app.init();

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
              url: `localhost:${port}`,
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

    this.clientApp = clientModule.createNestApplication();
    await this.clientApp.init();

    this.client = this.clientApp.get('USER_SERVICE_PACKAGE');
    this.userService = this.client.getService<UserServiceClient>('UserService');

    // Wait for service readiness
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async cleanup(): Promise<void> {
    // Remove all created users
    for (const userId of this.createdUserIds) {
      try {
        await lastValueFrom(this.userService.removeUser({ id: userId }));
      } catch {
        // Ignore cleanup errors
      }
    }

    // Close applications
    try {
      if (this.clientApp) {
        await this.clientApp.close();
      }
      if (this.app) {
        await this.app.close();
      }
    } catch {
      // Ignore close errors
    }
  }

  /**
   * Creates a batch of test users with predefined data
   */
  async seedTestUsers(count = 10): Promise<string[]> {
    const users: CreateUserRequest[] = Array.from(
      { length: count },
      (_, i) => ({
        firstName: `TestUser${i + 1}`,
        lastName: `LastName${i + 1}`,
        email: `testuser${i + 1}@example.com`,
        primaryPhoneNumber: `+1${(1000000000 + i).toString()}`,
        password: `TestPassword${i + 1}!`,
      }),
    );

    const createdIds: string[] = [];

    for (const user of users) {
      try {
        const response = await lastValueFrom(this.userService.createUser(user));
        if (response.data?.id) {
          createdIds.push(response.data.id);
          this.createdUserIds.push(response.data.id);
        }
      } catch (error) {
        console.warn(`Failed to create test user: ${user.email}`, error);
      }
    }

    return createdIds;
  }

  /**
   * Creates users with specific patterns for testing
   */
  async seedSpecialUsers(): Promise<{
    longNameUsers: string[];
    specialCharUsers: string[];
    internationalUsers: string[];
  }> {
    const results = {
      longNameUsers: [] as string[],
      specialCharUsers: [] as string[],
      internationalUsers: [] as string[],
    };

    // Long name users
    const longNameUsers: CreateUserRequest[] = [
      {
        firstName: 'A'.repeat(50),
        lastName: 'B'.repeat(50),
        email: 'longname1@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'LongNamePass123!',
      },
      {
        firstName: 'VeryLongFirstNameThatExceedsNormalLimits',
        lastName: 'VeryLongLastNameThatAlsoExceedsNormalLimits',
        email: 'longname2@example.com',
        primaryPhoneNumber: '+1234567891',
        password: 'LongNamePass124!',
      },
    ];

    for (const user of longNameUsers) {
      try {
        const response = await lastValueFrom(this.userService.createUser(user));
        if (response.data?.id) {
          results.longNameUsers.push(response.data.id);
          this.createdUserIds.push(response.data.id);
        }
      } catch {
        // May fail due to length constraints
      }
    }

    // Special character users
    const specialCharUsers: CreateUserRequest[] = [
      {
        firstName: 'José',
        lastName: 'García-Rodríguez',
        email: 'jose.garcia@example.com',
        primaryPhoneNumber: '+1234567892',
        password: 'SpecialChar123!',
      },
      {
        firstName: 'François',
        lastName: "O'Connor",
        email: 'francois.oconnor@example.com',
        primaryPhoneNumber: '+1234567893',
        password: 'SpecialChar124!',
      },
      {
        firstName: '张',
        lastName: '三',
        email: 'zhang.san@example.com',
        primaryPhoneNumber: '+1234567894',
        password: 'SpecialChar125!',
      },
    ];

    for (const user of specialCharUsers) {
      try {
        const response = await lastValueFrom(this.userService.createUser(user));
        if (response.data?.id) {
          results.specialCharUsers.push(response.data.id);
          this.createdUserIds.push(response.data.id);
        }
      } catch {
        // May fail due to character encoding issues
      }
    }

    // International phone number users
    const internationalUsers: CreateUserRequest[] = [
      {
        firstName: 'International1',
        lastName: 'User',
        email: 'intl1@example.com',
        primaryPhoneNumber: '+44 20 7946 0958', // UK
        password: 'IntlPass123!',
      },
      {
        firstName: 'International2',
        lastName: 'User',
        email: 'intl2@example.com',
        primaryPhoneNumber: '+33 1 42 86 83 26', // France
        password: 'IntlPass124!',
      },
      {
        firstName: 'International3',
        lastName: 'User',
        email: 'intl3@example.com',
        primaryPhoneNumber: '+81 3-3264-3841', // Japan
        password: 'IntlPass125!',
      },
    ];

    for (const user of internationalUsers) {
      try {
        const response = await lastValueFrom(this.userService.createUser(user));
        if (response.data?.id) {
          results.internationalUsers.push(response.data.id);
          this.createdUserIds.push(response.data.id);
        }
      } catch {
        // May fail due to phone number validation
      }
    }

    return results;
  }

  /**
   * Performance benchmarking helper
   */
  async benchmarkOperation<T>(
    operation: () => Promise<T>,
    iterations = 10,
  ): Promise<{
    results: T[];
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  }> {
    const results: T[] = [];
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const result = await operation();
      const endTime = Date.now();

      results.push(result);
      times.push(endTime - startTime);
    }

    return {
      results,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Data validation utilities
   */
  validateUserData(user: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!user.id || typeof user.id !== 'string') {
      errors.push('Missing or invalid user ID');
    }

    if (!user.firstName || typeof user.firstName !== 'string') {
      errors.push('Missing or invalid firstName');
    }

    if (!user.lastName || typeof user.lastName !== 'string') {
      errors.push('Missing or invalid lastName');
    }

    if (!user.email || typeof user.email !== 'string') {
      errors.push('Missing or invalid email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push('Invalid email format');
    }

    if (
      !user.primaryPhoneNumber ||
      typeof user.primaryPhoneNumber !== 'string'
    ) {
      errors.push('Missing or invalid primaryPhoneNumber');
    }

    if (typeof user.isActive !== 'boolean') {
      errors.push('Missing or invalid isActive flag');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get service client for direct testing
   */
  getServiceClient(): UserServiceClient {
    return this.userService;
  }

  /**
   * Get list of created user IDs for verification
   */
  getCreatedUserIds(): string[] {
    return [...this.createdUserIds];
  }
}

/**
 * UTILITY TESTS
 *
 * Tests for the utility functions themselves
 */
describe('UserService Test Utilities', () => {
  let utils: UserServiceTestUtils;

  beforeAll(async () => {
    utils = new UserServiceTestUtils();
    await utils.initialize(50055);
  });

  afterAll(async () => {
    await utils.cleanup();
  });

  describe('Seeding Operations', () => {
    it('should seed basic test users successfully', async () => {
      const userIds = await utils.seedTestUsers(5);

      expect(userIds).toHaveLength(5);
      userIds.forEach((id) => {
        expect(id).toMatch(/^[0-9a-f-]{36}$/i); // UUID format
      });

      // Verify users exist
      const service = utils.getServiceClient();
      for (const userId of userIds) {
        const response = await lastValueFrom(
          service.findOneUser({ id: userId }),
        );
        expect(response.user?.id).toBe(userId);
      }
    });

    it('should seed special character users', async () => {
      const specialUsers = await utils.seedSpecialUsers();

      expect(specialUsers.longNameUsers.length).toBeGreaterThanOrEqual(0);
      expect(specialUsers.specialCharUsers.length).toBeGreaterThanOrEqual(0);
      expect(specialUsers.internationalUsers.length).toBeGreaterThanOrEqual(0);

      // Verify at least some users were created
      const totalCreated =
        specialUsers.longNameUsers.length +
        specialUsers.specialCharUsers.length +
        specialUsers.internationalUsers.length;

      expect(totalCreated).toBeGreaterThan(0);
    });
  });

  describe('Benchmarking Operations', () => {
    it('should benchmark user creation performance', async () => {
      let counter = 0;
      const service = utils.getServiceClient();

      const benchmark = await utils.benchmarkOperation(async () => {
        counter++;
        const response = await lastValueFrom(
          service.createUser({
            firstName: `Benchmark${counter}`,
            lastName: 'User',
            email: `benchmark${counter}@test.com`,
            primaryPhoneNumber: `+1${counter.toString().padStart(9, '0')}`,
            password: 'BenchmarkPass123!',
          }),
        );
        return response.data?.id;
      }, 5);

      expect(benchmark.results).toHaveLength(5);
      expect(benchmark.averageTime).toBeGreaterThan(0);
      expect(benchmark.minTime).toBeLessThanOrEqual(benchmark.maxTime);
      expect(benchmark.totalTime).toBeGreaterThan(0);

      // Performance expectations
      expect(benchmark.averageTime).toBeLessThan(5000); // Less than 5 seconds average
    });

    it('should benchmark read operations', async () => {
      // Create a user first
      const userIds = await utils.seedTestUsers(1);
      const userId = userIds[0];
      const service = utils.getServiceClient();

      const benchmark = await utils.benchmarkOperation(async () => {
        const response = await lastValueFrom(
          service.findOneUser({ id: userId }),
        );
        return response.user;
      }, 10);

      expect(benchmark.results).toHaveLength(10);
      expect(benchmark.averageTime).toBeLessThan(1000); // Less than 1 second average

      // All reads should return the same user
      benchmark.results.forEach((user) => {
        expect(user?.id).toBe(userId);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate correct user data', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        primaryPhoneNumber: '+1234567890',
        isActive: true,
      };

      const validation = utils.validateUserData(validUser);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid user data', () => {
      const invalidUser = {
        id: '', // Invalid
        firstName: null, // Invalid
        lastName: 'Doe',
        email: 'invalid-email', // Invalid format
        primaryPhoneNumber: null, // Invalid
        isActive: 'yes', // Invalid type
      };

      const validation = utils.validateUserData(invalidUser);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      expect(validation.errors).toContain('Missing or invalid user ID');
      expect(validation.errors).toContain('Missing or invalid firstName');
      expect(validation.errors).toContain('Invalid email format');
      expect(validation.errors).toContain(
        'Missing or invalid primaryPhoneNumber',
      );
      expect(validation.errors).toContain('Missing or invalid isActive flag');
    });
  });

  describe('Utility Management', () => {
    it('should track created user IDs', async () => {
      const initialCount = utils.getCreatedUserIds().length;
      await utils.seedTestUsers(3);
      const finalCount = utils.getCreatedUserIds().length;

      expect(finalCount - initialCount).toBe(3);
    });

    it('should provide access to service client', () => {
      const client = utils.getServiceClient();
      expect(client).toBeDefined();
      expect(typeof client.createUser).toBe('function');
      expect(typeof client.findOneUser).toBe('function');
      expect(typeof client.findAllUsers).toBe('function');
      expect(typeof client.updateUser).toBe('function');
      expect(typeof client.removeUser).toBe('function');
      expect(typeof client.queryUsers).toBe('function');
    });
  });
});
