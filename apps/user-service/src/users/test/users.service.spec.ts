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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
