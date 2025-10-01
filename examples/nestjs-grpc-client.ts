import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user.v1',
          protoPath: join(__dirname, '../proto/user-service/users/user.proto'),
          loader: {
            enums: String,
            objects: true,
            arrays: true
          },
        },
      },
      {
        name: 'HRM_PACKAGE', 
        transport: Transport.GRPC,
        options: {
          package: 'hrm.v1',
          protoPath: join(__dirname, '../proto/hrm/organization/company.proto'),
          loader: {
            enums: String,
            objects: true,
            arrays: true
          },
        },
      },
    ]),
  ],
})
export class GrpcModule {}
