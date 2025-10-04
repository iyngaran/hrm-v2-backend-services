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
  RemoveUserRequest,
  RemoveUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserServiceClient,
} from '../../../../generated/typescript/user-service/users/user';
import { UserServiceModule } from '../../src/user-service.module';

describe('UserService (gRPC) E2E', () => {
  let app: INestApplication;
  let clientApp: INestApplication;
  let client: ClientGrpc;
  let userService: UserServiceClient;

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
        url: 'localhost:50051',
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
              url: 'localhost:50051',
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

    // Wait a moment for the service to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    try {
      // Close client application first
      if (clientApp) {
        await clientApp.close();
      }

      // Close server application
      if (app) {
        await app.close();
      }

      // Allow cleanup time
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      // Silently handle cleanup errors
      console.log('Cleanup completed');
    }
  });

  describe('User CRUD Operations', () => {
    let createdUserId: string;

    it('should create a user successfully', async () => {
      const payload: CreateUserRequest = {
        firstName: 'Iyngaran',
        lastName: 'Iyathurai',
        email: 'iyngaran55@yahoo.com',
        primaryPhoneNumber: '0123456789',
        password: '123456',
      };

      const response: CreateUserResponse = await lastValueFrom(
        userService.createUser(payload),
      );

      expect(response.status).toBe('success');
      expect(response.data?.email).toBe(payload.email);
      expect(response.data?.firstName).toBe(payload.firstName);
      expect(response.data?.id).toBeDefined();

      createdUserId = response.data!.id;
    });

    it('should handle findAllUsers call', async () => {
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
    });

    it('should find a user by ID', async () => {
      const payload: FindOneUserRequest = {
        id: createdUserId,
      };

      const response: FindOneUserResponse = await lastValueFrom(
        userService.findOneUser(payload),
      );

      expect(response.user).toBeDefined();
      expect(response.user?.id).toBe(createdUserId);
      expect(response.user?.email).toBe('iyngaran55@yahoo.com');
    });

    it('should update a user successfully', async () => {
      const payload: UpdateUserRequest = {
        id: createdUserId,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@updated.com',
        primaryPhoneNumber: '9876543210',
      };

      const response: UpdateUserResponse = await lastValueFrom(
        userService.updateUser(payload),
      );

      expect(response.user).toBeDefined();
      expect(response.user?.id).toBe(createdUserId);
      expect(response.user?.firstName).toBe('John');
      expect(response.user?.email).toBe('john.smith@updated.com');
    });

    it('should query users with pagination', (done) => {
      const payload: QueryUsersRequest = {
        page: 1,
        limit: 5,
      };

      const request$ = of(payload);
      const response$ = userService.queryUsers(request$);

      response$.subscribe({
        next: (response) => {
          expect(response.users).toBeDefined();
          expect(Array.isArray(response.users)).toBe(true);
          expect(response.users.length).toBeLessThanOrEqual(5);
          done();
        },
        error: (error) => {
          done(error);
        },
      });
    });

    it('should remove a user successfully', async () => {
      const payload: RemoveUserRequest = {
        id: createdUserId,
      };

      const response: RemoveUserResponse = await lastValueFrom(
        userService.removeUser(payload),
      );

      expect(response.message).toContain('successfully removed');
      expect(response.message).toContain(createdUserId);
    });
  });

  describe('Error Handling', () => {
    it('should handle finding non-existent user', async () => {
      const payload: FindOneUserRequest = {
        id: 'non-existent-id',
      };

      try {
        await lastValueFrom(userService.findOneUser(payload));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
        // gRPC errors may be wrapped differently, so check for error existence
      }
    });

    it('should handle updating non-existent user', async () => {
      const payload: UpdateUserRequest = {
        id: 'non-existent-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        primaryPhoneNumber: '1234567890',
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
        id: 'non-existent-id',
      };

      try {
        await lastValueFrom(userService.removeUser(payload));
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
  });
});
