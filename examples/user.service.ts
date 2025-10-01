import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

interface UserService {
  createUser(data: any): any;
  findAllUsers(data: any): any;
  findOneUser(data: any): any;
  updateUser(data: any): any;
  removeUser(data: any): any;
}

@Injectable()
export class UserClientService {
  private userService: UserService;

  constructor(@Inject('USER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserService>('UserService');
  }

  async createUser(userData: any) {
    return this.userService.createUser(userData);
  }

  async findAllUsers(query: any) {
    return this.userService.findAllUsers(query);
  }
}
