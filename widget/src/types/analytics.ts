/**
 * Analytics event data types
 */

export interface AnalyticsEventData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsEvent {
  event: string;
  timestamp: string;
  siteId: string;
  sessionId: string;
  eventData?: AnalyticsEventData;
}
