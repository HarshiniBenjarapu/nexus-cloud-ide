import { Request, Response, NextFunction } from 'express';

// ──────────────────────────────────────────────────
// Global Error Handler Middleware
// ──────────────────────────────────────────────────
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose: duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with this ${field} already exists.`;
  }

  // Mongoose: validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
  }

  // Mongoose: invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource ID format: ${err.value}`;
  }

  console.error(`[❌ Error] ${statusCode} - ${message}`, err.stack || '');

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ──────────────────────────────────────────────────
// 404 Not Found Handler
// ──────────────────────────────────────────────────
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
  });
};
