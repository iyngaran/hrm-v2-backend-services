import { Controller, Get } from '@nestjs/common';
import { HrmServiceService } from './hrm-service.service';

@Controller()
export class HrmServiceController {
  constructor(private readonly hrmServiceService: HrmServiceService) {}

  @Get()
  getHello(): string {
    return this.hrmServiceService.getHello();
  }
}
