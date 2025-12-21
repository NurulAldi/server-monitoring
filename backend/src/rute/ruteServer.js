// Rute untuk endpoint server monitoring
// Define routes untuk operasi CRUD server

const express = require('express');
const router = express.Router();

// Import kontroler dan middleware
const kontrolerServer = require('../kontroler/kontrolerServer');
const autentikasi = require('../middleware/autentikasi');
const {
  validasiTambahServer,
  validasiUpdateServer,
  validasiHapusServer,
  validasiAmbilServerById
} = require('../middleware/validasi');

// Import rate limiter
const rateLimiter = require('../middleware/rateLimiter');

// Route untuk tambah server baru
// POST /api/server
router.post('/',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  validasiTambahServer, // Validasi input
  kontrolerServer.tambahServer
);

// Route untuk ambil semua server user
// GET /api/server
router.get('/',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  kontrolerServer.ambilSemuaServer
);

// Route untuk ambil server by ID
// GET /api/server/:id
router.get('/:id',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  validasiAmbilServerById, // Validasi parameter ID
  kontrolerServer.ambilServerById
);

// Route untuk update server
// PUT /api/server/:id
router.put('/:id',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  validasiUpdateServer, // Validasi input dan parameter
  kontrolerServer.updateServer
);

// Route untuk hapus server
// DELETE /api/server/:id
router.delete('/:id',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  validasiHapusServer, // Validasi parameter ID
  kontrolerServer.hapusServer
);

// Route untuk ping server
// POST /api/server/:id/ping
router.post('/:id/ping',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  validasiAmbilServerById, // Validasi parameter ID
  kontrolerServer.pingServer
);

// Export router
module.exports = router;