import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Logger,
  createLogger,
  logger,
  type LogEntry,
  type LogLevel,
} from '../logger';

describe('logger', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockOutputStream: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockOutputStream = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Logger', () => {
    describe('configuration', () => {
      it('should use default production config', () => {
        process.env.NODE_ENV = 'production';
        const testLogger = new Logger();
        const config = testLogger.getConfig();

        expect(config.level).toBe('info');
        expect(config.format).toBe('json');
      });

      it('should use default development config', () => {
        process.env.NODE_ENV = 'development';
        const testLogger = new Logger();
        const config = testLogger.getConfig();

        expect(config.level).toBe('debug');
        expect(config.format).toBe('pretty');
      });

      it('should use LOG_LEVEL from environment', () => {
        process.env.LOG_LEVEL = 'warn';
        const testLogger = new Logger();
        const config = testLogger.getConfig();

        expect(config.level).toBe('warn');
      });

      it('should use LOG_FORMAT from environment', () => {
        process.env.LOG_FORMAT = 'json';
        const testLogger = new Logger();
        const config = testLogger.getConfig();

        expect(config.format).toBe('json');
      });

      it('should use custom config', () => {
        const testLogger = new Logger({
          level: 'error',
          format: 'json',
          outputStream: mockOutputStream,
        });
        const config = testLogger.getConfig();

        expect(config.level).toBe('error');
        expect(config.format).toBe('json');
        expect(config.outputStream).toBe(mockOutputStream);
      });

      it('should update config with setConfig', () => {
        const testLogger = new Logger();
        testLogger.setConfig({ level: 'error' });
        const config = testLogger.getConfig();

        expect(config.level).toBe('error');
      });
    });

    describe('log levels', () => {
      it('should log debug messages', () => {
        const testLogger = new Logger({
          level: 'debug',
          outputStream: mockOutputStream,
        });

        testLogger.debug('Debug message', { key: 'value' });

        expect(mockOutputStream).toHaveBeenCalledTimes(1);
        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.level).toBe('debug');
        expect(entry.message).toBe('Debug message');
        expect(entry.context).toEqual({ key: 'value' });
      });

      it('should log info messages', () => {
        const testLogger = new Logger({
          level: 'info',
          outputStream: mockOutputStream,
        });

        testLogger.info('Info message');

        expect(mockOutputStream).toHaveBeenCalledTimes(1);
        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.level).toBe('info');
        expect(entry.message).toBe('Info message');
      });

      it('should log warn messages', () => {
        const testLogger = new Logger({
          level: 'warn',
          outputStream: mockOutputStream,
        });

        testLogger.warn('Warning message');

        expect(mockOutputStream).toHaveBeenCalledTimes(1);
        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.level).toBe('warn');
        expect(entry.message).toBe('Warning message');
      });

      it('should log error messages', () => {
        const testLogger = new Logger({
          level: 'error',
          outputStream: mockOutputStream,
        });

        const error = new Error('Test error');
        testLogger.error('Error message', error, { context: 'test' });

        expect(mockOutputStream).toHaveBeenCalledTimes(1);
        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.level).toBe('error');
        expect(entry.message).toBe('Error message');
        expect(entry.context).toEqual({ context: 'test' });
        expect(entry.error).toEqual({
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      });
    });

    describe('log filtering', () => {
      it('should not log debug when level is info', () => {
        const testLogger = new Logger({
          level: 'info',
          outputStream: mockOutputStream,
        });

        testLogger.debug('Debug message');

        expect(mockOutputStream).not.toHaveBeenCalled();
      });

      it('should not log info when level is warn', () => {
        const testLogger = new Logger({
          level: 'warn',
          outputStream: mockOutputStream,
        });

        testLogger.info('Info message');

        expect(mockOutputStream).not.toHaveBeenCalled();
      });

      it('should not log warn when level is error', () => {
        const testLogger = new Logger({
          level: 'error',
          outputStream: mockOutputStream,
        });

        testLogger.warn('Warning message');

        expect(mockOutputStream).not.toHaveBeenCalled();
      });

      it('should log all levels when level is debug', () => {
        const testLogger = new Logger({
          level: 'debug',
          outputStream: mockOutputStream,
        });

        testLogger.debug('Debug');
        testLogger.info('Info');
        testLogger.warn('Warn');
        testLogger.error('Error');

        expect(mockOutputStream).toHaveBeenCalledTimes(4);
      });
    });

    describe('log entry format', () => {
      it('should include timestamp', () => {
        const testLogger = new Logger({
          outputStream: mockOutputStream,
        });

        testLogger.info('Test message');

        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.timestamp).toBeDefined();
        expect(new Date(entry.timestamp).toString()).not.toBe('Invalid Date');
      });

      it('should include context when provided', () => {
        const testLogger = new Logger({
          outputStream: mockOutputStream,
        });

        testLogger.info('Test message', { key: 'value', num: 123 });

        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.context).toEqual({ key: 'value', num: 123 });
      });

      it('should not include context when empty', () => {
        const testLogger = new Logger({
          outputStream: mockOutputStream,
        });

        testLogger.info('Test message', {});

        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.context).toBeUndefined();
      });

      it('should include error details when provided', () => {
        const testLogger = new Logger({
          outputStream: mockOutputStream,
        });

        const error = new Error('Test error');
        testLogger.error('Error occurred', error);

        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.error).toEqual({
          name: 'Error',
          message: 'Test error',
          stack: error.stack,
        });
      });
    });

    describe('child logger', () => {
      it('should create child logger with inherited context', () => {
        const testLogger = new Logger({
          outputStream: mockOutputStream,
        });

        const childLogger = testLogger.child({ service: 'deployment' });
        childLogger.info('Test message', { action: 'deploy' });

        expect(mockOutputStream).toHaveBeenCalledTimes(1);
        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.context).toEqual({
          service: 'deployment',
          action: 'deploy',
        });
      });

      it('should merge child context with log context', () => {
        const testLogger = new Logger({
          outputStream: mockOutputStream,
        });

        const childLogger = testLogger.child({ service: 'deployment' });
        childLogger.info('Test message', { step: 'validate' });

        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.context).toEqual({
          service: 'deployment',
          step: 'validate',
        });
      });

      it('should prioritize log context over child context', () => {
        const testLogger = new Logger({
          outputStream: mockOutputStream,
        });

        const childLogger = testLogger.child({ key: 'child' });
        childLogger.info('Test message', { key: 'log' });

        const entry = mockOutputStream.mock.calls[0][0] as LogEntry;
        expect(entry.context).toEqual({ key: 'log' });
      });
    });

    describe('default output stream', () => {
      let consoleSpy: {
        debug: ReturnType<typeof vi.spyOn>;
        info: ReturnType<typeof vi.spyOn>;
        warn: ReturnType<typeof vi.spyOn>;
        error: ReturnType<typeof vi.spyOn>;
      };

      beforeEach(() => {
        consoleSpy = {
          debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
          info: vi.spyOn(console, 'info').mockImplementation(() => {}),
          warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
          error: vi.spyOn(console, 'error').mockImplementation(() => {}),
        };
      });

      it('should use console.debug for debug logs', () => {
        const testLogger = new Logger({ level: 'debug' });
        testLogger.debug('Debug message');

        expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
      });

      it('should use console.info for info logs', () => {
        const testLogger = new Logger({ level: 'info' });
        testLogger.info('Info message');

        expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      });

      it('should use console.warn for warn logs', () => {
        const testLogger = new Logger({ level: 'warn' });
        testLogger.warn('Warning message');

        expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      });

      it('should use console.error for error logs', () => {
        const testLogger = new Logger({ level: 'error' });
        testLogger.error('Error message');

        expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      });

      it('should output JSON format in production', () => {
        const testLogger = new Logger({
          level: 'info',
          format: 'json',
        });
        testLogger.info('Test message');

        expect(consoleSpy.info).toHaveBeenCalledTimes(1);
        const output = consoleSpy.info.mock.calls[0][0];
        expect(() => JSON.parse(output as string)).not.toThrow();
      });

      it('should output pretty format in development', () => {
        const testLogger = new Logger({
          level: 'info',
          format: 'pretty',
        });
        testLogger.info('Test message');

        expect(consoleSpy.info).toHaveBeenCalledTimes(1);
        const output = consoleSpy.info.mock.calls[0][0] as string;
        expect(output).toContain('Test message');
        expect(output).toContain('INFO');
      });
    });
  });

  describe('createLogger', () => {
    it('should create new logger instance', () => {
      const newLogger = createLogger({ level: 'warn' });
      expect(newLogger).toBeInstanceOf(Logger);
      expect(newLogger.getConfig().level).toBe('warn');
    });

    it('should create independent instances', () => {
      const logger1 = createLogger({ level: 'debug' });
      const logger2 = createLogger({ level: 'error' });

      expect(logger1.getConfig().level).toBe('debug');
      expect(logger2.getConfig().level).toBe('error');
    });
  });

  describe('default logger instance', () => {
    it('should be a Logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should use default configuration', () => {
      const config = logger.getConfig();
      expect(config.level).toBeDefined();
      expect(config.format).toBeDefined();
    });
  });
});
