// Rute untuk endpoint pengguna (authentication dan profil)
// Define routes untuk operasi pengguna

const express = require('express');
const router = express.Router();

// Import kontroler dan middleware
const kontrolerPengguna = require('../kontroler/kontrolerPengguna');
const autentikasi = require('../middleware/autentikasi');
const {
  validasiRegistrasi,
  validasiLogin,
  validasiLogout,
  validasiUpdateProfil
} = require('../middleware/validasi');

// Import rate limiter khusus untuk auth
const rateLimiter = require('../middleware/rateLimiter');

// Route untuk registrasi pengguna baru
// POST /api/pengguna/registrasi
router.post('/registrasi',
  rateLimiter.limiterRegistrasi, // Rate limit khusus registrasi
  validasiRegistrasi, // Validasi input
  kontrolerPengguna.registrasi
);

// Route untuk login pengguna
// POST /api/pengguna/login
router.post('/login',
  rateLimiter.limiterLogin, // Rate limit khusus login
  validasiLogin, // Validasi input
  kontrolerPengguna.login
);

// Route untuk logout pengguna
// POST /api/pengguna/logout
// Allow anonymous access so clients can clear cookies and perform logout even when the token is missing/expired
router.post('/logout',
  validasiLogout, // Validasi input (minimal)
  kontrolerPengguna.logout
);

// Route untuk verifikasi token (untuk frontend check auth status)
// GET /api/pengguna/verifikasi
router.get('/verifikasi',
  autentikasi.verifikasiToken, // Middleware autentikasi
  kontrolerPengguna.verifikasiToken
);

// Route untuk ambil profil pengguna saat ini
// GET /api/pengguna/profil
router.get('/profil',
  autentikasi.verifikasiToken, // Middleware autentikasi
  kontrolerPengguna.ambilProfil
);

// Route untuk ganti password (opsional, bisa ditambahkan nanti)
// PUT /api/pengguna/ganti-password
// router.put('/ganti-password',
//   autentikasi.verifikasiToken,
//   rateLimiter.limiterGeneral,
//   validasiGantiPassword,
//   kontrolerPengguna.gantiPassword
// );

// Route untuk reset password (untuk admin atau fitur lupa password)
// PUT /api/pengguna/reset-password/:id
// router.put('/reset-password/:id',
//   autentikasi.verifikasiToken,
//   autentikasi.periksaPeran(['admin']),
//   rateLimiter.limiterGeneral,
//   validasiResetPassword,
//   kontrolerPengguna.resetPassword
// );

// Export router
module.exports = router;