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
  UserServiceController,
} from '@app/libs';
import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserServiceControllerMethods } from '../../../../../proto/user-service/users/user';
import { UsersService } from '../services/users.service';

@Controller()
@UserServiceControllerMethods()
export class UsersController implements UserServiceController {
  constructor(private readonly usersService: UsersService) {}

  createUser(
    request: CreateUserRequest,
  ):
    | Promise<CreateUserResponse>
    | Observable<CreateUserResponse>
    | CreateUserResponse {
    return this.usersService.createUser(request);
  }

  findAllUsers(
    _request: FindAllUsersRequest,
  ):
    | Promise<FindAllUsersResponse>
    | Observable<FindAllUsersResponse>
    | FindAllUsersResponse {
    // TODO: Implement findAllUsers method
    throw new Error('Method not implemented.');
  }

  findOneUser(
    _request: FindOneUserRequest,
  ):
    | Promise<FindOneUserResponse>
    | Observable<FindOneUserResponse>
    | FindOneUserResponse {
    // TODO: Implement findOneUser method
    throw new Error('Method not implemented.');
  }

  updateUser(
    _request: UpdateUserRequest,
  ):
    | Promise<UpdateUserResponse>
    | Observable<UpdateUserResponse>
    | UpdateUserResponse {
    // TODO: Implement updateUser method
    throw new Error('Method not implemented.');
  }

  removeUser(
    _request: RemoveUserRequest,
  ):
    | Promise<RemoveUserResponse>
    | Observable<RemoveUserResponse>
    | RemoveUserResponse {
    // TODO: Implement removeUser method
    throw new Error('Method not implemented.');
  }

  queryUsers(
    _request: Observable<QueryUsersRequest>,
  ): Observable<QueryUsersResponse> {
    // TODO: Implement queryUsers method
    throw new Error('Method not implemented.');
  }
}
