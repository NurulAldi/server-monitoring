// Rute untuk endpoint autentikasi (JWT-based authentication)
// Define routes untuk registrasi, login, logout, dan token management

const express = require('express');
const router = express.Router();

// Import kontroler autentikasi
const kontrolerAutentikasi = require('../kontroler/kontrolerAutentikasi');

// Import middleware
const autentikasi = require('../middleware/autentikasi');
const { body, validationResult } = require('express-validator');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * VALIDATION RULES
 * Aturan validasi untuk input autentikasi
 */

// Validasi registrasi pengguna baru
const validasiRegistrasi = [
  body('namaPengguna')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Nama pengguna harus 3-50 karakter')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Nama pengguna hanya boleh huruf, angka, dan underscore'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format email tidak valid'),

  body('kataSandi')
    .isLength({ min: 8 })
    .withMessage('Kata sandi minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Kata sandi harus mengandung huruf besar, kecil, angka, dan simbol'),
];

// Validasi login pengguna
const validasiLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format email tidak valid'),

  body('kataSandi')
    .notEmpty()
    .withMessage('Kata sandi wajib diisi'),
];

// Validasi refresh token
const validasiRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token wajib diisi'),
];

// Validasi logout (revoke refresh token)
const validasiLogout = [
  body('refreshToken')
    .optional()
    .notEmpty()
    .withMessage('Refresh token tidak valid'),
];

/**
 * ROUTE DEFINITIONS
 * Definisi endpoint autentikasi
 */

/**
 * @route POST /api/auth/registrasi
 * @desc Registrasi pengguna baru
 * @access Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/registrasi',
  rateLimiter.limiterRegistrasi,
  validasiRegistrasi,
  kontrolerAutentikasi.registrasi
);

/**
 * @route POST /api/auth/login
 * @desc Login pengguna dan dapatkan JWT tokens
 * @access Public
 * @rateLimit 5 attempts per 15 minutes per IP
 */
router.post('/login',
  rateLimiter.limiterLogin,
  validasiLogin,
  kontrolerAutentikasi.login
);

/**
 * @route POST /api/auth/logout
 * @desc Logout pengguna (revoke refresh token)
 * @access Private (JWT required)
 * @rateLimit 10 requests per minute per user
 */
router.post('/logout',
  autentikasi.verifikasiToken,
  rateLimiter.limiterUmum,
  validasiLogout,
  kontrolerAutentikasi.logout
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token menggunakan refresh token
 * @access Public (refresh token required)
 * @rateLimit 10 requests per minute per IP
 */
router.post('/refresh',
  rateLimiter.limiterUmum,
  validasiRefreshToken,
  kontrolerAutentikasi.refreshToken
);

/**
 * @route GET /api/auth/verifikasi
 * @desc Verifikasi status autentikasi pengguna
 * @access Private (JWT required)
 * @rateLimit 30 requests per minute per user
 */
router.get('/verifikasi',
  autentikasi.verifikasiToken,
  rateLimiter.limiterUmum,
  kontrolerAutentikasi.verifikasiToken
);

/**
 * @route POST /api/auth/lupa-kata-sandi
 * @desc Request reset password link
 * @access Public
 * @rateLimit 3 requests per hour per email
 */
router.post('/lupa-kata-sandi',
  rateLimiter.limiterResetPassword,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Format email tidak valid'),
  ],
  kontrolerAutentikasi.lupaKataSandi
);

/**
 * @route POST /api/auth/reset-kata-sandi
 * @desc Reset password menggunakan token
 * @access Public
 * @rateLimit 5 attempts per hour per IP
 */
router.post('/reset-kata-sandi',
  rateLimiter.limiterResetPassword,
  [
    body('token')
      .notEmpty()
      .withMessage('Token reset wajib diisi'),
    body('kataSandiBaru')
      .isLength({ min: 8 })
      .withMessage('Kata sandi baru minimal 8 karakter')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Kata sandi baru harus mengandung huruf besar, kecil, angka, dan simbol'),
  ],
  kontrolerAutentikasi.resetKataSandi
);

// Export router
module.exports = router;