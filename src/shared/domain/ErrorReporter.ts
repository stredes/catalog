export interface ErrorReporter {
  captureException(error: Error, context?: Record<string, unknown>): void;
  setUser(user: { id: string } | null): void;
  init(dsn: string): void;
}

export class NoopErrorReporter implements ErrorReporter {
  captureException(): void {}
  setUser(): void {}
  init(): void {}
}
