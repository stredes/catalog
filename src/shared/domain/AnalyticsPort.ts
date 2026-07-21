export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: string;
};

export interface AnalyticsPort {
  track(event: AnalyticsEvent): Promise<void>;
  getEvents(name: string): Promise<AnalyticsEvent[]>;
}
