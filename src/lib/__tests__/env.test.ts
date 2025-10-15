import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getEnvConfig,
  getSafeAddress,
  isProduction,
  isDevelopment,
  isTest,
} from '../env';

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env after each test
    process.env = originalEnv;
  });

  describe('getEnvConfig', () => {
    it('should return default config in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SAFE_ADDRESS;

      const config = getEnvConfig();

      expect(config.nodeEnv).toBe('development');
      expect(config.safeAddress).toBe(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      expect(config.storageType).toBe('file');
    });

    it('should use provided SAFE_ADDRESS', () => {
      process.env.SAFE_ADDRESS = '0x1234567890123456789012345678901234567890';

      const config = getEnvConfig();

      expect(config.safeAddress).toBe(
        '0x1234567890123456789012345678901234567890'
      );
    });

    it('should throw error in production without SAFE_ADDRESS', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SAFE_ADDRESS;

      expect(() => getEnvConfig()).toThrow(
        'SAFE_ADDRESS environment variable is required in production'
      );
    });

    it('should throw error for invalid SAFE_ADDRESS format', () => {
      process.env.SAFE_ADDRESS = 'invalid-address';

      expect(() => getEnvConfig()).toThrow('Invalid SAFE_ADDRESS format');
    });

    it('should accept valid SAFE_ADDRESS format', () => {
      process.env.SAFE_ADDRESS = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';

      const config = getEnvConfig();

      expect(config.safeAddress).toBe(
        '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12'
      );
    });

    it('should use memory storage type when specified', () => {
      process.env.STORAGE_TYPE = 'memory';

      const config = getEnvConfig();

      expect(config.storageType).toBe('memory');
    });

    it('should use storage dir when specified', () => {
      process.env.STORAGE_DIR = '/custom/path';

      const config = getEnvConfig();

      expect(config.storageDir).toBe('/custom/path');
    });

    it('should handle test environment', () => {
      process.env.NODE_ENV = 'test';

      const config = getEnvConfig();

      expect(config.nodeEnv).toBe('test');
    });

    it('should default to development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;

      const config = getEnvConfig();

      expect(config.nodeEnv).toBe('development');
    });
  });

  describe('getSafeAddress', () => {
    it('should return safe address', () => {
      process.env.SAFE_ADDRESS = '0x1234567890123456789012345678901234567890';

      const address = getSafeAddress();

      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should return demo address in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SAFE_ADDRESS;

      const address = getSafeAddress();

      expect(address).toBe('0x742D35CC6634c0532925A3b844BC9E7595F0BEb0');
    });
  });

  describe('isProduction', () => {
    it('should return true in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAFE_ADDRESS = '0x1234567890123456789012345678901234567890';

      expect(isProduction()).toBe(true);
    });

    it('should return false in development', () => {
      process.env.NODE_ENV = 'development';

      expect(isProduction()).toBe(false);
    });

    it('should return false in test', () => {
      process.env.NODE_ENV = 'test';

      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true in development', () => {
      process.env.NODE_ENV = 'development';

      expect(isDevelopment()).toBe(true);
    });

    it('should return false in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAFE_ADDRESS = '0x1234567890123456789012345678901234567890';

      expect(isDevelopment()).toBe(false);
    });

    it('should return false in test', () => {
      process.env.NODE_ENV = 'test';

      expect(isDevelopment()).toBe(false);
    });

    it('should return true when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;

      expect(isDevelopment()).toBe(true);
    });
  });

  describe('isTest', () => {
    it('should return true in test', () => {
      process.env.NODE_ENV = 'test';

      expect(isTest()).toBe(true);
    });

    it('should return false in development', () => {
      process.env.NODE_ENV = 'development';

      expect(isTest()).toBe(false);
    });

    it('should return false in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAFE_ADDRESS = '0x1234567890123456789012345678901234567890';

      expect(isTest()).toBe(false);
    });
  });
});
