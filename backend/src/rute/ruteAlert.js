// Rute untuk manajemen alert dan kondisi alert
// API endpoints untuk monitoring dan manajemen alert kesehatan server

const express = require('express');
const router = express.Router();
const kontrolerAlert = require('../kontroler/kontrolerAlert');
const { authenticateToken, requireRole } = require('../middleware/autentikasi');
const rateLimiter = require('../middleware/rateLimiter');

// Middleware untuk semua rute alert
router.use(authenticateToken);

// ============================================================================
// RUTE KONDISI ALERT (Alert Conditions)
// ============================================================================

/**
 * @route GET /api/alert/conditions
 * @desc Mendapatkan daftar kondisi alert
 * @access Private (Admin, User)
 * @query {string} serverId - Filter berdasarkan server ID (optional)
 * @query {string} parameter - Filter berdasarkan parameter (optional)
 * @query {boolean} aktif - Filter kondisi aktif (default: true)
 */
router.get('/conditions',
  rateLimiter.apiLimiter,
  kontrolerAlert.dapatkanKondisiAlert
);

/**
 * @route POST /api/alert/conditions
 * @desc Membuat kondisi alert baru
 * @access Private (Admin only)
 * @body {Object} kondisiData - Data kondisi alert
 */
router.post('/conditions',
  rateLimiter.apiLimiter,
  requireRole(['admin']),
  kontrolerAlert.validasiBuatKondisiAlert,
  kontrolerAlert.buatKondisiAlert
);

/**
 * @route PUT /api/alert/conditions/:id
 * @desc Update kondisi alert
 * @access Private (Admin only)
 * @param {string} id - ID kondisi alert
 * @body {Object} updateData - Data update kondisi alert
 */
router.put('/conditions/:id',
  rateLimiter.apiLimiter,
  requireRole(['admin']),
  kontrolerAlert.validasiUpdateKondisiAlert,
  kontrolerAlert.updateKondisiAlert
);

/**
 * @route DELETE /api/alert/conditions/:id
 * @desc Menonaktifkan kondisi alert (soft delete)
 * @access Private (Admin only)
 * @param {string} id - ID kondisi alert
 */
router.delete('/conditions/:id',
  rateLimiter.apiLimiter,
  requireRole(['admin']),
  kontrolerAlert.validasiHapusKondisiAlert,
  kontrolerAlert.hapusKondisiAlert
);

// ============================================================================
// RUTE ALERT (Alert Instances)
// ============================================================================

/**
 * @route GET /api/alert/active
 * @desc Mendapatkan daftar alert aktif
 * @access Private (Admin, User)
 * @query {string} severity - Filter berdasarkan severity (optional)
 * @query {string} serverId - Filter berdasarkan server ID (optional)
 * @query {number} halaman - Nomor halaman (default: 1)
 * @query {number} limit - Jumlah data per halaman (default: 20)
 */
router.get('/active',
  rateLimiter.apiLimiter,
  kontrolerAlert.dapatkanAlertAktif
);

/**
 * @route PUT /api/alert/:id/acknowledge
 * @desc Acknowledge alert
 * @access Private (Admin, User)
 * @param {string} id - ID alert
 * @body {string} catatan - Catatan acknowledgment (optional)
 */
router.put('/:id/acknowledge',
  rateLimiter.apiLimiter,
  kontrolerAlert.validasiAcknowledgeAlert,
  kontrolerAlert.acknowledgeAlert
);

/**
 * @route PUT /api/alert/:id/resolve
 * @desc Resolve alert
 * @access Private (Admin, User)
 * @param {string} id - ID alert
 * @body {string} catatan - Catatan resolusi (optional)
 */
router.put('/:id/resolve',
  rateLimiter.apiLimiter,
  kontrolerAlert.validasiResolveAlert,
  kontrolerAlert.resolveAlert
);

// ============================================================================
// RUTE EVALUASI ALERT
// ============================================================================

/**
 * @route POST /api/alert/evaluate
 * @desc Evaluasi alert manual untuk server tertentu
 * @access Private (Admin only)
 * @body {string} serverId - ID server yang akan dievaluasi
 */
router.post('/evaluate',
  rateLimiter.apiLimiter,
  requireRole(['admin']),
  kontrolerAlert.evaluasiAlertManual
);

// ============================================================================
// RUTE STATISTIK ALERT
// ============================================================================

/**
 * @route GET /api/alert/statistics
 * @desc Mendapatkan statistik alert
 * @access Private (Admin, User)
 * @query {number} hariTerakhir - Jumlah hari terakhir (default: 30)
 */
router.get('/statistics',
  rateLimiter.apiLimiter,
  kontrolerAlert.dapatkanStatistikAlert
);

module.exports = router;