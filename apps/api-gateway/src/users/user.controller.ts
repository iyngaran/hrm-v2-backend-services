import { Body, Controller, Get, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  CreateUserRequest,
  CreateUserResponse,
  FindAllUsersRequest,
  FindAllUsersResponse,
} from '../../../../generated/typescript/user-service/users/user';
import { UsersService } from './users.service';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(
    @Body() createUserRequest: CreateUserRequest,
  ): Observable<CreateUserResponse> {
    return this.usersService.createUser(createUserRequest);
  }

  @Get()
  findAllUsers(
    @Body() findAllUsersRequest: FindAllUsersRequest,
  ): Observable<FindAllUsersResponse> {
    return this.usersService.findAllUsers(findAllUsersRequest);
  }
}
