import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { of, throwError } from 'rxjs';
import { User } from '../../../../../generated/typescript/user-service/users/types';
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
} from '../../../../../generated/typescript/user-service/users/user';
import { GenericConfigService } from '../../../../../libs/src';
import { UsersController } from '../controllers/users.controller';
import { User as UserEntity } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // Helper function to create complete User objects
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    primaryPhoneNumber: '+1234567890',
    phoneNumbers: ['+1234567890'],
    password: 'hashedPassword',
    isActive: true,
    isEmailVerified: false,
    isMfaEnabled: false,
    roles: [],
    timestamps: {
      createdAt: { seconds: Math.floor(Date.now() / 1000) as any, nanos: 0 },
      updatedAt: { seconds: Math.floor(Date.now() / 1000) as any, nanos: 0 },
    },
    ...overrides,
  });

  // Mock implementations
  const mockUserRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockPinoLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, string | number> = {
        USER_SERVICE_DB_HOST: 'localhost',
        NODE_ENV: 'test',
        USER_SERVICE_DB_PORT: 5432,
        USER_SERVICE_DB_USERNAME: 'test',
        USER_SERVICE_DB_PASSWORD: 'test',
        USER_SERVICE_DB_NAME: 'test_db',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
        },
        {
          provide: GenericConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * CONTROLLER INITIALIZATION TESTS
   */
  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have UsersService injected', () => {
      expect(service).toBeDefined();
    });

    it('should be an instance of UsersController', () => {
      expect(controller).toBeInstanceOf(UsersController);
    });
  });

  /**
   * CREATE USER CONTROLLER TESTS
   */
  describe('createUser', () => {
    it('should call service.createUser with correct parameters and return response', async () => {
      // Arrange
      const createUserRequest: CreateUserRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'securePassword123',
      };

      const mockResponse: CreateUserResponse = {
        status: 'success',
        message: 'User created successfully',
        data: createMockUser({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          primaryPhoneNumber: '+1234567890',
        }),
        errors: [],
      };

      jest.spyOn(service, 'createUser').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.createUser(createUserRequest);

      // Assert
      expect(service.createUser).toHaveBeenCalledWith(createUserRequest);
      expect(service.createUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle service errors', async () => {
      const createUserRequest: CreateUserRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'securePassword123',
      };

      const serviceError = new Error('Database connection failed');
      jest.spyOn(service, 'createUser').mockRejectedValue(serviceError);

      await expect(controller.createUser(createUserRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  /**
   * FIND ALL USERS CONTROLLER TESTS
   */
  describe('findAllUsers', () => {
    it('should call service.findAllUsers and return response', async () => {
      const findAllRequest: FindAllUsersRequest = {
        page: '1',
        limit: '10',
      };

      const mockResponse: FindAllUsersResponse = {
        users: [
          createMockUser({ id: '1', firstName: 'John' }),
          createMockUser({
            id: '2',
            firstName: 'Jane',
            email: 'jane@example.com',
          }),
        ],
      };

      jest.spyOn(service, 'findAllUsers').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAllUsers(findAllRequest);

      // Assert
      expect(service.findAllUsers).toHaveBeenCalledWith(findAllRequest);
      expect(result).toEqual(mockResponse);
      const resolvedResult = result as FindAllUsersResponse;
      expect(resolvedResult.users).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      const findAllRequest: FindAllUsersRequest = {
        page: '1',
        limit: '10',
      };

      const mockResponse: FindAllUsersResponse = {
        users: [],
      };

      jest.spyOn(service, 'findAllUsers').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAllUsers(findAllRequest);

      // Assert
      const resolvedResult = result as FindAllUsersResponse;
      expect(resolvedResult.users).toEqual([]);
    });
  });

  /**
   * FIND ONE USER CONTROLLER TESTS
   */
  describe('findOneUser', () => {
    it('should call service.findOneUser and return user', async () => {
      const findOneRequest: FindOneUserRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockResponse: FindOneUserResponse = {
        user: createMockUser({
          id: '123e4567-e89b-12d3-a456-426614174000',
        }),
      };

      jest.spyOn(service, 'findOneUser').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findOneUser(findOneRequest);

      // Assert
      expect(service.findOneUser).toHaveBeenCalledWith(findOneRequest);
      expect(result).toEqual(mockResponse);
      const resolvedResult = result as FindOneUserResponse;
      expect(resolvedResult.user?.id).toBe(findOneRequest.id);
    });

    it('should handle NotFoundException', async () => {
      const findOneRequest: FindOneUserRequest = {
        id: 'non-existent-id',
      };

      jest
        .spyOn(service, 'findOneUser')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.findOneUser(findOneRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * UPDATE USER CONTROLLER TESTS
   */
  describe('updateUser', () => {
    it('should call service.updateUser and return updated user', async () => {
      const updateRequest: UpdateUserRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        primaryPhoneNumber: '0987654321',
      };

      const mockResponse: UpdateUserResponse = {
        user: createMockUser({
          id: '123e4567-e89b-12d3-a456-426614174000',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          primaryPhoneNumber: '0987654321',
        }),
      };

      jest.spyOn(service, 'updateUser').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateUser(updateRequest);

      // Assert
      expect(service.updateUser).toHaveBeenCalledWith(updateRequest);
      expect(result).toEqual(mockResponse);
      const resolvedResult = result as UpdateUserResponse;
      expect(resolvedResult.user?.firstName).toBe('Jane');
    });

    it('should handle NotFoundException for non-existent user', async () => {
      const updateRequest: UpdateUserRequest = {
        id: 'non-existent-id',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        primaryPhoneNumber: '+1234567890',
      };

      jest
        .spyOn(service, 'updateUser')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.updateUser(updateRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * REMOVE USER CONTROLLER TESTS
   */
  describe('removeUser', () => {
    it('should call service.removeUser and return confirmation', async () => {
      const removeRequest: RemoveUserRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockResponse: RemoveUserResponse = {
        message: `User with ID ${removeRequest.id} has been successfully removed`,
      };

      jest.spyOn(service, 'removeUser').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.removeUser(removeRequest);

      // Assert
      expect(service.removeUser).toHaveBeenCalledWith(removeRequest);
      expect(result).toEqual(mockResponse);
      const resolvedResult = result as RemoveUserResponse;
      expect(resolvedResult.message).toContain('successfully removed');
    });

    it('should handle NotFoundException', async () => {
      const removeRequest: RemoveUserRequest = {
        id: 'non-existent-id',
      };

      jest
        .spyOn(service, 'removeUser')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.removeUser(removeRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * QUERY USERS CONTROLLER TESTS
   */
  describe('queryUsers', () => {
    it('should call service.queryUsers with Observable', (done) => {
      const queryRequest: QueryUsersRequest = {
        page: 1,
        limit: 5,
      };

      const mockResponse: QueryUsersResponse = {
        users: [createMockUser({ id: '1', firstName: 'John' })],
      };

      const request$ = of(queryRequest);
      const response$ = of(mockResponse);

      jest.spyOn(service, 'queryUsers').mockReturnValue(response$);

      // Act
      const result$ = controller.queryUsers(request$);

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(result.users).toHaveLength(1);
          done();
        },
        error: done,
      });
    });

    it('should handle Observable errors', (done) => {
      const queryRequest: QueryUsersRequest = {
        page: 1,
        limit: 5,
      };

      const request$ = of(queryRequest);
      const error$ = throwError(() => new Error('Stream error'));

      jest.spyOn(service, 'queryUsers').mockReturnValue(error$);

      const result$ = controller.queryUsers(request$);

      result$.subscribe({
        next: () => done(new Error('Should not emit values')),
        error: (error) => {
          expect(error.message).toBe('Stream error');
          done();
        },
      });
    });
  });

  /**
   * INTEGRATION TESTS
   */
  describe('Integration Tests', () => {
    it('should handle service dependencies correctly', () => {
      expect(controller).toBeDefined();
      expect(service).toBeDefined();
      expect(controller['usersService']).toBe(service);
    });

    it('should propagate all service method calls correctly', async () => {
      const createRequest: CreateUserRequest = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'password',
      };

      const findAllRequest: FindAllUsersRequest = { page: '1', limit: '10' };
      const findOneRequest: FindOneUserRequest = { id: 'test-id' };
      const updateRequest: UpdateUserRequest = {
        id: 'test-id',
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@example.com',
        primaryPhoneNumber: '+9876543210',
      };
      const removeRequest: RemoveUserRequest = { id: 'test-id' };
      const queryRequest$ = of({ page: 1, limit: 10 });

      // Mock all service methods
      jest.spyOn(service, 'createUser').mockResolvedValue({} as any);
      jest.spyOn(service, 'findAllUsers').mockResolvedValue({} as any);
      jest.spyOn(service, 'findOneUser').mockResolvedValue({} as any);
      jest.spyOn(service, 'updateUser').mockResolvedValue({} as any);
      jest.spyOn(service, 'removeUser').mockResolvedValue({} as any);
      jest.spyOn(service, 'queryUsers').mockReturnValue(of({} as any));

      // Act
      await controller.createUser(createRequest);
      await controller.findAllUsers(findAllRequest);
      await controller.findOneUser(findOneRequest);
      await controller.updateUser(updateRequest);
      await controller.removeUser(removeRequest);
      controller.queryUsers(queryRequest$);

      // Assert
      expect(service.createUser).toHaveBeenCalledWith(createRequest);
      expect(service.findAllUsers).toHaveBeenCalledWith(findAllRequest);
      expect(service.findOneUser).toHaveBeenCalledWith(findOneRequest);
      expect(service.updateUser).toHaveBeenCalledWith(updateRequest);
      expect(service.removeUser).toHaveBeenCalledWith(removeRequest);
      expect(service.queryUsers).toHaveBeenCalledWith(queryRequest$);
    });
  });
});
