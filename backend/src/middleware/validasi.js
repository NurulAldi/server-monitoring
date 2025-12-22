// Middleware validasi input menggunakan express-validator
// Validasi data dari request body, params, query

const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');

// Middleware untuk handle validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format error messages
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    // Log validation errors
    logger.logUserActivity(req.user?.id || 'anonymous', 'VALIDATION_FAILED', {
      endpoint: req.url,
      method: req.method,
      errors: formattedErrors,
      ip: req.ip
    });

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODE.VALIDATION_ERROR,
        message: 'Data yang dikirim tidak valid. Periksa kembali input Anda.',
        details: formattedErrors,
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
}

/**
 * Sanitasi umum untuk input text
 */
const sanitizeTextInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .substring(0, 1000); // Limit length
};

/**
 * Middleware sanitasi otomatis
 */
const sanitizeInput = (req, res, next) => {
  // Sanitasi body
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitizeTextInput(value);
      }
    }
  }

  // Sanitasi query
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeTextInput(value);
      }
    }
  }

  next();
};

// Validasi untuk registrasi user
const validasiRegistrasi = [
  body('nama')
    .trim()
    .notEmpty()
    .withMessage('Nama tidak boleh kosong')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus antara 2-100 karakter')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Nama hanya boleh berisi huruf dan spasi'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Format email tidak valid')
    .isLength({ max: 255 })
    .withMessage('Email terlalu panjang'),

  body('kataSandi')
    .isLength({ min: 8 })
    .withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),

  handleValidationErrors
];

// Validasi untuk login user
const validasiLogin = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Format email tidak valid'),

  body('kataSandi')
    .notEmpty()
    .withMessage('Password tidak boleh kosong'),

  handleValidationErrors
];

// Validasi untuk logout (tidak perlu validasi khusus, hanya cek token)
const validasiLogout = [
  // Tidak ada validasi khusus, hanya perlu token valid
  handleValidationErrors
];

// Validasi untuk update profil pengguna
const validasiUpdateProfil = [
  body('nama')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus antara 2-100 karakter')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Nama hanya boleh berisi huruf dan spasi'),

  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Format email tidak valid')
    .isLength({ max: 255 })
    .withMessage('Email terlalu panjang'),

  handleValidationErrors
];

// Validasi untuk tambah server baru dengan validasi ketat
const validasiTambahServer = [
  body('nama')
    .trim()
    .notEmpty()
    .withMessage('Nama server tidak boleh kosong')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama server harus antara 2-100 karakter')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Nama server hanya boleh berisi huruf, angka, spasi, dash, underscore, dan titik')
    .custom((value) => {
      // Cek tidak mengandung kata berbahaya
      const dangerousWords = ['admin', 'root', 'system', 'localhost', '127.0.0.1'];
      const lowerValue = value.toLowerCase();
      const hasDangerousWord = dangerousWords.some(word => lowerValue.includes(word));
      if (hasDangerousWord) {
        throw new Error('Nama server mengandung kata yang tidak diizinkan');
      }
      return true;
    }),

  body('deskripsi')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter'),

  body('jenisServer')
    .isIn(['web', 'database', 'api', 'cache', 'load-balancer', 'monitoring', 'application'])
    .withMessage('Jenis server tidak valid'),

  body('alamatIp')
    .optional()
    .matches(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/)
    .withMessage('Format IP address tidak valid'),

  body('port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port harus antara 1-65535'),

  body('urlMonitoring')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('URL monitoring harus valid dengan protokol http/https'),

  body('sistemOperasi')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sistem operasi terlalu panjang')
    .matches(/^[a-zA-Z0-9\s\-\.]+$/)
    .withMessage('Sistem operasi hanya boleh berisi huruf, angka, spasi, dash, dan titik'),

  body('lokasi')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Lokasi harus antara 2-100 karakter'),

  body('spesifikasi.cpu.core')
    .optional()
    .isInt({ min: 1, max: 256 })
    .withMessage('Jumlah core CPU harus antara 1-256'),

  body('spesifikasi.cpu.model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model CPU terlalu panjang'),

  body('spesifikasi.memoriTotal')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Total memori harus antara 1-10000 GB'),

  body('spesifikasi.diskTotal')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Total disk harus antara 1-100000 GB'),

  handleValidationErrors
];

// Validasi untuk update server
const validasiUpdateServer = [
  param('id')
    .isMongoId()
    .withMessage('ID server tidak valid'),

  body('nama')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama server harus antara 2-100 karakter')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Nama server hanya boleh berisi huruf, angka, spasi, dash, dan underscore'),

  body('deskripsi')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter'),

  body('jenisServer')
    .optional()
    .isIn(['web', 'database', 'api', 'cache', 'load-balancer', 'monitoring'])
    .withMessage('Jenis server tidak valid'),

  body('alamatIp')
    .optional()
    .matches(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/)
    .withMessage('Format IP address tidak valid'),

  body('sistemOperasi')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sistem operasi terlalu panjang'),

  body('spesifikasi.cpu.core')
    .optional()
    .isInt({ min: 1, max: 128 })
    .withMessage('Jumlah core CPU harus antara 1-128'),

  body('spesifikasi.memoriTotal')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Total memori harus antara 1-10000 GB'),

  body('spesifikasi.diskTotal')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Total disk harus antara 1-100000 GB'),

  handleValidationErrors
];

