import { z } from 'zod';
import { BaseEnv, baseEnvSchema } from './base.env';

/**
 * Database environment schema for services that need database connection
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createDatabaseEnvSchema = (servicePrefix: string) => {
  const dbSchema = z.object({
    [`${servicePrefix}_DB_HOST`]: z.string(),
    [`${servicePrefix}_DB_PORT`]: z.string().default('5432'),
    [`${servicePrefix}_DB_USER`]: z.string(),
    [`${servicePrefix}_DB_PASSWORD`]: z.string(),
    [`${servicePrefix}_DB_NAME`]: z.string(),
    [`${servicePrefix}_DB_SYNCHRONIZE`]: z.coerce.boolean().default(false),
    [`${servicePrefix}_DB_LOGGING`]: z.coerce.boolean().default(false),
  });

  return baseEnvSchema.merge(dbSchema);
};

/**
 * Helper type to get the database environment type for a service
 */
export type DatabaseEnv<T extends string> = BaseEnv & {
  [K in
    | `${T}_DB_HOST`
    | `${T}_DB_PORT`
    | `${T}_DB_USER`
    | `${T}_DB_PASSWORD`
    | `${T}_DB_NAME`
    | `${T}_DB_SYNCHRONIZE`
    | `${T}_DB_LOGGING`]: K extends `${T}_DB_PORT`
    ? string
    : K extends `${T}_DB_SYNCHRONIZE` | `${T}_DB_LOGGING`
      ? boolean
      : string;
};
