import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error (in production, use proper logging service)
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Don't expose internal errors to client
  const clientMessage = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : message;

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

