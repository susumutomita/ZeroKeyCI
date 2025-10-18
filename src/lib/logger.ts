/**
 * Structured logging system for deployment monitoring
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - JSON structured output for machine parsing
 * - Pretty printing for development
 * - Context-aware logging with metadata
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty';
  outputStream?: (entry: LogEntry) => void;
}

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured logger for deployment monitoring
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || this.getDefaultLevel(),
      format: config.format || this.getDefaultFormat(),
      outputStream: config.outputStream || this.defaultOutputStream,
    };
  }

  /**
   * Get default log level from environment
   */
  private getDefaultLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLevel && this.isValidLogLevel(envLevel)) {
      return envLevel as LogLevel;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  /**
   * Get default output format from environment
   */
  private getDefaultFormat(): 'json' | 'pretty' {
    const envFormat = process.env.LOG_FORMAT?.toLowerCase();
    if (envFormat === 'json' || envFormat === 'pretty') {
      return envFormat;
    }
    return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
  }

  /**
   * Check if string is a valid log level
   */
  private isValidLogLevel(level: string): level is LogLevel {
    return ['debug', 'info', 'warn', 'error'].includes(level);
  }

  /**
   * Default output stream (console)
   */
  private defaultOutputStream = (entry: LogEntry): void => {
    const output =
      this.config.format === 'json'
        ? JSON.stringify(entry)
        : this.formatPretty(entry);

    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'debug':
        console.debug(output);
        break;
    }
  };

  /**
   * Format log entry for pretty printing
   */
  private formatPretty(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);

    let output = `[${timestamp}] ${level} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack:\n${entry.error.stack
          .split('\n')
          .map((line) => `    ${line}`)
          .join('\n')}`;
      }
    }

    return output;
  }

  /**
   * Check if message should be logged based on configured level
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Log a message
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createEntry(level, message, context, error);
    this.config.outputStream!(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    this.log('error', message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext: Record<string, unknown>): Logger {
    return new Logger({
      ...this.config,
      outputStream: (entry: LogEntry) => {
        const mergedEntry = {
          ...entry,
          context: {
            ...childContext,
            ...(entry.context || {}),
          },
        };
        this.config.outputStream!(mergedEntry);
      },
    });
  }

  /**
   * Get current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Update logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger instance with custom configuration
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}
