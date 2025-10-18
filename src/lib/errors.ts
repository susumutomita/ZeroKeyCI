/**
 * Custom error classes for ZeroKeyCI deployment system
 *
 * Features:
 * - Error categorization (validation, deployment, network, configuration)
 * - Retry capability flags
 * - Context information for debugging
 * - Error recovery strategies
 */

/**
 * Base error class for all ZeroKeyCI errors
 */
export class BaseError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      code: string;
      retryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.context = options.context;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (options.cause) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Validation error - input or configuration validation failed
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    options: {
      field?: string;
      value?: unknown;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      retryable: false,
      context: {
        ...options.context,
        field: options.field,
        value: options.value,
      },
      cause: options.cause,
    });
  }
}

/**
 * Deployment error - deployment process failed
 */
export class DeploymentError extends BaseError {
  constructor(
    message: string,
    options: {
      step?: string;
      proposalId?: string;
      retryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'DEPLOYMENT_ERROR',
      retryable: options.retryable ?? false,
      context: {
        ...options.context,
        step: options.step,
        proposalId: options.proposalId,
      },
      cause: options.cause,
    });
  }
}

/**
 * Network error - network or RPC communication failed
 */
export class NetworkError extends BaseError {
  constructor(
    message: string,
    options: {
      network?: string;
      chainId?: number;
      retryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'NETWORK_ERROR',
      retryable: options.retryable ?? true, // Network errors are usually retryable
      context: {
        ...options.context,
        network: options.network,
        chainId: options.chainId,
      },
      cause: options.cause,
    });
  }
}

/**
 * Configuration error - missing or invalid configuration
 */
export class ConfigurationError extends BaseError {
  constructor(
    message: string,
    options: {
      configKey?: string;
      expectedFormat?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'CONFIGURATION_ERROR',
      retryable: false, // Configuration errors require manual intervention
      context: {
        ...options.context,
        configKey: options.configKey,
        expectedFormat: options.expectedFormat,
      },
      cause: options.cause,
    });
  }
}

/**
 * Storage error - proposal storage operation failed
 */
export class StorageError extends BaseError {
  constructor(
    message: string,
    options: {
      operation?: 'read' | 'write' | 'delete';
      proposalId?: string;
      retryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'STORAGE_ERROR',
      retryable: options.retryable ?? true, // Storage errors might be transient
      context: {
        ...options.context,
        operation: options.operation,
        proposalId: options.proposalId,
      },
      cause: options.cause,
    });
  }
}

/**
 * Policy validation error - OPA policy validation failed
 */
export class PolicyValidationError extends BaseError {
  constructor(
    message: string,
    options: {
      violations?: string[];
      proposalData?: unknown;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'POLICY_VALIDATION_ERROR',
      retryable: false, // Policy violations require proposal changes
      context: {
        ...options.context,
        violations: options.violations,
        proposalData: options.proposalData,
      },
      cause: options.cause,
    });
  }
}

/**
 * Retry options for error recovery
 */
export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors?: (error: Error) => boolean;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: (error: Error) =>
    error instanceof BaseError && error.retryable,
};

/**
 * Execute an async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable = config.retryableErrors
        ? config.retryableErrors(lastError)
        : lastError instanceof BaseError && lastError.retryable;

      // Don't retry if error is not retryable or we're on the last attempt
      if (!isRetryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: Error): boolean {
  return error instanceof BaseError && error.retryable;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Extract error details for logging
 */
export function getErrorDetails(error: unknown): {
  name: string;
  message: string;
  code?: string;
  retryable?: boolean;
  context?: Record<string, unknown>;
  stack?: string;
} {
  if (error instanceof BaseError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      retryable: error.retryable,
      context: error.context,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}
