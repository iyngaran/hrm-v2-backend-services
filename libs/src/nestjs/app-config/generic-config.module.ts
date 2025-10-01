import { DynamicModule } from '@nestjs/common';
import { ZodSchema } from 'zod';

export interface ConfigModuleOptions<T extends Record<string, unknown>> {
  envSchema: ZodSchema<T>;
  servicePrefix?: string; // e.g., 'USER_SERVICE', 'HRM_SERVICE'
  includeDatabase?: boolean;
  envFilePath?: string[];
}

/**
 * Generic config module factory that can be used by any service
 * @deprecated Use service-specific config modules instead (UserServiceConfigModule, HrmServiceConfigModule, etc.)
 *
 * This class is kept for reference but it's recommended to use the service-specific
 * config modules which provide better type safety and simpler dependency injection.
 */
export class GenericConfigModule {
  static forService<T extends Record<string, unknown>>(
    _options: ConfigModuleOptions<T>,
  ): DynamicModule {
    throw new Error(
      'GenericConfigModule.forService() is deprecated. ' +
        'Please use service-specific config modules instead:\n' +
        '- UserServiceConfigModule for user-service\n' +
        '- HrmServiceConfigModule for hrm-service\n' +
        '- ApiGatewayConfigModule for api-gateway\n' +
        'These modules provide better type safety and simpler dependency injection.',
    );
  }
}
