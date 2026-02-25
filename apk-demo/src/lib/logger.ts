/**
 * Production-ready logging utility
 *
 * Features:
 * - Environment-aware logging (dev vs production)
 * - Log levels (debug, info, warn, error)
 * - Structured logging with context
 * - Ready for error tracking integration (Sentry, LogRocket, etc.)
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.debug('User action', { userId: 123, action: 'click' });
 * logger.info('API call successful', { endpoint: '/api/search', duration: 150 });
 * logger.warn('Slow query detected', { query: 'SELECT *', duration: 5000 });
 * logger.error('Database connection failed', error, { database: 'postgres' });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev: boolean;
  private isDebug: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';
  }

  /**
   * Determine if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') return true;

    // Log info in development or when debug is enabled
    if (level === 'info') return this.isDev || this.isDebug;

    // Log debug only when explicitly enabled
    if (level === 'debug') return this.isDebug;

    return false;
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${levelUpper} ${message}`;
  }

  /**
   * Log debug messages (only in debug mode)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage('debug', message);
    if (context && Object.keys(context).length > 0) {
      console.log(formatted, context);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log informational messages (development only)
   * Use for general application flow
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.formatMessage('info', message);
    if (context && Object.keys(context).length > 0) {
      console.info(formatted, context);
    } else {
      console.info(formatted);
    }
  }

  /**
   * Log warning messages (always logged)
   * Use for recoverable errors or unexpected situations
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const formatted = this.formatMessage('warn', message);
    if (context && Object.keys(context).length > 0) {
      console.warn(formatted, context);
    } else {
      console.warn(formatted);
    }
  }

  /**
   * Log error messages (always logged)
   * Use for errors that need attention
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const formatted = this.formatMessage('error', message);

    // Build error context
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    if (Object.keys(errorContext).length > 0) {
      console.error(formatted, errorContext);
    } else {
      console.error(formatted);
    }

    // TODO: Send to error tracking service in production
    // Example integrations:

    // Sentry
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     extra: context,
    //     tags: { source: 'logger' },
    //   });
    // }

    // LogRocket
    // if (typeof window !== 'undefined' && window.LogRocket) {
    //   window.LogRocket.captureException(error, {
    //     extra: context,
    //   });
    // }

    // Custom API
    // if (process.env.NODE_ENV === 'production') {
    //   fetch('/api/log-error', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       message,
    //       error: error instanceof Error ? {
    //         name: error.name,
    //         message: error.message,
    //         stack: error.stack,
    //       } : error,
    //       context,
    //       timestamp: new Date().toISOString(),
    //     }),
    //   }).catch(() => {
    //     // Silently fail - don't want logging to break the app
    //   });
    // }
  }

  /**
   * Create a scoped logger with a prefix
   * Useful for component-specific or module-specific logging
   *
   * @example
   * const log = logger.scope('CategoryPage');
   * log.info('Component mounted');
   * // Output: [2025-10-30T00:00:00.000Z] INFO  [CategoryPage] Component mounted
   */
  scope(prefix: string): ScopedLogger {
    return new ScopedLogger(this, prefix);
  }
}

/**
 * Scoped logger for component or module-specific logging
 */
class ScopedLogger {
  constructor(private logger: Logger, private prefix: string) {}

  private addPrefix(message: string): string {
    return `[${this.prefix}] ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.addPrefix(message), context);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(this.addPrefix(message), context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.addPrefix(message), context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.logger.error(this.addPrefix(message), error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for consumers
export type { LogContext, LogLevel };
