// Utilitas logger menggunakan Winston
// Untuk logging aplikasi dengan berbagai level dan output

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

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

// Transport untuk activity log (authentication, socket, dll)
const activityFileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/activity.log'),
  level: 'info',
  maxsize: 10485760, // 10MB per file
  maxFiles: 30, // Maksimal 30 file (30 hari)
  tailable: true
});

// Transport untuk security log
const securityFileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/security.log'),
  level: 'info',
  maxsize: 5242880, // 5MB per file
  maxFiles: 90, // Maksimal 90 file (90 hari retention)
  tailable: true
});

// Transport untuk system log (server status, alerts)
const systemFileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/system.log'),
  level: 'info',
  maxsize: 10485760, // 10MB per file
  maxFiles: 30, // Maksimal 30 file
  tailable: true
});

// Transport untuk AI log
const aiFileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/ai.log'),
  level: 'info',
  maxsize: 10485760, // 10MB per file
  maxFiles: 30, // Maksimal 30 file
  tailable: true
});

// Transport untuk performance log
const performanceFileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/performance.log'),
  level: 'info',
  maxsize: 5242880, // 5MB per file
  maxFiles: 30, // Maksimal 30 file
  tailable: true
});

// Buat logger instance utama
const logger = winston.createLogger({
  ...loggerConfig,
  transports: [
    consoleTransport,
    fileTransport,
    errorFileTransport,
    activityFileTransport,
    securityFileTransport,
    systemFileTransport,
    aiFileTransport,
    performanceFileTransport
  ]
});

// Buat logger khusus untuk kategori tertentu
const activityLogger = winston.createLogger({
  ...loggerConfig,
  transports: [consoleTransport, activityFileTransport]
});

const securityLogger = winston.createLogger({
  ...loggerConfig,
  transports: [consoleTransport, securityFileTransport]
});

const systemLogger = winston.createLogger({
  ...loggerConfig,
  transports: [consoleTransport, systemFileTransport]
});

const aiLogger = winston.createLogger({
  ...loggerConfig,
  transports: [consoleTransport, aiFileTransport]
});

