// Konstanta-konstanta yang digunakan di seluruh aplikasi
// Untuk menghindari magic numbers dan strings

// Status kesehatan server
const STATUS_OK = 'OK';
const STATUS_WARNING = 'Warning';
const STATUS_CRITICAL = 'Critical';

// Status alert lifecycle
const ALERT_BARU = 'baru';
const ALERT_DIACKNOWLEDGE = 'diacknowledge';
const ALERT_DISOLVED = 'disolved';

// Status kesehatan server (object untuk backward compatibility)
const STATUS_KESEHATAN = {
  OK: STATUS_OK,
  WARNING: STATUS_WARNING,
  CRITICAL: STATUS_CRITICAL
};

// Jenis alert
const JENIS_ALERT = {
  CPU_TINGGI: 'cpu_tinggi',
  MEMORI_PENUH: 'memori_penuh',
  DISK_PENUH: 'disk_penuh',
  LATENSI_TINGGI: 'latensi_tinggi',
  NETWORK_ERROR: 'network_error'
};

// Tingkat keparahan alert
const TINGKAT_KEPARAHAN = {
  WARNING: 'Warning',
  CRITICAL: 'Critical'
};

// Status server
const STATUS_SERVER = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance'
};

// Role pengguna
const PERAN_PENGGUNA = {
  ADMIN: 'admin',
  USER: 'user'
};

// Status aktif pengguna
const STATUS_AKTIF = {
  AKTIF: true,
  NON_AKTIF: false
};

// Threshold default untuk alert (dalam persen)
const THRESHOLD_DEFAULT = {
  CPU_WARNING: 60,    // CPU > 60% = Warning
  CPU_CRITICAL: 80,   // CPU > 80% = Critical
  MEMORI_WARNING: 70, // Memory > 70% = Warning
  MEMORI_CRITICAL: 85, // Memory > 85% = Critical
  DISK_WARNING: 80,   // Disk > 80% = Warning
  DISK_CRITICAL: 90,  // Disk > 90% = Critical
  LATENSI_WARNING: 100, // Latency > 100ms = Warning
  LATENSI_CRITICAL: 500 // Latency > 500ms = Critical
};

// Interval generator data (dalam detik)
const INTERVAL_GENERATOR = {
  DEFAULT: 60,        // 60 detik
  MINIMUM: 10,        // Minimum 10 detik
  MAXIMUM: 300        // Maximum 5 menit
};

// Cooldown alert (dalam menit)
const COOLDOWN_ALERT = {
  DEFAULT: 30,        // 30 menit cooldown
  MINIMUM: 5,         // Minimum 5 menit
  MAXIMUM: 1440       // Maximum 24 jam
};

// Limit pagination
const PAGINATION_LIMIT = {
  DEFAULT: 20,        // Default 20 items per page
  MAXIMUM: 100,       // Maximum 100 items per page
  MINIMUM: 5          // Minimum 5 items per page
};

// Timeout untuk external API (dalam milliseconds)
const TIMEOUT_API = {
  AI_REQUEST: 30000,      // 30 detik untuk AI
  EMAIL_SEND: 10000,      // 10 detik untuk email
  DATABASE_QUERY: 5000    // 5 detik untuk database
};

// Error codes untuk API response
const ERROR_CODE = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',

  // Rate limiting
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
};

// HTTP status codes mapping
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// AI providers
const AI_PROVIDER = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  OLLAMA: 'ollama'
};

// Email templates
const EMAIL_TEMPLATE = {
  ALERT_CRITICAL: 'alert_critical',
  ALERT_WARNING: 'alert_warning',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset'
};

// Socket.IO events
const SOCKET_EVENT = {
  // Client to Server
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  TYPING_START: 'typing_start',
  TYPING_END: 'typing_end',

  // Server to Client
  METRICS_UPDATE: 'metricsUpdate',
  ALERT_NOTIFICATION: 'alertNotification',
  SERVER_STATUS_CHANGE: 'serverStatusChange',
  ACTIVITY_LOG: 'activityLog',
  AI_RESPONSE: 'aiResponse',
  AI_TYPING: 'aiTyping'
};

// Environment
const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

// Export semua konstanta
module.exports = {
  // Status constants
  STATUS_OK,
  STATUS_WARNING,
  STATUS_CRITICAL,
  ALERT_BARU,
  ALERT_DIACKNOWLEDGE,
  ALERT_DISOLVED,

  // Legacy object exports
  STATUS_KESEHATAN,
  JENIS_ALERT,
  TINGKAT_KEPARAHAN,
  STATUS_SERVER,
  PERAN_PENGGUNA,
  STATUS_AKTIF,
  THRESHOLD_DEFAULT,
  INTERVAL_GENERATOR,
  COOLDOWN_ALERT,
  PAGINATION_LIMIT,
  TIMEOUT_API,
  ERROR_CODE,
  HTTP_STATUS,
  AI_PROVIDER,
  EMAIL_TEMPLATE,
  SOCKET_EVENT,
  ENVIRONMENT
};