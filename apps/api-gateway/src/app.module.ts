import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiGatewayConfigModule } from '@app/libs/nestjs/app-config/modules/api-gateway-config.module';
import { GrpcLoggingInterceptor } from '@app/libs/nestjs/interceptors/grpc-logging-interceptor';

@Module({
  imports: [ApiGatewayConfigModule, UsersModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcLoggingInterceptor,
    },
  ],
})
export class AppModule {}
