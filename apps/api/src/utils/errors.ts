export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export const notFound = (resource: string) => new AppError("NOT_FOUND", `${resource} not found`, 404);
export const conflict = (message: string, details?: unknown) => new AppError("CONFLICT", message, 409, details);
export const badRequest = (message: string, details?: unknown) => new AppError("BAD_REQUEST", message, 400, details);
export const unauthorized = () => new AppError("UNAUTHORIZED", "Authentication required", 401);
export const forbidden = () => new AppError("FORBIDDEN", "Insufficient permissions", 403);
export const timeoutError = () => new AppError("REQUEST_TIMEOUT", "Request exceeded the configured timeout", 503);
