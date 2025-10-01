import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Generic config service that can work with any environment schema
 */
@Injectable()
export class GenericConfigService<T extends Record<string, unknown>> {
  constructor(private readonly configService: ConfigService<T, true>) {}

  /**
   * Get a configuration value, returns undefined if not found
   */
  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.configService.get(key as string);
  }

  /**
   * Get a configuration value or throw an error if not found
   */
  getOrThrow<K extends keyof T>(key: K): T[K] {
    const value = this.configService.get(key as string);
    if (value === undefined || value === null) {
      throw new Error(
        `Configuration key "${String(key)}" is required but not found`,
      );
    }

    return value;
  }

  /**
   * Get a configuration value with a default fallback
   */
  getWithDefault<K extends keyof T>(key: K, defaultValue: T[K]): T[K] {
    const value = this.configService.get(key as string);
    if (value === undefined || value === null) {
      return defaultValue;
    }

    return value;
  }

  /**
   * Check if a configuration key exists and has a non-null/undefined value
   */
  has<K extends keyof T>(key: K): boolean {
    const value = this.configService.get(key as string);
    return value !== undefined && value !== null;
  }

  /**
   * Get all configuration as a typed object
   */
  getAll(): Partial<T> {
    // Note: ConfigService doesn't provide a way to get all values easily
    // This is a placeholder that could be implemented if needed
    throw new Error(
      'getAll() is not implemented. Use individual get() calls instead.',
    );
  }
}
