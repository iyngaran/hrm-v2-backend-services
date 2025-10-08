import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  CreateUserRequest,
  CreateUserResponse,
  FindAllUsersRequest,
  FindAllUsersResponse,
  USER_SERVICE_NAME,
  UserServiceClient,
} from '../../../../generated/typescript/user-service/users/user';

@Injectable()
export class UsersService {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  createUser(request: CreateUserRequest): Observable<CreateUserResponse> {
    return this.client
      .getService<UserServiceClient>(USER_SERVICE_NAME)
      .createUser(request);
  }

  findAllUsers(request: FindAllUsersRequest): Observable<FindAllUsersResponse> {
    return this.client
      .getService<UserServiceClient>(USER_SERVICE_NAME)
      .findAllUsers(request);
  }
}
