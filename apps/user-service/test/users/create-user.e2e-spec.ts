// test/user.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { join } from 'path';
import { Transport, ClientGrpc } from '@nestjs/microservices';

import { lastValueFrom } from 'rxjs';
import { UserServiceModule } from '../../src/user-service.module';
import {
  CreateUserRequest,
  CreateUserResponse,
  UserServiceClient,
} from '../../../../proto/user-service/users/user';

describe('UserService (gRPC) E2E', () => {
  let app: INestApplication;
  let grpcClient: ClientGrpc;
  let userService: UserServiceClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        package: 'user.v1',
        protoPath:
          process.env.NODE_ENV === 'production'
            ? join(__dirname, '../../../proto/user-service/users/user.proto')
            : join(process.cwd(), 'proto/user-service/users/user.proto'),
        url: 'localhost:50051',
      },
    });

    await app.startAllMicroservices();
    await app.init();

    grpcClient = app.get('UserService'); // Use the string token registered for the gRPC client
    userService = grpcClient.getService<UserServiceClient>('UserService');
  });

  afterAll(async () => {
    await app.close();
  });

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
  });
});