// Validasi untuk hapus server
const validasiHapusServer = [
  param('id')
    .isMongoId()
    .withMessage('ID server tidak valid'),

  handleValidationErrors
];

// Validasi untuk ambil server by ID
const validasiAmbilServerById = [
  param('id')
    .isMongoId()
    .withMessage('ID server tidak valid'),

  handleValidationErrors
];

// Validasi untuk chat AI dengan pencegahan command injection
const validasiChatAI = [
  body('pertanyaan')
    .trim()
    .notEmpty()
    .withMessage('Pertanyaan tidak boleh kosong')
    .isLength({ min: 5, max: 500 })
    .withMessage('Pertanyaan harus antara 5-500 karakter')
    .custom((value) => {
      // Blok kata kunci berbahaya untuk mencegah command injection
      const dangerousKeywords = [
        // System commands
        'restart', 'stop', 'kill', 'delete', 'remove', 'execute', 'run',
        'system', 'sudo', 'admin', 'root', 'chmod', 'chown', 'rm -rf',
        'format', 'fdisk', 'mkfs', 'shutdown', 'reboot', 'halt',
        // Database commands
        'drop', 'truncate', 'alter', 'create', 'insert', 'update',
        // File system
        'unlink', 'rmdir', 'mkdir', 'write', 'read', 'open',
        // Network
        'connect', 'bind', 'listen', 'accept', 'socket',
        // Process management
        'fork', 'spawn', 'exec', 'child_process', 'process',
        // AI manipulation
        'ignore', 'override', 'bypass', 'jailbreak', 'prompt injection'
      ];

      const lowerValue = value.toLowerCase();
      const foundDangerous = dangerousKeywords.some(keyword =>
        lowerValue.includes(keyword)
      );

      if (foundDangerous) {
        throw new Error('Pertanyaan mengandung kata kunci yang tidak diizinkan untuk keamanan');
      }

      // Cek pola berbahaya
      const dangerousPatterns = [
        /exec\(/i,
        /eval\(/i,
        /require\(/i,
        /import\(/i,
        /process\./i,
        /fs\./i,
        /child_process\./i,
        /console\./i,
        /global\./i,
        /window\./i,
        /document\./i
      ];

      const hasDangerousPattern = dangerousPatterns.some(pattern =>
        pattern.test(lowerValue)
      );

      if (hasDangerousPattern) {
        throw new Error('Pertanyaan mengandung pola yang tidak diizinkan');
      }

      return true;
    }),

  body('idServer')
    .optional()
    .isMongoId()
    .withMessage('ID server tidak valid'),

  body('tipePertanyaan')
    .optional()
    .isIn(['analisis', 'rekomendasi', 'diagnosa', 'umum'])
    .withMessage('Tipe pertanyaan tidak valid'),

  handleValidationErrors
];

// Validasi untuk update konfigurasi
const validasiUpdateKonfigurasi = [
  param('kunci')
    .trim()
    .notEmpty()
    .withMessage('Kunci konfigurasi tidak boleh kosong')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kunci konfigurasi hanya boleh berisi huruf, angka, dan underscore'),

  body('nilai')
    .exists()
    .withMessage('Nilai konfigurasi harus ada'),

  body('tipeData')
    .optional()
    .isIn(['string', 'number', 'boolean', 'object'])
    .withMessage('Tipe data tidak valid'),

  handleValidationErrors
];

// Validasi untuk ambil konfigurasi by key
const validasiAmbilKonfigurasiByKey = [
  param('kunci')
    .trim()
    .notEmpty()
    .withMessage('Kunci konfigurasi tidak boleh kosong')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kunci konfigurasi hanya boleh berisi huruf, angka, dan underscore'),

  handleValidationErrors
];

// Validasi untuk ambil metrics dengan validasi ketat
const validasiAmbilMetrics = [
  param('idServer')
    .isMongoId()
    .withMessage('ID server tidak valid'),

  query('dari')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal "dari" tidak valid')
    .custom((value) => {
      // Pastikan tanggal tidak di masa depan
      const date = new Date(value);
      const now = new Date();
      if (date > now) {
        throw new Error('Tanggal mulai tidak boleh di masa depan');
      }
      return true;
    }),

  query('sampai')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal "sampai" tidak valid')
    .custom((value, { req }) => {
      if (req.query.dari) {
        const startDate = new Date(req.query.dari);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('Tanggal sampai harus lebih besar dari tanggal mulai');
        }
      }
      return true;
    }),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit harus antara 1-1000')
    .toInt(),

  query('halaman')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Halaman harus angka positif')
    .toInt(),

  handleValidationErrors
];

// Validasi untuk input metrics baru
const validasiInputMetrics = [
  body('serverId')
    .isMongoId()
    .withMessage('Server ID tidak valid'),

  body('cpu.persentase')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('CPU persentase harus antara 0-100'),

  body('cpu.core')
    .optional()
    .isInt({ min: 1, max: 256 })
    .withMessage('Jumlah core CPU harus antara 1-256'),

  body('memori.persentase')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Memory persentase harus antara 0-100'),

  body('memori.digunakan')
    .optional()
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Memory digunakan harus antara 0-1,000,000 MB'),

  body('memori.total')
    .optional()
    .isInt({ min: 1, max: 1000000 })
    .withMessage('Memory total harus antara 1-1,000,000 MB'),

  body('disk.persentase')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Disk persentase harus antara 0-100'),

  body('disk.digunakan')
    .optional()
    .isInt({ min: 0, max: 10000000 })
    .withMessage('Disk digunakan harus antara 0-10,000,000 GB'),

  body('disk.total')
    .optional()
    .isInt({ min: 1, max: 10000000 })
    .withMessage('Disk total harus antara 1-10,000,000 GB'),

  body('jaringan.downloadMbps')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Download speed harus antara 0-10,000 Mbps'),

  body('jaringan.uploadMbps')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Upload speed harus antara 0-10,000 Mbps'),

  body('jaringan.latensiMs')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Latensi harus antara 0-10,000 ms'),

  body('sistemOperasi.uptimeDetik')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Uptime harus angka positif'),

  body('sistemOperasi.bebanRataRata.*')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Load average harus angka positif'),

  body('skorKesehatan')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Skor kesehatan harus antara 0-100'),

  body('statusKesehatan')
    .optional()
    .isIn(['healthy', 'warning', 'critical', 'unknown'])
    .withMessage('Status kesehatan tidak valid'),

  handleValidationErrors
];

// Validasi untuk ambil alert
const validasiAmbilAlert = [
  param('idServer')
    .optional()
    .isMongoId()
    .withMessage('ID server tidak valid'),

  query('tingkatKeparahan')
    .optional()
    .isIn(['Warning', 'Critical'])
    .withMessage('Tingkat keparahan tidak valid'),

  query('dari')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal "dari" tidak valid'),

  query('sampai')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal "sampai" tidak valid'),

  query('halaman')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Halaman harus angka positif'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),

  handleValidationErrors
];

// Validasi untuk alert conditions
const validasiAlertCondition = [
  body('serverId')
    .isMongoId()
    .withMessage('Server ID tidak valid'),

  body('nama')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama kondisi harus antara 2-100 karakter')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Nama kondisi hanya boleh berisi huruf, angka, spasi, dash, underscore, dan titik'),

  body('parameter')
    .isIn(['cpu', 'memori', 'disk', 'jaringan', 'sistem'])
    .withMessage('Parameter alert tidak valid'),

  body('alertType')
    .isIn(['threshold', 'trend', 'anomaly'])
    .withMessage('Tipe alert tidak valid'),

  body('operator')
    .optional()
    .isIn(['>', '<', '>=', '<=', '==', '!='])
    .withMessage('Operator tidak valid'),

  body('unit')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Unit harus antara 1-10 karakter'),

  body('thresholds.warning.nilai')
    .isNumeric()
    .withMessage('Threshold warning harus numerik')
    .custom((value) => {
      const num = parseFloat(value);
      if (num < 0 || num > 1000000) {
        throw new Error('Threshold warning harus antara 0-1,000,000');
      }
      return true;
    }),

  body('thresholds.critical.nilai')
    .isNumeric()
    .withMessage('Threshold critical harus numerik')
    .custom((value) => {
      const num = parseFloat(value);
      if (num < 0 || num > 1000000) {
        throw new Error('Threshold critical harus antara 0-1,000,000');
      }
      return true;
    }),

  body('cooldownMenit')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Cooldown harus antara 0-1440 menit'),

  body('maxAlertPerJam')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Max alert per jam harus antara 0-100'),

  handleValidationErrors
];

// Export semua validasi rules
module.exports = {
  handleValidationErrors,
  sanitizeInput,
  sanitizeTextInput,
  validasiRegistrasi,
  validasiLogin,
  validasiLogout,
  validasiTambahServer,
  validasiUpdateServer,
  validasiHapusServer,
  validasiAmbilServerById,
  validasiChatAI,
  validasiUpdateKonfigurasi,
  validasiAmbilKonfigurasiByKey,
  validasiAmbilMetrics,
  validasiInputMetrics,
  validasiAmbilAlert,
  validasiAlertCondition,
  validasiUpdateProfil
};