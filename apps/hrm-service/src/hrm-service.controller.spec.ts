import { Test, TestingModule } from '@nestjs/testing';
import { HrmServiceController } from './hrm-service.controller';
import { HrmServiceService } from './hrm-service.service';

describe('HrmServiceController', () => {
  let hrmServiceController: HrmServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HrmServiceController],
      providers: [HrmServiceService],
    }).compile();

    hrmServiceController = app.get<HrmServiceController>(HrmServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(hrmServiceController.getHello()).toBe('Hello World!');
    });
  });
});
