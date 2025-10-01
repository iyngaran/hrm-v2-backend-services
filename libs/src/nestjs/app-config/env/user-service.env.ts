import { z } from 'zod';
import { createDatabaseEnvSchema, DatabaseEnv } from './database.env';

/**
 * User Service environment schema
 */
export const userServiceEnvSchema = createDatabaseEnvSchema(
  'USER_SERVICE',
).extend({
  GRPC_USER_SERVICE_URL: z.string().default('0.0.0.0:50002'),
});

export type UserServiceEnv = DatabaseEnv<'USER_SERVICE'> & {
  GRPC_USER_SERVICE_URL: string;
};
