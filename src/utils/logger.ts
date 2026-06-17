type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, tag: string, message: string, ...args: unknown[]) {
    if (!__DEV__) {
      // Production: plug in Crashlytics / Sentry here when needed
      return;
    }
    const prefix = `[${level.toUpperCase()}][${tag}]`;
    switch (level) {
      case 'debug': console.debug(prefix, message, ...args); break;
      case 'info':  console.info(prefix, message, ...args);  break;
      case 'warn':  console.warn(prefix, message, ...args);  break;
      case 'error': console.error(prefix, message, ...args); break;
    }
  }

  debug(tag: string, message: string, ...args: unknown[]) { this.log('debug', tag, message, ...args); }
  info(tag: string, message: string, ...args: unknown[])  { this.log('info',  tag, message, ...args); }
  warn(tag: string, message: string, ...args: unknown[])  { this.log('warn',  tag, message, ...args); }
  error(tag: string, message: string, ...args: unknown[]) { this.log('error', tag, message, ...args); }
}

export const logger = Logger.getInstance();
