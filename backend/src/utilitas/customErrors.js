// Custom Error Classes untuk error handling yang konsisten
// Setiap error class memiliki kode, pesan, dan status HTTP yang sesuai

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');

/**
 * Base Error Class untuk semua custom errors
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = ERROR_CODE.INTERNAL_ERROR, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational; // Error yang dapat diantisipasi vs programming error
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error untuk validasi input data
 */
class ValidationError extends AppError {
  constructor(message = 'Data yang dikirim tidak valid', details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODE.VALIDATION_ERROR);
    this.details = details;
    this.name = 'ValidationError';
  }
}

/**
 * Error untuk autentikasi (login, token, dll)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Autentikasi gagal', errorCode = ERROR_CODE.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, errorCode);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error untuk otorisasi (permission, role, dll)
 */
class AuthorizationError extends AppError {
  constructor(message = 'Tidak memiliki izin akses', requiredRole = null) {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODE.INSUFFICIENT_PERMISSIONS);
    this.name = 'AuthorizationError';
    this.requiredRole = requiredRole;
  }
}

/**
 * Error untuk resource yang tidak ditemukan
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = null) {
    const message = identifier ? `${resource} dengan ID ${identifier} tidak ditemukan` : `${resource} tidak ditemukan`;
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODE.NOT_FOUND);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.identifier = identifier;
  }
}

/**
 * Error untuk konflik data (duplicate, dll)
 */
class ConflictError extends AppError {
  constructor(message = 'Data sudah ada di sistem', field = null) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODE.ALREADY_EXISTS);
    this.name = 'ConflictError';
    this.field = field;
  }
}

/**
 * Error untuk rate limiting
 */
class RateLimitError extends AppError {
  constructor(message = 'Terlalu banyak request', retryAfter = null) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODE.TOO_MANY_REQUESTS);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error untuk database operations
 */
class DatabaseError extends AppError {
  constructor(message = 'Kesalahan database', operation = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODE.DATABASE_ERROR);
    this.name = 'DatabaseError';
    this.operation = operation;
  }
}

/**
 * Error untuk external API calls
 */
class ExternalAPIError extends AppError {
  constructor(service = 'External Service', message = 'Layanan eksternal bermasalah') {
    super(message, HTTP_STATUS.BAD_GATEWAY, ERROR_CODE.EXTERNAL_API_ERROR);
    this.name = 'ExternalAPIError';
    this.service = service;
  }
}

/**
 * Error untuk Socket.IO operations
 */
class SocketError extends AppError {
  constructor(message = 'Kesalahan koneksi real-time', event = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODE.INTERNAL_ERROR);
    this.name = 'SocketError';
    this.event = event;
  }
}

/**
 * Error untuk business logic violations
 */
class BusinessLogicError extends AppError {
  constructor(message = 'Operasi tidak diizinkan', rule = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODE.VALIDATION_ERROR);
    this.name = 'BusinessLogicError';
    this.rule = rule;
  }
}

/**
 * Error untuk file operations
 */
class FileError extends AppError {
  constructor(message = 'Kesalahan file system', operation = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODE.INTERNAL_ERROR);
    this.name = 'FileError';
    this.operation = operation;
  }
}

module.exports = {
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
};