import { WidgetConfig } from '../types';
import { WidgetError } from '../core/WidgetError';
import { WIDGET_ERRORS } from '../constants';

export function validateConfig(config: WidgetConfig): void {
  if (!config.siteId || typeof config.siteId !== 'string') {
    throw new WidgetError('Site ID is required and must be a string', WIDGET_ERRORS.INVALID_CONFIG);
  }

  if (config.mode && !['button', 'widget'].includes(config.mode)) {
    throw new WidgetError('Mode must be "button" or "widget"', WIDGET_ERRORS.INVALID_CONFIG);
  }

  if (config.position && !['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(config.position)) {
    throw new WidgetError('Invalid position specified', WIDGET_ERRORS.INVALID_CONFIG);
  }
}
