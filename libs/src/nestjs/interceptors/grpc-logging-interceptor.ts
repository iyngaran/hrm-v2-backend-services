import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const method = context.getHandler().name;
    const className = context.getClass().name;

    this.logger.setContext(className);
    this.logger.info(`gRPC method called: ${method}`);

    return next
      .handle()
      .pipe(tap(() => this.logger.info(`gRPC method finished: ${method}`)));
  }
}
