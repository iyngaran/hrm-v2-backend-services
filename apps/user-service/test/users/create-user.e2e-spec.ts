import { INestApplication } from '@nestjs/common';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { lastValueFrom } from 'rxjs';
import {
  CreateUserRequest,
  CreateUserResponse,
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
    if (clientApp) {
      await clientApp.close();
    }
    if (app) {
      await app.close();
    }
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
