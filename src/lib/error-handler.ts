// Enhanced error handling and monitoring
import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  status: number;
  timestamp: string;
  path?: string;
  userId?: string;
}

export class AppError extends Error {
  public status: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown, path?: string): NextResponse {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
    
    // Handle specific error types
    if (error.message.includes('validation')) {
      status = 400;
      code = 'VALIDATION_ERROR';
    } else if (error.message.includes('unauthorized')) {
      status = 401;
      code = 'UNAUTHORIZED';
    } else if (error.message.includes('not found')) {
      status = 404;
      code = 'NOT_FOUND';
    }
  }

  // Log error for monitoring
  console.error(`API Error [${code}]: ${message}`, {
    path,
    status,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined
  });

  const apiError: ApiError = {
    code,
    message,
    status,
    timestamp: new Date().toISOString(),
    path
  };

  return NextResponse.json({ error: apiError }, { status });
}

// Common error types
export const ERRORS = {
  VALIDATION_ERROR: (message: string) => new AppError(message, 400, 'VALIDATION_ERROR'),
  UNAUTHORIZED: (message: string = 'Unauthorized') => new AppError(message, 401, 'UNAUTHORIZED'),
  FORBIDDEN: (message: string = 'Forbidden') => new AppError(message, 403, 'FORBIDDEN'),
  NOT_FOUND: (message: string = 'Resource not found') => new AppError(message, 404, 'NOT_FOUND'),
  CONFLICT: (message: string = 'Resource conflict') => new AppError(message, 409, 'CONFLICT'),
  RATE_LIMITED: (message: string = 'Rate limit exceeded') => new AppError(message, 429, 'RATE_LIMITED'),
  FILE_TOO_LARGE: (message: string = 'File too large') => new AppError(message, 413, 'FILE_TOO_LARGE'),
  INVALID_FILE_TYPE: (message: string = 'Invalid file type') => new AppError(message, 400, 'INVALID_FILE_TYPE'),
} as const;
