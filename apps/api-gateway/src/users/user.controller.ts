import { CreateUserResponse, FindAllUsersResponse } from '@app/libs';
import { CreateUserRequest, FindAllUsersRequest } from '@app/libs/types/user'; // Adjust the import path as necessary
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
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
