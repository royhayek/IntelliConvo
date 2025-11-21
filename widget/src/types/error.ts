/**
 * Error types and details
 */

export interface ErrorDetails {
  code?: string;
  statusCode?: number;
  message?: string;
  stack?: string;
  [key: string]: string | number | boolean | null | undefined;
}
