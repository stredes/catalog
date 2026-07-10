import { LoggerPort } from './LoggerPort';

export class DevelopmentLogger implements LoggerPort {
  debug(message: string, ...args: unknown[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}
