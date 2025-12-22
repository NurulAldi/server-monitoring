// Middleware global error handler
// Menangkap semua error yang terjadi di aplikasi dan memberikan response yang konsisten

const { logger } = require('../utilitas/logger');
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalAPIError,
  SocketError,
  BusinessLogicError,
  FileError
} = require('../utilitas/customErrors');

// Error handler middleware (HARUS memiliki 4 parameter: err, req, res, next)
function errorHandler(err, req, res, next) {
  // Log error dengan context
  logger.logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Handle custom AppError instances
  if (err instanceof AppError) {
    const errorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        timestamp: err.timestamp
      }
    };

    // Add additional details untuk certain error types
    if (err instanceof ValidationError && err.details) {
      errorResponse.error.details = err.details;
    }

    if (err instanceof AuthorizationError && err.requiredRole) {
      errorResponse.error.requiredRole = err.requiredRole;
    }

    if (err instanceof RateLimitError && err.retryAfter) {
      res.set('Retry-After', err.retryAfter);
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = err.stack;
      errorResponse.error.name = err.name;
    }

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle legacy error types (backward compatibility)
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = ERROR_CODE.INTERNAL_ERROR;
  let message = 'Terjadi kesalahan server. Silakan coba lagi nanti.';
  let details = null;

  // Handle berbagai jenis error
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODE.VALIDATION_ERROR;
    message = 'Data yang dikirim tidak valid.';
    details = Object.values(err.errors).map(e => e.message);

  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODE.INVALID_FORMAT;
    message = 'Format ID tidak valid.';

  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = HTTP_STATUS.CONFLICT;
    errorCode = ERROR_CODE.ALREADY_EXISTS;
    message = 'Data sudah ada di sistem.';

  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODE.INVALID_TOKEN;
    message = 'Token autentikasi tidak valid.';

  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODE.TOKEN_EXPIRED;
    message = 'Token autentikasi sudah expired. Silakan login ulang.';

  } else if (err.message.includes('rate limit')) {
    // Rate limiting error
    statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    errorCode = ERROR_CODE.TOO_MANY_REQUESTS;
    message = 'Terlalu banyak request. Silakan tunggu beberapa saat.';

  } else if (err.message.includes('not found') || err.message.includes('tidak ditemukan')) {
    // Not found error
    statusCode = HTTP_STATUS.NOT_FOUND;
    errorCode = ERROR_CODE.NOT_FOUND;
    message = err.message;

  } else if (err.message.includes('unauthorized') || err.message.includes('tidak diizinkan')) {
    // Authorization error
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODE.UNAUTHORIZED;
    message = err.message;

  } else if (err.message.includes('forbidden') || err.message.includes('dilarang')) {
    // Forbidden error
    statusCode = HTTP_STATUS.FORBIDDEN;
    errorCode = ERROR_CODE.FORBIDDEN;
    message = err.message;

  } else if (err.message.includes('database') || err.message.includes('MongoDB')) {
    // Database error
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    errorCode = ERROR_CODE.DATABASE_ERROR;
    message = 'Kesalahan database. Silakan coba lagi nanti.';
    // Jangan expose detail database error ke user

  } else if (err.message.includes('AI') || err.message.includes('OpenAI') || err.message.includes('Gemini')) {
    // AI service error
    statusCode = HTTP_STATUS.BAD_GATEWAY;
    errorCode = ERROR_CODE.EXTERNAL_API_ERROR;
    message = 'Layanan AI sedang bermasalah. Silakan coba lagi nanti.';

  } else if (err.message.includes('email') || err.message.includes('SMTP')) {
    // Email service error
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    errorCode = ERROR_CODE.INTERNAL_ERROR;
    message = 'Layanan email sedang bermasalah.';

  } else {
    // Generic error - log stack trace untuk debugging
    console.error('Unhandled error:', err.stack);
  }

  // Response format konsisten
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(details && { details }), // Include details jika ada
      timestamp: new Date().toISOString()
    }
  };

  // Add additional info untuk development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.name = err.name;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
}

// Middleware untuk handle 404 - Not Found
function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.method} ${req.url} tidak ditemukan`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
}

// Middleware untuk handle async errors (wrapper untuk async functions)
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Middleware untuk handle validation errors dari express-validator
function validationErrorHandler(req, res, next) {
  const errors = req.validationErrors || [];

  if (errors.length > 0) {
    const error = new ValidationError('Validasi gagal', errors.map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    })));
    return next(error);
  }

  next();
}

// Socket.IO error handler
function handleSocketError(socket, error, eventName = null) {
  // Log socket error
  logger.logError(error, {
    socketId: socket.id,
    userId: socket.userId || 'anonymous',
    event: eventName,
    type: 'socket_error',
    timestamp: new Date().toISOString()
  });

  // Emit error event to client
  const errorData = {
    success: false,
    error: {
      code: error.errorCode || ERROR_CODE.INTERNAL_ERROR,
      message: error.message || 'Terjadi kesalahan pada koneksi real-time',
      timestamp: new Date().toISOString()
    }
  };

  // Add event context if available
  if (eventName) {
    errorData.error.event = eventName;
  }

  // Send error to client
  socket.emit('error', errorData);
}

// Async error wrapper untuk Socket.IO event handlers
function asyncSocketHandler(fn) {
  return async (socket, data, callback) => {
    try {
      const result = await fn(socket, data);
      if (callback) callback({ success: true, data: result });
    } catch (error) {
      logger.logError(error, {
        socketId: socket.id,
        userId: socket.userId || 'anonymous',
        event: data?.event || 'unknown',
        type: 'socket_handler_error',
        timestamp: new Date().toISOString()
      });

      if (callback) {
        callback({
          success: false,
          error: {
            code: error.errorCode || ERROR_CODE.INTERNAL_ERROR,
            message: error.message || 'Terjadi kesalahan pada operasi real-time',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        handleSocketError(socket, error, data?.event);
      }
    }
  };
}

// Export semua error handlers
module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  validationErrorHandler,
  handleSocketError,
  asyncSocketHandler
};