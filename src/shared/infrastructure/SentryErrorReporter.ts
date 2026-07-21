import { ErrorReporter } from '../domain/ErrorReporter';

type SentryModule = {
  init(options: { dsn: string; enableAutoSessionTracking?: boolean; environment?: string }): void;
  captureException(error: Error, context?: { extra?: Record<string, unknown> }): void;
  setUser(user: { id: string } | null): void;
};

let sentry: SentryModule | null = null;

async function loadSentry(): Promise<SentryModule | null> {
  try {
    if (sentry) return sentry;
    const mod = await import('@sentry/react-native');
    sentry = mod as unknown as SentryModule;
    return sentry;
  } catch {
    return null;
  }
}

export class SentryErrorReporter implements ErrorReporter {
  private initialized = false;

  async init(dsn: string): Promise<void> {
    const mod = await loadSentry();
    if (!mod) return;
    mod.init({
      dsn,
      enableAutoSessionTracking: true,
      environment: __DEV__ ? 'development' : 'production',
    });
    this.initialized = true;
  }

  async captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
    if (!this.initialized) return;
    sentry?.captureException(error, { extra: context });
  }

  async setUser(user: { id: string } | null): Promise<void> {
    if (!this.initialized) return;
    sentry?.setUser(user);
  }
}
