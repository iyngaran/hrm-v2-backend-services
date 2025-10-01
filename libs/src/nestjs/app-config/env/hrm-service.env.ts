import { z } from 'zod';
import { createDatabaseEnvSchema, DatabaseEnv } from './database.env';

/**
 * HRM Service environment schema
 */
export const hrmServiceEnvSchema = createDatabaseEnvSchema(
  'HRM_SERVICE',
).extend({
  GRPC_HRM_SERVICE_URL: z.string().default('0.0.0.0:50003'),
});

export type HrmServiceEnv = DatabaseEnv<'HRM_SERVICE'> & {
  GRPC_HRM_SERVICE_URL: string;
};
