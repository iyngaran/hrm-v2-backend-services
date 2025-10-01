import { z } from 'zod';
import { baseEnvSchema, BaseEnv } from './base.env';

/**
 * API Gateway environment schema (no database needed)
 * Includes GRPC URLs for services it needs to communicate with
 */
export const apiGatewayEnvSchema = baseEnvSchema.extend({
  // GRPC URLs for services that the API Gateway communicates with
  API_GATEWAY_PORT: z.string().default('3000'),
  GRPC_USER_SERVICE_URL: z.string().default('0.0.0.0:50002'),
  GRPC_HRM_SERVICE_URL: z.string().default('0.0.0.0:50003'),

  // Add other gateway-specific env variables here if needed
  // For example:
  // API_RATE_LIMIT: z.coerce.number().default(100),
  // JWT_SECRET: z.string(),
});

export type ApiGatewayEnv = BaseEnv & {
  API_GATEWAY_PORT: string;
  GRPC_USER_SERVICE_URL: string;
  GRPC_HRM_SERVICE_URL: string;
  // Add gateway-specific types here if you extend the schema above
};
