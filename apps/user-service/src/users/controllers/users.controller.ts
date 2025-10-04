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
    request: FindAllUsersRequest,
  ):
    | Promise<FindAllUsersResponse>
    | Observable<FindAllUsersResponse>
    | FindAllUsersResponse {
    return this.usersService.findAllUsers(request);
  }

  findOneUser(
    request: FindOneUserRequest,
  ):
    | Promise<FindOneUserResponse>
    | Observable<FindOneUserResponse>
    | FindOneUserResponse {
    return this.usersService.findOneUser(request);
  }

  updateUser(
    request: UpdateUserRequest,
  ):
    | Promise<UpdateUserResponse>
    | Observable<UpdateUserResponse>
    | UpdateUserResponse {
    return this.usersService.updateUser(request);
  }

  removeUser(
    request: RemoveUserRequest,
  ):
    | Promise<RemoveUserResponse>
    | Observable<RemoveUserResponse>
    | RemoveUserResponse {
    return this.usersService.removeUser(request);
  }

  queryUsers(
    request: Observable<QueryUsersRequest>,
  ): Observable<QueryUsersResponse> {
    return this.usersService.queryUsers(request);
  }
}
