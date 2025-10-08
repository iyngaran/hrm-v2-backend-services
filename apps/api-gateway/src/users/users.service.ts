import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  CreateUserRequest,
  CreateUserResponse,
  FindAllUsersRequest,
  FindAllUsersResponse,
  FindOneUserRequest,
  FindOneUserResponse,
  QueryUsersRequest,
  QueryUsersResponse,
  RemoveUserRequest,
  RemoveUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
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

  findOneUser(request: FindOneUserRequest): Observable<FindOneUserResponse> {
    return this.client
      .getService<UserServiceClient>(USER_SERVICE_NAME)
      .findOneUser(request);
  }

  updateUser(request: UpdateUserRequest): Observable<UpdateUserResponse> {
    return this.client
      .getService<UserServiceClient>(USER_SERVICE_NAME)
      .updateUser(request);
  }

  removeUser(request: RemoveUserRequest): Observable<RemoveUserResponse> {
    return this.client
      .getService<UserServiceClient>(USER_SERVICE_NAME)
      .removeUser(request);
  }

  queryUsers(
    request: Observable<QueryUsersRequest>,
  ): Observable<QueryUsersResponse> {
    return this.client
      .getService<UserServiceClient>(USER_SERVICE_NAME)
      .queryUsers(request);
  }
}
