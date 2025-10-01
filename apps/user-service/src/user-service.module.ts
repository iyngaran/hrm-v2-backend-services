import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { UserServiceConfigModule } from '@app/libs/nestjs/app-config/modules/user-service-config.module';

@Module({
  imports: [UserServiceConfigModule, UsersModule],
  controllers: [],
  providers: [],
})
export class UserServiceModule {}
