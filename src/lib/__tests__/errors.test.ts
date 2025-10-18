import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BaseError,
  ValidationError,
  DeploymentError,
  NetworkError,
  ConfigurationError,
  StorageError,
  PolicyValidationError,
  withRetry,
  isRetryable,
  getErrorMessage,
  getErrorDetails,
  DEFAULT_RETRY_OPTIONS,
  type RetryOptions,
} from '../errors';

describe('errors', () => {
  describe('BaseError', () => {
    it('should create error with required fields', () => {
      const error = new BaseError('Test error', {
        code: 'TEST_ERROR',
      });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('BaseError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create retryable error', () => {
      const error = new BaseError('Test error', {
        code: 'TEST_ERROR',
        retryable: true,
      });

      expect(error.retryable).toBe(true);
    });

    it('should include context', () => {
      const context = { key: 'value', num: 123 };
      const error = new BaseError('Test error', {
        code: 'TEST_ERROR',
        context,
      });

      expect(error.context).toEqual(context);
    });

    it('should include cause stack trace', () => {
      const cause = new Error('Cause error');
      const error = new BaseError('Test error', {
        code: 'TEST_ERROR',
        cause,
      });

      expect(error.stack).toContain('Caused by:');
      expect(error.stack).toContain(cause.stack);
    });

    it('should convert to JSON', () => {
      const error = new BaseError('Test error', {
        code: 'TEST_ERROR',
        retryable: true,
        context: { key: 'value' },
      });

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'BaseError',
        message: 'Test error',
        code: 'TEST_ERROR',
        retryable: true,
        context: { key: 'value' },
        timestamp: error.timestamp.toISOString(),
        stack: error.stack,
      });
    });

    it('should be instanceof Error', () => {
      const error = new BaseError('Test error', { code: 'TEST_ERROR' });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('ValidationError');
    });

    it('should include field and value in context', () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        value: 'invalid',
      });

      expect(error.context).toEqual({
        field: 'email',
        value: 'invalid',
      });
    });

    it('should merge additional context', () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        context: { source: 'form' },
      });

      expect(error.context).toEqual({
        field: 'email',
        value: undefined,
        source: 'form',
      });
    });
  });

  describe('DeploymentError', () => {
    it('should create deployment error', () => {
      const error = new DeploymentError('Deployment failed');

      expect(error.message).toBe('Deployment failed');
      expect(error.code).toBe('DEPLOYMENT_ERROR');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('DeploymentError');
    });

    it('should include step and proposalId in context', () => {
      const error = new DeploymentError('Deployment failed', {
        step: 'validation',
        proposalId: '123',
      });

      expect(error.context).toEqual({
        step: 'validation',
        proposalId: '123',
      });
    });

    it('should support retryable deployment errors', () => {
      const error = new DeploymentError('Deployment failed', {
        retryable: true,
      });

      expect(error.retryable).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Network request failed');

      expect(error.message).toBe('Network request failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true); // Network errors are retryable by default
      expect(error.name).toBe('NetworkError');
    });

    it('should include network and chainId in context', () => {
      const error = new NetworkError('Network request failed', {
        network: 'sepolia',
        chainId: 11155111,
      });

      expect(error.context).toEqual({
        network: 'sepolia',
        chainId: 11155111,
      });
    });

    it('should support non-retryable network errors', () => {
      const error = new NetworkError('Network request failed', {
        retryable: false,
      });

      expect(error.retryable).toBe(false);
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Missing configuration');

      expect(error.message).toBe('Missing configuration');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('ConfigurationError');
    });

    it('should include configKey and expectedFormat in context', () => {
      const error = new ConfigurationError('Missing configuration', {
        configKey: 'SAFE_ADDRESS',
        expectedFormat: '0x...',
      });

      expect(error.context).toEqual({
        configKey: 'SAFE_ADDRESS',
        expectedFormat: '0x...',
      });
    });
  });

  describe('StorageError', () => {
    it('should create storage error', () => {
      const error = new StorageError('Storage operation failed');

      expect(error.message).toBe('Storage operation failed');
      expect(error.code).toBe('STORAGE_ERROR');
      expect(error.retryable).toBe(true); // Storage errors are retryable by default
      expect(error.name).toBe('StorageError');
    });

    it('should include operation and proposalId in context', () => {
      const error = new StorageError('Storage operation failed', {
        operation: 'write',
        proposalId: '123',
      });

      expect(error.context).toEqual({
        operation: 'write',
        proposalId: '123',
      });
    });

    it('should support non-retryable storage errors', () => {
      const error = new StorageError('Storage operation failed', {
        retryable: false,
      });

      expect(error.retryable).toBe(false);
    });
  });

  describe('PolicyValidationError', () => {
    it('should create policy validation error', () => {
      const error = new PolicyValidationError('Policy validation failed');

      expect(error.message).toBe('Policy validation failed');
      expect(error.code).toBe('POLICY_VALIDATION_ERROR');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('PolicyValidationError');
    });

    it('should include violations in context', () => {
      const error = new PolicyValidationError('Policy validation failed', {
        violations: ['Missing field: to', 'Invalid value: gasLimit'],
      });

      expect(error.context?.violations).toEqual([
        'Missing field: to',
        'Invalid value: gasLimit',
      ]);
    });

    it('should include proposalData in context', () => {
      const proposalData = { to: '0x...', value: '0' };
      const error = new PolicyValidationError('Policy validation failed', {
        proposalData,
      });

      expect(error.context?.proposalData).toEqual(proposalData);
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new NetworkError('Network error'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn);

      // Advance timer for first retry delay
      await vi.advanceTimersByTimeAsync(DEFAULT_RETRY_OPTIONS.initialDelay);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new ValidationError('Invalid'));

      await expect(withRetry(fn)).rejects.toThrow('Invalid');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxAttempts', async () => {
      const error = new NetworkError('Network error');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = withRetry(fn, { maxAttempts: 3 }).catch((err) => err);

      // Advance timers for all retry attempts
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(DEFAULT_RETRY_OPTIONS.maxDelay);
      }

      const result = await promise;
      expect(result).toBe(error);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const error = new NetworkError('Network error');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = withRetry(fn, {
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxAttempts: 3,
      }).catch((err) => err);

      // First retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry: 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(fn).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe(error);
    });

    it('should respect maxDelay', async () => {
      const error = new NetworkError('Network error');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = withRetry(fn, {
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 4,
        maxAttempts: 4,
      }).catch((err) => err);

      // First retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);

      // Second retry: 2000ms (capped by maxDelay)
      await vi.advanceTimersByTimeAsync(2000);

      // Third retry: 2000ms (capped by maxDelay)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toBe(error);
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('should use custom retryableErrors function', async () => {
      const customError = new Error('Custom error');
      const fn = vi
        .fn()
        .mockRejectedValueOnce(customError)
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        retryableErrors: (error) => error.message === 'Custom error',
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_RETRY_OPTIONS.initialDelay);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use default retryable logic when no custom function provided', async () => {
      const retryableError = new NetworkError('Network error'); // retryable by default
      const fn = vi
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn); // No retryableErrors provided

      await vi.advanceTimersByTimeAsync(DEFAULT_RETRY_OPTIONS.initialDelay);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry standard Error with default logic', async () => {
      const standardError = new Error('Standard error'); // Not a BaseError
      const fn = vi.fn().mockRejectedValue(standardError);

      await expect(withRetry(fn)).rejects.toThrow('Standard error');
      expect(fn).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable BaseError', () => {
      const error = new NetworkError('Network error');
      expect(isRetryable(error)).toBe(true);
    });

    it('should return false for non-retryable BaseError', () => {
      const error = new ValidationError('Invalid');
      expect(isRetryable(error)).toBe(false);
    });

    it('should return false for standard Error', () => {
      const error = new Error('Standard error');
      expect(isRetryable(error)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should extract message from BaseError', () => {
      const error = new ValidationError('Validation failed');
      expect(getErrorMessage(error)).toBe('Validation failed');
    });

    it('should convert non-Error to string', () => {
      expect(getErrorMessage('string error')).toBe('string error');
      expect(getErrorMessage(123)).toBe('123');
      expect(getErrorMessage(null)).toBe('null');
    });
  });

  describe('getErrorDetails', () => {
    it('should extract details from BaseError', () => {
      const error = new ValidationError('Validation failed', {
        field: 'email',
        value: 'invalid',
      });

      const details = getErrorDetails(error);

      expect(details.name).toBe('ValidationError');
      expect(details.message).toBe('Validation failed');
      expect(details.code).toBe('VALIDATION_ERROR');
      expect(details.retryable).toBe(false);
      expect(details.context).toEqual({
        field: 'email',
        value: 'invalid',
      });
      expect(details.stack).toBeDefined();
    });

    it('should extract details from standard Error', () => {
      const error = new Error('Standard error');

      const details = getErrorDetails(error);

      expect(details.name).toBe('Error');
      expect(details.message).toBe('Standard error');
      expect(details.code).toBeUndefined();
      expect(details.retryable).toBeUndefined();
      expect(details.stack).toBeDefined();
    });

    it('should handle non-Error values', () => {
      const details = getErrorDetails('string error');

      expect(details.name).toBe('UnknownError');
      expect(details.message).toBe('string error');
      expect(details.code).toBeUndefined();
      expect(details.stack).toBeUndefined();
    });
  });
});
