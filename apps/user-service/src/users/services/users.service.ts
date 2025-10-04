import {
  CreateUserRequest,
  CreateUserResponse,
  GenericConfigService,
} from '@app/libs';
import { UserServiceEnv } from '@app/libs/nestjs/app-config/env/user-service.env';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { Repository } from 'typeorm';
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
}
