import { CreateUserRequest, GenericConfigService } from '@app/libs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { UsersController } from '../controllers/users.controller';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

describe('UsersController', () => {
  let controller: UsersController;
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
      controllers: [UsersController],
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

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have UsersService injected', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should call service.createUser with correct parameters', async () => {
      // Arrange
      const createUserRequest: CreateUserRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'securePassword123',
      };

      const mockResponse = {
        status: 'success',
        message: 'User created successfully',
        data: undefined, // Simplified for testing
        errors: [],
      };

      jest.spyOn(service, 'createUser').mockResolvedValue(mockResponse);

      // Act
      await controller.createUser(createUserRequest);

      // Assert
      expect(service.createUser).toHaveBeenCalledWith(createUserRequest);
      expect(service.createUser).toHaveBeenCalledTimes(1);
    });
  });
});
