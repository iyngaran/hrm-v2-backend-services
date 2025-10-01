// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var user$service_users_user_pb = require('../../user-service/users/user_pb.js');
var common_types_pb = require('../../common/types_pb.js');

function serialize_user_v1_CreateUserRequest(arg) {
  if (!(arg instanceof user$service_users_user_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type user.v1.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_CreateUserRequest(buffer_arg) {
  return user$service_users_user_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_CreateUserResponse(arg) {
  if (!(arg instanceof user$service_users_user_pb.CreateUserResponse)) {
    throw new Error('Expected argument of type user.v1.CreateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_CreateUserResponse(buffer_arg) {
  return user$service_users_user_pb.CreateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_FindAllUsersRequest(arg) {
  if (!(arg instanceof user$service_users_user_pb.FindAllUsersRequest)) {
    throw new Error('Expected argument of type user.v1.FindAllUsersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_FindAllUsersRequest(buffer_arg) {
  return user$service_users_user_pb.FindAllUsersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_FindAllUsersResponse(arg) {
  if (!(arg instanceof user$service_users_user_pb.FindAllUsersResponse)) {
    throw new Error('Expected argument of type user.v1.FindAllUsersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_FindAllUsersResponse(buffer_arg) {
  return user$service_users_user_pb.FindAllUsersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_FindOneUserRequest(arg) {
  if (!(arg instanceof user$service_users_user_pb.FindOneUserRequest)) {
    throw new Error('Expected argument of type user.v1.FindOneUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_FindOneUserRequest(buffer_arg) {
  return user$service_users_user_pb.FindOneUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_FindOneUserResponse(arg) {
  if (!(arg instanceof user$service_users_user_pb.FindOneUserResponse)) {
    throw new Error('Expected argument of type user.v1.FindOneUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_FindOneUserResponse(buffer_arg) {
  return user$service_users_user_pb.FindOneUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_QueryUsersRequest(arg) {
  if (!(arg instanceof user$service_users_user_pb.QueryUsersRequest)) {
    throw new Error('Expected argument of type user.v1.QueryUsersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_QueryUsersRequest(buffer_arg) {
  return user$service_users_user_pb.QueryUsersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_QueryUsersResponse(arg) {
  if (!(arg instanceof user$service_users_user_pb.QueryUsersResponse)) {
    throw new Error('Expected argument of type user.v1.QueryUsersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_QueryUsersResponse(buffer_arg) {
  return user$service_users_user_pb.QueryUsersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_RemoveUserRequest(arg) {
  if (!(arg instanceof user$service_users_user_pb.RemoveUserRequest)) {
    throw new Error('Expected argument of type user.v1.RemoveUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_RemoveUserRequest(buffer_arg) {
  return user$service_users_user_pb.RemoveUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_RemoveUserResponse(arg) {
  if (!(arg instanceof user$service_users_user_pb.RemoveUserResponse)) {
    throw new Error('Expected argument of type user.v1.RemoveUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_RemoveUserResponse(buffer_arg) {
  return user$service_users_user_pb.RemoveUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_UpdateUserRequest(arg) {
  if (!(arg instanceof user$service_users_user_pb.UpdateUserRequest)) {
    throw new Error('Expected argument of type user.v1.UpdateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_UpdateUserRequest(buffer_arg) {
  return user$service_users_user_pb.UpdateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_v1_UpdateUserResponse(arg) {
  if (!(arg instanceof user$service_users_user_pb.UpdateUserResponse)) {
    throw new Error('Expected argument of type user.v1.UpdateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_v1_UpdateUserResponse(buffer_arg) {
  return user$service_users_user_pb.UpdateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var UserServiceService = exports.UserServiceService = {
  createUser: {
    path: '/user.v1.UserService/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: user$service_users_user_pb.CreateUserRequest,
    responseType: user$service_users_user_pb.CreateUserResponse,
    requestSerialize: serialize_user_v1_CreateUserRequest,
    requestDeserialize: deserialize_user_v1_CreateUserRequest,
    responseSerialize: serialize_user_v1_CreateUserResponse,
    responseDeserialize: deserialize_user_v1_CreateUserResponse,
  },
  findAllUsers: {
    path: '/user.v1.UserService/FindAllUsers',
    requestStream: false,
    responseStream: false,
    requestType: user$service_users_user_pb.FindAllUsersRequest,
    responseType: user$service_users_user_pb.FindAllUsersResponse,
    requestSerialize: serialize_user_v1_FindAllUsersRequest,
    requestDeserialize: deserialize_user_v1_FindAllUsersRequest,
    responseSerialize: serialize_user_v1_FindAllUsersResponse,
    responseDeserialize: deserialize_user_v1_FindAllUsersResponse,
  },
  findOneUser: {
    path: '/user.v1.UserService/FindOneUser',
    requestStream: false,
    responseStream: false,
    requestType: user$service_users_user_pb.FindOneUserRequest,
    responseType: user$service_users_user_pb.FindOneUserResponse,
    requestSerialize: serialize_user_v1_FindOneUserRequest,
    requestDeserialize: deserialize_user_v1_FindOneUserRequest,
    responseSerialize: serialize_user_v1_FindOneUserResponse,
    responseDeserialize: deserialize_user_v1_FindOneUserResponse,
  },
  updateUser: {
    path: '/user.v1.UserService/UpdateUser',
    requestStream: false,
    responseStream: false,
    requestType: user$service_users_user_pb.UpdateUserRequest,
    responseType: user$service_users_user_pb.UpdateUserResponse,
    requestSerialize: serialize_user_v1_UpdateUserRequest,
    requestDeserialize: deserialize_user_v1_UpdateUserRequest,
    responseSerialize: serialize_user_v1_UpdateUserResponse,
    responseDeserialize: deserialize_user_v1_UpdateUserResponse,
  },
  removeUser: {
    path: '/user.v1.UserService/RemoveUser',
    requestStream: false,
    responseStream: false,
    requestType: user$service_users_user_pb.RemoveUserRequest,
    responseType: user$service_users_user_pb.RemoveUserResponse,
    requestSerialize: serialize_user_v1_RemoveUserRequest,
    requestDeserialize: deserialize_user_v1_RemoveUserRequest,
    responseSerialize: serialize_user_v1_RemoveUserResponse,
    responseDeserialize: deserialize_user_v1_RemoveUserResponse,
  },
  queryUsers: {
    path: '/user.v1.UserService/QueryUsers',
    requestStream: true,
    responseStream: true,
    requestType: user$service_users_user_pb.QueryUsersRequest,
    responseType: user$service_users_user_pb.QueryUsersResponse,
    requestSerialize: serialize_user_v1_QueryUsersRequest,
    requestDeserialize: deserialize_user_v1_QueryUsersRequest,
    responseSerialize: serialize_user_v1_QueryUsersResponse,
    responseDeserialize: deserialize_user_v1_QueryUsersResponse,
  },
};

exports.UserServiceClient = grpc.makeGenericClientConstructor(UserServiceService, 'UserService');
