import { UserServiceEnv } from '@app/libs/nestjs/app-config/env/user-service.env';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Repository } from 'typeorm';
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
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    protected readonly logger: PinoLogger,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: GenericConfigService<UserServiceEnv>,
  ) {
    this.logger.setContext(this.constructor.name);
    // Example of accessing environment variables
    const dbHost = this.configService.get('USER_SERVICE_DB_HOST');
    const nodeEnv = this.configService.get('NODE_ENV');
    this.logger.info(
      'Service initialized with DB Host: %s, Environment: %s',
      dbHost,
      nodeEnv,
    );
  }
  /**
   * Creates a new user in the database.
   * @param request - The request object containing user details.
   * @returns A promise that resolves to the created user.
   */
  public async createUser(
    request: CreateUserRequest,
  ): Promise<CreateUserResponse> {
    this.logger.info('Creating user with request: %o', request);
    const user = await this.userRepository.save({
      ...request,
    });
    this.logger.info('User created successfully: %o', user);

    return {
      status: 'success',
      message: 'User created successfully',
      data: user,
      errors: [],
    } as CreateUserResponse;
  }

  public async findAllUsers(
    _request: FindAllUsersRequest,
  ): Promise<FindAllUsersResponse> {
    this.logger.info('Finding all users');
    const users = await this.userRepository.find();
    this.logger.info('All users found successfully: %o', users);
    return {
      users,
    } as FindAllUsersResponse;
  }

  /**
   * Finds a single user by ID.
   * @param request - The request object containing the user ID.
   * @returns A promise that resolves to the found user.
   * @throws NotFoundException if the user is not found.
   */
  public async findOneUser(
    request: FindOneUserRequest,
  ): Promise<FindOneUserResponse> {
    this.logger.info('Finding user with ID: %s', request.id);

    if (!request.id) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userRepository.findOne({
      where: { id: request.id },
    });

    if (!user) {
      this.logger.warn('User not found with ID: %s', request.id);
      throw new NotFoundException(`User with ID ${request.id} not found`);
    }

    this.logger.info('User found successfully: %o', user);
    return {
      user,
    } as FindOneUserResponse;
  }

  /**
   * Updates an existing user.
   * @param request - The request object containing user ID and updated fields.
   * @returns A promise that resolves to the updated user.
   * @throws NotFoundException if the user is not found.
   */
  public async updateUser(
    request: UpdateUserRequest,
  ): Promise<UpdateUserResponse> {
    this.logger.info(
      'Updating user with ID: %s, data: %o',
      request.id,
      request,
    );

    if (!request.id) {
      throw new BadRequestException('User ID is required');
    }

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { id: request.id },
    });

    if (!existingUser) {
      this.logger.warn('User not found for update with ID: %s', request.id);
      throw new NotFoundException(`User with ID ${request.id} not found`);
    }

    // Update user with provided fields
    const updateData = {
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      primaryPhoneNumber: request.primaryPhoneNumber,
    };

    await this.userRepository.update(request.id, updateData);

    // Fetch and return updated user
    const updatedUser = await this.userRepository.findOne({
      where: { id: request.id },
    });

    this.logger.info('User updated successfully: %o', updatedUser);
    return {
      user: updatedUser!,
    } as UpdateUserResponse;
  }

  /**
   * Removes (soft deletes) a user by ID.
   * @param request - The request object containing the user ID.
   * @returns A promise that resolves to a success message.
   * @throws NotFoundException if the user is not found.
   */
  public async removeUser(
    request: RemoveUserRequest,
  ): Promise<RemoveUserResponse> {
    this.logger.info('Removing user with ID: %s', request.id);

    if (!request.id) {
      throw new BadRequestException('User ID is required');
    }

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { id: request.id },
    });

    if (!existingUser) {
      this.logger.warn('User not found for removal with ID: %s', request.id);
      throw new NotFoundException(`User with ID ${request.id} not found`);
    }

    // Soft delete the user
    await this.userRepository.softDelete(request.id);

    this.logger.info('User removed successfully with ID: %s', request.id);
    return {
      message: `User with ID ${request.id} has been successfully removed`,
    } as RemoveUserResponse;
  }

  /**
   * Queries users with pagination using streaming.
   * @param request - Observable stream of query requests with pagination.
   * @returns Observable stream of query responses.
   */
  public queryUsers(
    request: Observable<QueryUsersRequest>,
  ): Observable<QueryUsersResponse> {
    return request.pipe(
      switchMap(async (req) => {
        this.logger.info(
          'Querying users with pagination: page=%d, limit=%d',
          req.page,
          req.limit,
        );

        const page = Math.max(1, req.page || 1);
        const limit = Math.min(100, Math.max(1, req.limit || 10)); // Cap at 100 items
        const skip = (page - 1) * limit;

        const users = await this.userRepository.find({
          skip,
          take: limit,
          order: { createdAt: 'DESC' },
        });

        this.logger.info('Query completed: found %d users', users.length);
        return {
          users,
        } as QueryUsersResponse;
      }),
    );
  }
}
