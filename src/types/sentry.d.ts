declare module '@sentry/react-native' {
  export function init(options: {
    dsn: string;
    enableAutoSessionTracking?: boolean;
    environment?: string;
  }): void;
  export function captureException(
    error: Error,
    context?: { extra?: Record<string, unknown> },
  ): void;
  export function setUser(user: { id: string } | null): void;
}
