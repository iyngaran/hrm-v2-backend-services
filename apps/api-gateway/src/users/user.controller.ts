import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  CreateUserRequest,
  CreateUserResponse,
  FindAllUsersRequest,
  FindAllUsersResponse,
  FindOneUserRequest,
  FindOneUserResponse,
  RemoveUserRequest,
  RemoveUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
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
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Observable<FindAllUsersResponse> {
    const findAllUsersRequest: FindAllUsersRequest = { page, limit };
    return this.usersService.findAllUsers(findAllUsersRequest);
  }

  @Get(':id')
  findOneUser(@Param('id') id: string): Observable<FindOneUserResponse> {
    const findOneUserRequest: FindOneUserRequest = { id };
    return this.usersService.findOneUser(findOneUserRequest);
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() updateUserData: Omit<UpdateUserRequest, 'id'>,
  ): Observable<UpdateUserResponse> {
    const updateUserRequest: UpdateUserRequest = { id, ...updateUserData };
    return this.usersService.updateUser(updateUserRequest);
  }

  @Delete(':id')
  removeUser(@Param('id') id: string): Observable<RemoveUserResponse> {
    const removeUserRequest: RemoveUserRequest = { id };
    return this.usersService.removeUser(removeUserRequest);
  }
}
