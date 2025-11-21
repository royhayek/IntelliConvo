import { WidgetErrorCode } from '../constants';
import { ErrorDetails } from '../types/error';

export class WidgetError extends Error {
  constructor(
    message: string,
    public code: WidgetErrorCode,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = 'WidgetError';

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WidgetError);
    }
  }
}
