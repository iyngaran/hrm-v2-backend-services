// This file is deprecated, use specific service environment files instead
// @deprecated Use service-specific environment files from ./env/ directory
import { z } from 'zod';

export const envSchema = z.object({
  // app
  NODE_ENV: z
    .enum(['development', 'production', 'staging', 'test'])
    .default('development'),
  GRPC_URL: z.string().default('0.0.0.0:50002'),

  // Pino Logger
  LOGGER_ENABLE: z.coerce.boolean().default(true),
  LOGGER_CONSOLE_TARGET_ENABLE: z.coerce.boolean().default(true),
  LOGGER_FILE_TARGET_ENABLE: z.coerce.boolean().default(true),
  LOGGER_DEFAULT_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  LOGGER_CONSOLE_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  LOGGER_FILE_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  //   // db
  USER_SERVICE_DB_HOST: z.string(),
  USER_SERVICE_DB_PORT: z.string().default('5432'),
  USER_SERVICE_DB_USER: z.string(),
  USER_SERVICE_DB_PASSWORD: z.string(),
  USER_SERVICE_DB_NAME: z.string(),
  USER_SERVICE_DB_SYNCHRONIZE: z.coerce.boolean().default(false),
  USER_SERVICE_DB_LOGGING: z.coerce.boolean().default(false),

  SOME_ENV_VARIABLE: z.string().default('default_value'),
});
export type Env = z.infer<typeof envSchema>;
