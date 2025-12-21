// Utilitas logger menggunakan Winston
// Untuk logging aplikasi dengan berbagai level dan output

const winston = require('winston');
const path = require('path');

// Konfigurasi logger
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info', // error, warn, info, debug
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }), // Include stack trace untuk error
    winston.format.json() // Format JSON untuk structured logging
  ),
  defaultMeta: { service: 'monitoring-server' },
  exitOnError: false // Jangan exit process saat error
};

// Format console untuk development (lebih readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(), // Warna untuk level log
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
  })
);

// Transport untuk console (development)
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.LOG_LEVEL || 'debug' // Console lebih verbose
});

// Transport untuk file (production)
const fileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/app.log'),
  level: 'info', // File log level lebih rendah
  maxsize: 5242880, // 5MB per file
  maxFiles: 5, // Maksimal 5 file log
  tailable: true // File terbaru yang di-append
});

// Transport untuk error log terpisah
const errorFileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/error.log'),
  level: 'error', // Hanya error
  maxsize: 5242880, // 5MB per file
  maxFiles: 3, // Maksimal 3 file error log
  tailable: true
});

// Buat logger instance
const logger = winston.createLogger({
  ...loggerConfig,
  transports: [
    consoleTransport,
    fileTransport,
    errorFileTransport
  ]
});

// Fungsi helper untuk logging dengan context
function logRequest(req, res, next) {
  const start = Date.now();

  // Log request masuk
  logger.info('Request masuk', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end untuk log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;

    logger.info('Response keluar', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    originalEnd.apply(this, args);
  };

  next();
}

// Fungsi untuk log error dengan context
function logError(error, context = {}) {
  logger.error('Error terjadi', {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log aktivitas user
function logUserActivity(userId, action, details = {}) {
  logger.info('Aktivitas user', {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log aktivitas sistem
function logSystemActivity(action, details = {}) {
  logger.info('Aktivitas sistem', {
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log database operations
function logDatabase(operation, collection, details = {}) {
  logger.debug('Database operation', {
    operation,
    collection,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log AI requests
function logAIRequest(provider, model, tokens, duration) {
  logger.info('AI request', {
    provider,
    model,
    tokens,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log email sending
function logEmailSend(recipients, subject, success, error = null) {
  const level = success ? 'info' : 'error';
  const message = success ? 'Email berhasil dikirim' : 'Email gagal dikirim';

  logger.log(level, message, {
    recipients: Array.isArray(recipients) ? recipients : [recipients],
    subject,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk create child logger dengan context tambahan
function createChildLogger(context) {
  return logger.child(context);
}

// Export logger dan helper functions
module.exports = {
  logger,
  logRequest,
  logError,
  logUserActivity,
  logSystemActivity,
  logDatabase,
  logAIRequest,
  logEmailSend,
  createChildLogger
};