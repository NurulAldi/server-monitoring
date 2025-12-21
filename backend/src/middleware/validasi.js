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

// Validasi untuk tambah server baru
const validasiTambahServer = [
  body('nama')
    .trim()
    .notEmpty()
    .withMessage('Nama server tidak boleh kosong')
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
    .isIn(['web', 'database', 'api', 'cache', 'load-balancer', 'monitoring'])
    .withMessage('Jenis server tidak valid'),

  body('alamatIp')
    .matches(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/)
    .withMessage('Format IP address tidak valid'),

  body('sistemOperasi')
    .trim()
    .notEmpty()
    .withMessage('Sistem operasi tidak boleh kosong')
    .isLength({ max: 100 })
    .withMessage('Sistem operasi terlalu panjang'),

  body('spesifikasi.cpu.core')
    .isInt({ min: 1, max: 128 })
    .withMessage('Jumlah core CPU harus antara 1-128'),

  body('spesifikasi.cpu.model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model CPU terlalu panjang'),

  body('spesifikasi.memoriTotal')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Total memori harus antara 1-10000 GB'),

  body('spesifikasi.diskTotal')
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

// Validasi untuk chat AI
const validasiChatAI = [
  body('pertanyaan')
    .trim()
    .notEmpty()
    .withMessage('Pertanyaan tidak boleh kosong')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Pertanyaan harus antara 5-1000 karakter'),

  body('idServer')
    .optional()
    .isMongoId()
    .withMessage('ID server tidak valid'),

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

// Validasi untuk ambil metrics
const validasiAmbilMetrics = [
  param('idServer')
    .isMongoId()
    .withMessage('ID server tidak valid'),

  query('dari')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal "dari" tidak valid'),

  query('sampai')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal "sampai" tidak valid'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit harus antara 1-1000'),

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

// Validasi untuk update profil user
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

// Export semua validasi rules
module.exports = {
  handleValidationErrors,
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
  validasiAmbilAlert,
  validasiUpdateProfil
};