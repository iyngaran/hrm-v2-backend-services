// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var hrm_organization_company_pb = require('../../hrm/organization/company_pb.js');
var common_types_pb = require('../../common/types_pb.js');

function serialize_hrm_v1_CreateCompanyRequest(arg) {
  if (!(arg instanceof hrm_organization_company_pb.CreateCompanyRequest)) {
    throw new Error('Expected argument of type hrm.v1.CreateCompanyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hrm_v1_CreateCompanyRequest(buffer_arg) {
  return hrm_organization_company_pb.CreateCompanyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hrm_v1_CreateCompanyResponse(arg) {
  if (!(arg instanceof hrm_organization_company_pb.CreateCompanyResponse)) {
    throw new Error('Expected argument of type hrm.v1.CreateCompanyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hrm_v1_CreateCompanyResponse(buffer_arg) {
  return hrm_organization_company_pb.CreateCompanyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var CompanyServiceService = exports.CompanyServiceService = {
  createCompany: {
    path: '/hrm.v1.CompanyService/CreateCompany',
    requestStream: false,
    responseStream: false,
    requestType: hrm_organization_company_pb.CreateCompanyRequest,
    responseType: hrm_organization_company_pb.CreateCompanyResponse,
    requestSerialize: serialize_hrm_v1_CreateCompanyRequest,
    requestDeserialize: deserialize_hrm_v1_CreateCompanyRequest,
    responseSerialize: serialize_hrm_v1_CreateCompanyResponse,
    responseDeserialize: deserialize_hrm_v1_CreateCompanyResponse,
  },
};

exports.CompanyServiceClient = grpc.makeGenericClientConstructor(CompanyServiceService, 'CompanyService');
