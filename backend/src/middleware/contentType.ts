import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from './errors';

/**
 * Content-Type Validation Middleware
 * Ensures requests have the correct Content-Type header for the expected payload
 */

/**
 * Validates that the request has a JSON Content-Type header
 * Should be applied to routes that expect JSON request bodies
 *
 * @example
 * router.post('/api/users', validateJsonContentType, async (req, res) => {
 *   // Request body will be JSON
 * });
 */
export function validateJsonContentType(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip validation for GET, HEAD, DELETE methods (no body expected)
  if (['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Skip validation if no body is expected (Content-Length: 0)
  const contentLength = req.headers['content-length'];
  if (contentLength === '0' || contentLength === undefined) {
    return next();
  }

  // Check Content-Type header
  const contentType = req.headers['content-type'];

  if (!contentType) {
    return next(
      new AppError(
        415,
        ErrorCode.VALIDATION_ERROR,
        'Content-Type header is required for requests with a body'
      )
    );
  }

  // Validate JSON Content-Type
  if (!contentType.includes('application/json')) {
    return next(
      new AppError(
        415,
        ErrorCode.VALIDATION_ERROR,
        `Invalid Content-Type. Expected 'application/json', received '${contentType}'`
      )
    );
  }

  next();
}

/**
 * Validates that the request has a multipart/form-data Content-Type header
 * Should be applied to file upload routes
 *
 * @example
 * router.post('/api/upload', validateMultipartContentType, upload.single('file'), async (req, res) => {
 *   // Request will have file upload
 * });
 */
export function validateMultipartContentType(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check Content-Type header
  const contentType = req.headers['content-type'];

  if (!contentType) {
    return next(
      new AppError(
        415,
        ErrorCode.VALIDATION_ERROR,
        'Content-Type header is required for file uploads'
      )
    );
  }

  // Validate multipart/form-data Content-Type
  if (!contentType.includes('multipart/form-data')) {
    return next(
      new AppError(
        415,
        ErrorCode.VALIDATION_ERROR,
        `Invalid Content-Type. Expected 'multipart/form-data', received '${contentType}'`
      )
    );
  }

  next();
}

/**
 * Creates a custom Content-Type validator for specific types
 *
 * @param expectedTypes - Array of acceptable Content-Type values (e.g., ['application/xml', 'text/xml'])
 * @param errorMessage - Optional custom error message
 * @returns Express middleware function
 *
 * @example
 * const validateXml = createContentTypeValidator(['application/xml', 'text/xml'], 'XML content required');
 * router.post('/api/xml', validateXml, async (req, res) => {
 *   // Request body will be XML
 * });
 */
export function createContentTypeValidator(
  expectedTypes: string[],
  errorMessage?: string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip validation for GET, HEAD, DELETE methods
    if (['GET', 'HEAD', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Skip validation if no body is expected
    const contentLength = req.headers['content-length'];
    if (contentLength === '0' || contentLength === undefined) {
      return next();
    }

    // Check Content-Type header
    const contentType = req.headers['content-type'];

    if (!contentType) {
      return next(
        new AppError(
          415,
          ErrorCode.VALIDATION_ERROR,
          'Content-Type header is required for requests with a body'
        )
      );
    }

    // Validate against expected types
    const isValid = expectedTypes.some((type) => contentType.includes(type));

    if (!isValid) {
      const message =
        errorMessage ||
        `Invalid Content-Type. Expected one of [${expectedTypes.join(', ')}], received '${contentType}'`;

      return next(new AppError(415, ErrorCode.VALIDATION_ERROR, message));
    }

    next();
  };
}

/**
 * Validates that requests with query parameters only are not sending a body
 * Useful for GET endpoints that should only accept query parameters
 *
 * @example
 * router.get('/api/users', rejectUnexpectedBody, async (req, res) => {
 *   // Ensures no body is sent with GET request
 * });
 */
export function rejectUnexpectedBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const contentLength = req.headers['content-length'];

  // Check if body exists
  if (contentLength && parseInt(contentLength) > 0) {
    return next(
      new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        `${req.method} requests should not include a request body`
      )
    );
  }

  next();
}
