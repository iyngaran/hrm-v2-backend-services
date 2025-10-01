import { CreateUserRequest, GenericConfigService } from '@app/libs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
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
});
