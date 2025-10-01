import { USER_V1_PACKAGE_NAME } from '@app/libs';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UserController } from './user.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: USER_V1_PACKAGE_NAME,
          protoPath:
            process.env.NODE_ENV === 'production'
              ? join(__dirname, '../../../proto/user-service/users/user.proto')
              : join(process.cwd(), 'proto/user-service/users/user.proto'),
          loader: {
            includeDirs: [
              process.env.NODE_ENV === 'production'
                ? join(__dirname, '../../../proto')
                : join(process.cwd(), 'proto'),
            ],
          },
          url: 'localhost:50002', // Adjust the URL as needed
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UsersService],
})
export class UsersModule {}
