/**
 * Errors returned by the backend API.
 */
class ApiError extends Error {
  public code?: number;
  constructor(message?: string, code?: number) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.code = code;
  }
}

enum ApiErrorCodes {
  SESSION_EXPIRED = 499,
}

const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error;

export { ApiError, ApiErrorCodes, isApiError, isNodeError };
