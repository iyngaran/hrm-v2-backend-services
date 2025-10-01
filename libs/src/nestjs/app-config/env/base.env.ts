import { z } from 'zod';

/**
 * Base environment schema containing common variables for all services
 */
export const baseEnvSchema = z.object({
  // app
  NODE_ENV: z
    .enum(['development', 'production', 'staging', 'test'])
    .default('development'),

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
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
