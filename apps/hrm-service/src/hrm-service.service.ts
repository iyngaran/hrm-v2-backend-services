import { Injectable } from '@nestjs/common';

@Injectable()
export class HrmServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
