import { Module } from '@nestjs/common';
import { HrmServiceController } from './hrm-service.controller';
import { HrmServiceService } from './hrm-service.service';
import { HrmServiceConfigModule } from '@app/libs/nestjs/app-config/modules/hrm-service-config.module';

@Module({
  imports: [HrmServiceConfigModule],
  controllers: [HrmServiceController],
  providers: [HrmServiceService],
})
export class HrmServiceModule {}
