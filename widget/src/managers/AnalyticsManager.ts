import { WidgetSettings, AnalyticsEventData } from '../types';

export class AnalyticsManager {
  private settings: WidgetSettings | null = null;
  private siteId: string;
  private getSessionId: () => string;

  constructor(
    siteId: string,
    getSessionId: () => string
  ) {
    this.siteId = siteId;
    this.getSessionId = getSessionId;
  }

  public setSettings(settings: WidgetSettings | null): void {
    this.settings = settings;
  }

  public trackAnalyticsEvent(eventName: string, eventData?: AnalyticsEventData): void {
    if (!this.settings?.enableAnalytics) return;

    const event = {
      event: eventName,
      timestamp: new Date().toISOString(),
      siteId: this.siteId,
      sessionId: this.getSessionId(),
      ...eventData,
    };

    // Track message events
    if (this.settings?.trackMessageEvents && eventName.startsWith('message_')) {
      console.debug('[Intelligentconvo Analytics]', event);
      // Could send to analytics endpoint here
    }

    // Track user interactions
    if (this.settings?.trackUserInteractions && !eventName.startsWith('message_')) {
      console.debug('[Intelligentconvo Analytics]', event);
      // Could send to analytics endpoint here
    }
  }
}