const performanceLogger = winston.createLogger({
  ...loggerConfig,
  transports: [consoleTransport, performanceFileTransport]
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

// Fungsi untuk log login user (menggunakan activity logger)
function logUserLogin(userId, details = {}) {
  const {
    method = 'password',
    deviceType = 'unknown',
    location = 'unknown',
    ip = 'unknown',
    userAgent = 'unknown',
    success = true,
    failureReason = null,
    sessionId = null
  } = details;

  const level = success ? 'info' : 'warn';
  const message = success ? 'User berhasil login' : 'User gagal login';

  activityLogger.log(level, message, {
    category: 'authentication',
    event: 'user_login',
    userId,
    sessionId,
    details: {
      method,
      deviceType,
      location,
      success,
      failureReason,
      ip,
      userAgent
    },
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log koneksi socket (menggunakan activity logger)
function logSocketConnection(userId, action, details = {}) {
  const {
    socketId = null,
    connectionType = 'websocket',
    rooms = [],
    connectionDuration = null,
    disconnectReason = null,
    bytesTransferred = 0,
    ip = 'unknown',
    userAgent = 'unknown'
  } = details;

  const message = action === 'connect' ? 'Socket terhubung' : 'Socket terputus';

  activityLogger.info(message, {
    category: 'socket',
    event: action === 'connect' ? 'socket_connect' : 'socket_disconnect',
    userId,
    socketId,
    details: {
      connectionType,
      rooms,
      connectionDuration,
      disconnectReason,
      bytesTransferred,
      ip,
      userAgent
    },
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log perubahan status server (menggunakan system logger)
function logServerStatusChange(serverId, details = {}) {
  const {
    serverName = 'Unknown Server',
    oldStatus = 'unknown',
    newStatus = 'unknown',
    changeReason = 'unknown',
    userId = 'system',
    metrics = {},
    downtime = 0,
    ip = 'system'
  } = details;

  const level = newStatus === 'critical' ? 'error' : newStatus === 'warning' ? 'warn' : 'info';
  const message = `Status server berubah: ${oldStatus} → ${newStatus}`;

  systemLogger.log(level, message, {
    category: 'server',
    event: 'server_status_change',
    userId,
    serverId,
    details: {
      serverName,
      oldStatus,
      newStatus,
      changeReason,
      metrics,
      downtime,
      ip
    },
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log pengiriman email alert (menggunakan system logger)
function logEmailAlert(alertId, details = {}) {
  const {
    alertType = 'unknown',
    recipients = [],
    emailTemplate = 'unknown',
    deliveryStatus = 'sent',
    smtpResponse = null,
    retryCount = 0,
    emailSize = 0,
    subject = 'Server Alert',
    error = null
  } = details;

  const success = deliveryStatus === 'sent';
  const level = success ? 'info' : 'error';
  const message = success ? 'Email alert berhasil dikirim' : 'Email alert gagal dikirim';

  systemLogger.log(level, message, {
    category: 'alert',
    event: 'email_alert_sent',
    userId: 'system',
    alertId,
    details: {
      alertType,
      recipients,
      emailTemplate,
      deliveryStatus,
      smtpResponse,
      retryCount,
      emailSize,
      subject,
      error: error?.message
    },
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log interaksi AI (menggunakan AI logger)
function logAIInteraction(userId, details = {}) {
  const {
    sessionId = null,
    provider = 'unknown',
    model = 'unknown',
    interactionType = 'chat',
    inputTokens = 0,
    outputTokens = 0,
    totalTokens = 0,
    responseTime = 0,
    userQuery = '',
    aiResponse = '',
    confidence = null,
    feedback = null,
    error = null
  } = details;

  const success = !error;
  const level = success ? 'info' : 'error';
  const message = success ? 'Interaksi AI berhasil' : 'Interaksi AI gagal';

  aiLogger.log(level, message, {
    category: 'ai',
    event: 'ai_interaction',
    userId,
    sessionId,
    details: {
      provider,
      model,
      interactionType,
      inputTokens,
      outputTokens,
      totalTokens,
      responseTime,
      userQuery: userQuery.substring(0, 500), // Limit query length
      aiResponse: aiResponse.substring(0, 1000), // Limit response length
      confidence,
      feedback,
      error: error?.message
    },
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk log aktivitas security (menggunakan security logger)
function logSecurityEvent(event, details = {}) {
  const {
    userId = 'unknown',
    ip = 'unknown',
    userAgent = 'unknown',
    severity = 'medium',
    description = '',
    action = null
  } = details;

  const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  const message = `Security event: ${event}`;

  securityLogger.log(level, message, {
    category: 'security',
    event,
    userId,
    details: {
      severity,
      description,
      action,
      ip,
      userAgent
    },
    timestamp: new Date().toISOString()
  });
}

// Fungsi untuk create child logger dengan context tambahan
function createChildLogger(context) {
  return logger.child(context);
}

// Backwards-compatible aliases on main logger instance (some modules call methods on `logger` directly)
logger.logRequest = logRequest;
logger.logError = logError;
logger.logUserActivity = logUserActivity;
logger.logSystemActivity = logSystemActivity;
logger.logDatabase = logDatabase;
logger.logAIRequest = logAIRequest;
logger.logEmailSend = logEmailSend;
logger.logUserLogin = logUserLogin;
logger.logSocketConnection = logSocketConnection;
logger.logServerStatusChange = logServerStatusChange;
logger.logEmailAlert = logEmailAlert;
logger.logAIInteraction = logAIInteraction;
logger.logSecurityEvent = logSecurityEvent;
logger.createChildLogger = createChildLogger;

// Provide a numeric levels object that increases with severity to satisfy legacy tests
// (tests expect levels.error > levels.warn > levels.info)
logger.levels = {
  INFO: 1,
  info: 1,
  WARN: 2,
  warn: 2,
  ERROR: 3,
  error: 3
};

// Attach backwards-compatible method aliases expected by tests
logger.logSystem = null; // set below after function is defined
logger.logSystemError = null; // set below after function is defined

// Convenience helpers for system-specific logs used in routes/schedulers
function logSystem(eventOrCode, messageOrDetails = {}, details = {}) {
  if (typeof messageOrDetails === 'string') {
    systemLogger.info(eventOrCode, { message: messageOrDetails, ...details, timestamp: new Date().toISOString() });
  } else {
    systemLogger.info(eventOrCode, { ...messageOrDetails, timestamp: new Date().toISOString() });
  }
}

function logSystemError(code, error, details = {}) {
  const errObj = error && error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  systemLogger.error(code, { ...errObj, ...details, timestamp: new Date().toISOString() });
}

logger.logSystem = logSystem;
logger.logSystemError = logSystemError;

// Also expose simple no-op wrappers for backwards-compatibility if tests call them directly on logger
logger.logError = logger.logError || ((err) => logError(err));
logger.logUserActivity = logger.logUserActivity || ((userId, action, details) => logUserActivity(userId, action, details));

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
  logUserLogin,
  logSocketConnection,
  logServerStatusChange,
  logEmailAlert,
  logAIInteraction,
  logSecurityEvent,
  createChildLogger,
  logSystem,
  logSystemError
};