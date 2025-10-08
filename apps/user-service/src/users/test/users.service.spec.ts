import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { of } from 'rxjs';
import {
  CreateUserRequest,
  FindAllUsersRequest,
  FindOneUserRequest,
  QueryUsersRequest,
  RemoveUserRequest,
  UpdateUserRequest,
} from '../../../../../generated/typescript/user-service/users/user';
import { GenericConfigService } from '../../../../../libs/src';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

describe('UsersService', () => {
  let service: UsersService;

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
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
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

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BASIC DEFINITION TEST
   *
   * This test ensures that the UsersService is properly defined and instantiated
   * within the testing module, confirming that all dependencies are correctly injected.
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * SERVICE INITIALIZATION TESTS
   *
   * This test suite ensures that the UsersService initializes correctly by:
   * - Setting the appropriate logging context using PinoLogger
   * - Fetching and logging essential configuration values (DB host, environment)
   * - Verifying that dependencies (repository, logger, config service) are injected properly
   */

  it('should initialize with proper context and configuration', () => {
    expect(mockPinoLogger.setContext).toHaveBeenCalledWith('UsersService');
    expect(mockPinoLogger.info).toHaveBeenCalledWith(
      'Service initialized with DB Host: %s, Environment: %s',
      'localhost',
      'test',
    );
    expect(mockConfigService.get).toHaveBeenCalledWith('USER_SERVICE_DB_HOST');
    expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
  });

  /**
   * CREATE USER TESTS
   *
   * This test suite validates the user creation functionality which:
   * - Accepts CreateUserRequest with user details (firstName, lastName, email, phone, password)
   * - Saves user data to the database via TypeORM repository
   * - Returns a standardized response with status, message, data, and errors
   * - Handles database errors gracefully and propagates them
   * - Logs creation attempts and successful operations for audit trail
   *
   * Key behaviors tested:
   * - Successful user creation with proper response structure
   * - Error propagation when repository operations fail
   * - Logging behavior during both success and failure scenarios
   */
  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const createUserRequest: CreateUserRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'securePassword123',
      };

      const savedUser = {
        id: '1',
        firstName: 'John',
        email: 'john.doe@example.com',
        primaryPhoneNumber: '+1234567890',
        phoneNumbers: ['+1234567890'],
        password: 'securePassword123',
        timestamps: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      mockUserRepository.save.mockResolvedValue(savedUser);

      // Act
      const result = await service.createUser(createUserRequest);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalledWith(createUserRequest);
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        'Creating user with request: %o',
        createUserRequest,
      );
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        'User created successfully: %o',
        savedUser,
      );
      expect(result).toEqual({
        status: 'success',
        message: 'User created successfully',
        data: savedUser,
        errors: [],
      });
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const createUserRequest: CreateUserRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'securePassword123',
      };

      const repositoryError = new Error('Database connection failed');
      mockUserRepository.save.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.createUser(createUserRequest)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(createUserRequest);
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        'Creating user with request: %o',
        createUserRequest,
      );
    });
  });

  /**
   * FIND ALL USERS TESTS
   *
   * This test suite validates the findAllUsers functionality which:
   * - Accepts FindAllUsersRequest with pagination parameters (page, limit)
   * - Retrieves all users from the database using TypeORM find method
   * - Returns users array wrapped in a response object
   * - Handles empty result sets gracefully
   * - Logs retrieval operations for monitoring and debugging
   *
   * Key behaviors tested:
   * - Successful retrieval of multiple users with pagination
   * - Handling of empty result sets (no users found)
   * - Proper logging of find operations
   * - Response structure consistency
   */
  describe('findAllUsers', () => {
    it('should find all users successfully', async () => {
      // Arrange
      const findAllRequest: FindAllUsersRequest = {
        page: '1',
        limit: '10',
      };

      const mockUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          primaryPhoneNumber: '+1234567890',
          phoneNumbers: ['+1234567890'],
          password: 'hashedPassword',
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);

      // Act
      const result = await service.findAllUsers(findAllRequest);

      // Assert
      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(mockPinoLogger.info).toHaveBeenCalledWith('Finding all users');
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        'All users found successfully: %o',
        mockUsers,
      );
      expect(result).toEqual({
        users: mockUsers,
      });
    });

    it('should handle empty result', async () => {
      // Arrange
      const findAllRequest: FindAllUsersRequest = {
        page: '1',
        limit: '10',
      };

      mockUserRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAllUsers(findAllRequest);

      // Assert
      expect(result.users).toEqual([]);
    });
  });

  /**
   * FIND ONE USER TESTS
   *
   * This test suite validates the findOneUser functionality which:
   * - Accepts FindOneUserRequest with user ID for lookup
   * - Queries database using TypeORM findOne with where clause
   * - Returns single user wrapped in response object when found
   * - Throws NotFoundException when user doesn't exist
   * - Throws BadRequestException for invalid/missing IDs
   * - Logs successful lookups and warns about missing users
   *
   * Key behaviors tested:
   * - Successful user retrieval by valid ID
   * - NotFoundException handling for non-existent users
   * - BadRequestException for empty/invalid IDs
   * - Proper query construction with where clause
   * - Logging behavior for both success and failure cases
   */
  describe('findOneUser', () => {
    it('should find a user by ID successfully', async () => {
      // Arrange
      const findOneRequest: FindOneUserRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        primaryPhoneNumber: '+1234567890',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOneUser(findOneRequest);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: findOneRequest.id },
      });
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        'Finding user with ID: %s',
        findOneRequest.id,
      );
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Arrange
      const findOneRequest: FindOneUserRequest = {
        id: 'non-existent-id',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneUser(findOneRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(
        'User not found with ID: %s',
        findOneRequest.id,
      );
    });

    it('should throw BadRequestException when ID is missing', async () => {
      // Arrange
      const findOneRequest: FindOneUserRequest = {
        id: '',
      };

      // Act & Assert
      await expect(service.findOneUser(findOneRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  /**
   * UPDATE USER TESTS
   *
   * This test suite validates the updateUser functionality which:
   * - Accepts UpdateUserRequest with user ID and fields to update
   * - Verifies user exists before attempting update operation
   * - Updates user data using TypeORM repository update method
   * - Returns updated user data after successful modification
   * - Throws NotFoundException when target user doesn't exist
   * - Throws BadRequestException for invalid/missing IDs
   * - Performs multiple database queries (find -> update -> find) for data consistency
   *
   * Key behaviors tested:
   * - Successful user update with field modifications
   * - Pre-update existence validation
   * - Post-update data retrieval and return
   * - NotFoundException for non-existent users
   * - BadRequestException for invalid input
   * - Database transaction-like behavior with multiple queries
   */
  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        primaryPhoneNumber: '0987654321',
      };

      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        primaryPhoneNumber: '+1234567890',
      };

      const updatedUser = { ...existingUser, ...updateRequest };

      mockUserRepository.findOne.mockResolvedValueOnce(existingUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockUserRepository.findOne.mockResolvedValueOnce(updatedUser);

      // Act
      const result = await service.updateUser(updateRequest);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.update).toHaveBeenCalledWith(updateRequest.id, {
        firstName: updateRequest.firstName,
        lastName: updateRequest.lastName,
        email: updateRequest.email,
        primaryPhoneNumber: updateRequest.primaryPhoneNumber,
      });
      expect(result).toEqual({ user: updatedUser });
    });

    it('should throw NotFoundException when user to update is not found', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        id: 'non-existent-id',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        primaryPhoneNumber: '0987654321',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateUser(updateRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(
        'User not found for update with ID: %s',
        updateRequest.id,
      );
    });

    it('should throw BadRequestException when ID is missing', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        id: '',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        primaryPhoneNumber: '0987654321',
      };

      // Act & Assert
      await expect(service.updateUser(updateRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  /**
   * REMOVE USER TESTS
   *
   * This test suite validates the removeUser functionality which:
   * - Accepts RemoveUserRequest with user ID for deletion
   * - Verifies user exists before attempting removal operation
   * - Performs soft deletion using TypeORM softDelete method (preserves data integrity)
   * - Returns confirmation message with user ID upon successful removal
   * - Throws NotFoundException when target user doesn't exist
   * - Throws BadRequestException for invalid/missing IDs
   * - Logs warnings when users are not found for removal operations
   *
   * Key behaviors tested:
   * - Successful soft deletion of existing users
   * - Pre-deletion existence validation
   * - Confirmation message generation with user ID
   * - NotFoundException for non-existent users
   * - BadRequestException for invalid input
   * - Use of softDelete vs hard delete for data preservation
   */
  describe('removeUser', () => {
    it('should remove a user successfully', async () => {
      // Arrange
      const removeRequest: RemoveUserRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        primaryPhoneNumber: '+1234567890',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.softDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await service.removeUser(removeRequest);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: removeRequest.id },
      });
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(
        removeRequest.id,
      );
      expect(result).toEqual({
        message: `User with ID ${removeRequest.id} has been successfully removed`,
      });
    });

    it('should throw NotFoundException when user to remove is not found', async () => {
      // Arrange
      const removeRequest: RemoveUserRequest = {
        id: 'non-existent-id',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeUser(removeRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(
        'User not found for removal with ID: %s',
        removeRequest.id,
      );
    });

    it('should throw BadRequestException when ID is missing', async () => {
      // Arrange
      const removeRequest: RemoveUserRequest = {
        id: '',
      };

      // Act & Assert
      await expect(service.removeUser(removeRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  /**
   * QUERY USERS TESTS (REACTIVE/STREAMING)
   *
   * This test suite validates the queryUsers functionality which:
   * - Accepts Observable<QueryUsersRequest> for reactive/streaming queries
   * - Implements pagination with skip/take calculations based on page and limit
   * - Orders results by createdAt in descending order (newest first)
   * - Applies input validation and sanitization (limit caps, minimum values)
   * - Returns Observable<QueryUsersResponse> for streaming responses
   * - Handles various pagination scenarios and edge cases
   *
   * Key behaviors tested:
   * - Successful paginated query with proper skip/take calculation
   * - Pagination math verification for different page numbers
   * - Input validation with maximum limit enforcement (cap at 100)
   * - Input sanitization for negative or zero values (minimum of 1)
   * - Observable pattern usage for reactive programming
   * - Consistent ordering by creation timestamp
   *
   * Note: This method differs from findAllUsers by using reactive patterns
   * and more sophisticated pagination logic, likely for gRPC streaming responses.
   */
  describe('queryUsers', () => {
    it('should query users with pagination successfully', (done) => {
      // Arrange
      const queryRequest: QueryUsersRequest = {
        page: 1,
        limit: 5,
      };

      const mockUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          primaryPhoneNumber: '+1234567890',
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);
      const request$ = of(queryRequest);

      // Act
      const result$ = service.queryUsers(request$);

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({ users: mockUsers });
          expect(mockUserRepository.find).toHaveBeenCalledWith({
            skip: 0,
            take: 5,
            order: { createdAt: 'DESC' },
          });
          done();
        },
        error: done,
      });
    });

    it('should handle pagination correctly for page 2', (done) => {
      // Arrange
      const queryRequest: QueryUsersRequest = {
        page: 2,
        limit: 10,
      };

      mockUserRepository.find.mockResolvedValue([]);
      const request$ = of(queryRequest);

      // Act
      const result$ = service.queryUsers(request$);

      // Assert
      result$.subscribe({
        next: () => {
          expect(mockUserRepository.find).toHaveBeenCalledWith({
            skip: 10, // (page 2 - 1) * limit 10
            take: 10,
            order: { createdAt: 'DESC' },
          });
          done();
        },
        error: done,
      });
    });

    it('should cap limit at 100 items', (done) => {
      // Arrange
      const queryRequest: QueryUsersRequest = {
        page: 1,
        limit: 200, // Should be capped at 100
      };

      mockUserRepository.find.mockResolvedValue([]);
      const request$ = of(queryRequest);

      // Act
      const result$ = service.queryUsers(request$);

      // Assert
      result$.subscribe({
        next: () => {
          expect(mockUserRepository.find).toHaveBeenCalledWith({
            skip: 0,
            take: 100, // Capped at 100
            order: { createdAt: 'DESC' },
          });
          done();
        },
        error: done,
      });
    });

    it('should handle minimum values for page and limit', (done) => {
      // Arrange
      const queryRequest: QueryUsersRequest = {
        page: 0, // Should be set to 1
        limit: -5, // Should be set to 1
      };

      mockUserRepository.find.mockResolvedValue([]);
      const request$ = of(queryRequest);

      // Act
      const result$ = service.queryUsers(request$);

      // Assert
      result$.subscribe({
        next: () => {
          expect(mockUserRepository.find).toHaveBeenCalledWith({
            skip: 0, // (1 - 1) * 1
            take: 1,
            order: { createdAt: 'DESC' },
          });
          done();
        },
        error: done,
      });
    });
  });
});
