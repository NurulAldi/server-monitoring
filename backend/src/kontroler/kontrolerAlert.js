// Kontroler untuk mengelola operasi alert dan notifikasi
// Handle request/response untuk endpoint manajemen alert monitoring

const { HTTP_STATUS, ERROR_CODE, ALERT_BARU, ALERT_DIACKNOWLEDGE, ALERT_DISOLVED } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananAlert = require('../layanan/layananAlert');
const { body, param, query, validationResult } = require('express-validator');

/**
 * DESKRIPSI: Handle request untuk mendapatkan daftar alert aktif
 *
 * TUJUAN: Menampilkan alert yang belum di-resolve untuk monitoring
 * dan manajemen masalah server secara real-time.
 *
 * ALUR:
 * 1. Validasi parameter filter (opsional)
 * 2. Ambil data alert aktif dari layanan
 * 3. Format response dengan informasi lengkap alert
 * 4. Log aktivitas untuk audit trail
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.severity - Filter berdasarkan severity (optional)
 * @param {string} req.query.serverId - Filter berdasarkan server ID (optional)
 * @param {number} req.query.halaman - Nomor halaman (default: 1)
 * @param {number} req.query.limit - Jumlah data per halaman (default: 20)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan daftar alert aktif
 */
async function dapatkanAlertAktif(req, res) {
  try {
    const userId = req.user.id;
    const { severity, serverId, halaman = 1, limit = 20 } = req.query;

    // Validasi parameter
    const halamanInt = parseInt(halaman);
    const limitInt = parseInt(limit);

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_REQUEST_ACTIVE', {
      severity: severity,
      serverId: serverId,
      page: halamanInt,
      limit: limitInt,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan alert aktif
    const hasilAlert = await layananAlert.dapatkanAlertAktif(
      userId,
      { severity, serverId },
      halamanInt,
      limitInt
    );

    // Log berhasil
    logger.logUserActivity(userId, 'ALERT_ACTIVE_SUCCESS', {
      alertsCount: hasilAlert.data.length,
      totalPages: hasilAlert.pagination.totalHalaman,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Alert aktif berhasil didapatkan',
      data: hasilAlert.data,
      pagination: hasilAlert.pagination
    });

  } catch (error) {
    // Log error
    logger.logError('ALERT_ACTIVE_ERROR', error, {
      userId: req.user.id,
      filters: req.query,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil alert aktif',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk acknowledge alert
 *
 * TUJUAN: Menandai alert telah diakui oleh user untuk tracking
 * penyelesaian masalah dan escalation management.
 *
 * ALUR:
 * 1. Validasi ID alert dan catatan acknowledgment
 * 2. Panggil layanan untuk acknowledge alert
 * 3. Log perubahan status alert
 * 4. Return konfirmasi acknowledgment
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idAlert - ID alert yang akan di-acknowledge
 * @param {Object} req.body - Request body
 * @param {string} req.body.catatan - Catatan acknowledgment (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi acknowledgment
 */
async function acknowledgeAlert(req, res) {
  try {
    const userId = req.user.id;
    const { idAlert } = req.params;
    const { catatan } = req.body;

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_ACKNOWLEDGE_REQUEST', {
      alertId: idAlert,
      hasNote: !!catatan,
      ip: req.ip
    });

    // Panggil layanan untuk acknowledge alert
    const alertDiacknowledge = await layananAlert.acknowledgeAlert(idAlert, userId, catatan);

    // Log berhasil
    logger.logUserActivity(userId, 'ALERT_ACKNOWLEDGE_SUCCESS', {
      alertId: idAlert,
      alertTitle: alertDiacknowledge.judul,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Alert berhasil di-acknowledge',
      data: alertDiacknowledge
    });

  } catch (error) {
    // Log error
    logger.logError('ALERT_ACKNOWLEDGE_ERROR', error, {
      userId: req.user.id,
      alertId: req.params.idAlert,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat acknowledge alert',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk resolve alert
 *
 * TUJUAN: Menandai alert telah diselesaikan untuk menutup lifecycle
 * alert dan menyimpan catatan resolusi.
 *
 * ALUR:
 * 1. Validasi ID alert dan catatan resolusi
 * 2. Panggil layanan untuk resolve alert
 * 3. Log penyelesaian alert
 * 4. Return konfirmasi resolusi
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idAlert - ID alert yang akan di-resolve
 * @param {Object} req.body - Request body
 * @param {string} req.body.catatan - Catatan resolusi (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi resolusi
 */
async function resolveAlert(req, res) {
  try {
    const userId = req.user.id;
    const { idAlert } = req.params;
    const { catatan } = req.body;

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_RESOLVE_REQUEST', {
      alertId: idAlert,
      hasNote: !!catatan,
      ip: req.ip
    });

    // Panggil layanan untuk resolve alert
    const alertDiresolve = await layananAlert.resolveAlert(idAlert, userId, catatan);

    // Log berhasil
    logger.logUserActivity(userId, 'ALERT_RESOLVE_SUCCESS', {
      alertId: idAlert,
      alertTitle: alertDiresolve.judul,
      resolutionTime: alertDiresolve.durasiResolusi,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Alert berhasil di-resolve',
      data: alertDiresolve
    });

  } catch (error) {
    // Log error
    logger.logError('ALERT_RESOLVE_ERROR', error, {
      userId: req.user.id,
      alertId: req.params.idAlert,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat resolve alert',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk assign alert ke user tertentu
 *
 * TUJUAN: Mendistribusikan tanggung jawab penyelesaian alert kepada
 * user yang tepat untuk manajemen workload.
 *
 * ALUR:
 * 1. Validasi ID alert dan ID user tujuan
 * 2. Panggil layanan untuk assign alert
 * 3. Log perubahan assignment
 * 4. Return konfirmasi assignment
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idAlert - ID alert yang akan di-assign
 * @param {Object} req.body - Request body
 * @param {string} req.body.idUser - ID user tujuan assignment
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi assignment
 */
async function assignAlert(req, res) {
  try {
    const userId = req.user.id;
    const { idAlert } = req.params;
    const { idUser } = req.body;

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_ASSIGN_REQUEST', {
      alertId: idAlert,
      targetUserId: idUser,
      ip: req.ip
    });

    // Panggil layanan untuk assign alert
    const alertDiassign = await layananAlert.assignAlert(idAlert, idUser, userId);

    // Log berhasil
    logger.logUserActivity(userId, 'ALERT_ASSIGN_SUCCESS', {
      alertId: idAlert,
      alertTitle: alertDiassign.judul,
      assignedTo: idUser,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Alert berhasil di-assign',
      data: alertDiassign
    });

  } catch (error) {
    // Log error
    logger.logError('ALERT_ASSIGN_ERROR', error, {
      userId: req.user.id,
      alertId: req.params.idAlert,
      targetUserId: req.body.idUser,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat assign alert',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan detail alert tertentu
 *
 * TUJUAN: Menampilkan informasi lengkap alert termasuk history
 * acknowledgment, assignment, dan resolusi.
 *
 * ALUR:
 * 1. Validasi ID alert
 * 2. Ambil detail alert dari layanan
 * 3. Format response dengan semua informasi
 * 4. Log akses detail alert
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idAlert - ID alert yang diminta
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan detail alert
 */
async function dapatkanDetailAlert(req, res) {
  try {
    const userId = req.user.id;
    const { idAlert } = req.params;

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_DETAIL_REQUEST', {
      alertId: idAlert,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan detail alert
    const detailAlert = await layananAlert.dapatkanDetailAlert(idAlert, userId);

    // Log berhasil
    logger.logUserActivity(userId, 'ALERT_DETAIL_SUCCESS', {
      alertId: idAlert,
      alertTitle: detailAlert.judul,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Detail alert berhasil didapatkan',
      data: detailAlert
    });

  } catch (error) {
    // Log error
    logger.logError('ALERT_DETAIL_ERROR', error, {
      userId: req.user.id,
      alertId: req.params.idAlert,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil detail alert',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan statistik alert
 *
 * TUJUAN: Memberikan overview performa monitoring dalam bentuk
 * statistik alert untuk laporan dan improvement.
 *
 * ALUR:
 * 1. Validasi parameter periode
 * 2. Hitung statistik alert dari layanan
 * 3. Format response dengan metrics penting
 * 4. Log akses statistik
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.hari - Periode statistik dalam hari (default: 30)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan statistik alert
 */
async function dapatkanStatistikAlert(req, res) {
  try {
    const userId = req.user.id;
    const { hari = 30 } = req.query;

    // Validasi parameter
    const hariInt = parseInt(hari);
    if (hariInt < 1 || hariInt > 365) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Parameter hari harus antara 1-365'
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_STATS_REQUEST', {
      days: hariInt,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan statistik
    const statistik = await layananAlert.dapatkanStatistikAlert(userId, hariInt);

    // Log berhasil
    logger.logUserActivity(userId, 'ALERT_STATS_SUCCESS', {
      days: hariInt,
      totalAlerts: statistik.totalAlert,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Statistik alert berhasil didapatkan',
      data: statistik
    });

  } catch (error) {
    // Log error
    logger.logError('ALERT_STATS_ERROR', error, {
      userId: req.user.id,
      days: req.query.hari,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil statistik alert',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan alert yang perlu escalation
 *
 * TUJUAN: Mengidentifikasi alert yang sudah lama tidak di-acknowledge
 * untuk proses escalation otomatis atau manual.
 *
 * ALUR:
 * 1. Ambil alert yang perlu escalation dari layanan
 * 2. Format response dengan informasi prioritas
 * 3. Log aktivitas escalation check
 * 4. Return daftar alert yang perlu escalated
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan alert yang perlu escalation
 */
async function dapatkanAlertPerluEscalation(req, res) {
  try {
    const userId = req.user.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_ESCALATION_CHECK', {
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan alert yang perlu escalation
    const alertEscalation = await layananAlert.dapatkanAlertPerluEscalation(userId);

    // Log berhasil
    logger.logUserActivity(userId, 'ALERT_ESCALATION_SUCCESS', {
      escalationCount: alertEscalation.length,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Alert yang perlu escalation berhasil didapatkan',
      data: alertEscalation
    });

  } catch (error) {
    // Log error
    logger.logError('ALERT_ESCALATION_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil alert escalation',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * VALIDATION RULES
 *
 * Aturan validasi untuk input kontroler alert
 */
const validasiDapatkanAlertAktif = [
  query('severity')
    .optional()
    .isIn(['Warning', 'Critical'])
    .withMessage('Severity harus Warning atau Critical'),
  query('serverId')
    .optional()
    .isMongoId()
    .withMessage('Server ID tidak valid'),
  query('halaman')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Halaman harus lebih dari 0'),
  query('limit')
    .optional()
    .isInt({ min: 5, max: 100 })
    .withMessage('Limit harus antara 5-100'),
];

const validasiAcknowledgeAlert = [
  param('idAlert')
    .isMongoId()
    .withMessage('ID alert tidak valid'),
  body('catatan')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Catatan maksimal 500 karakter'),
];

const validasiResolveAlert = [
  param('idAlert')
    .isMongoId()
    .withMessage('ID alert tidak valid'),
  body('catatan')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Catatan resolusi maksimal 1000 karakter'),
];

const validasiAssignAlert = [
  param('idAlert')
    .isMongoId()
    .withMessage('ID alert tidak valid'),
  body('idUser')
    .isMongoId()
    .withMessage('ID user tidak valid'),
];

const validasiDapatkanDetailAlert = [
  param('idAlert')
    .isMongoId()
    .withMessage('ID alert tidak valid'),
];

const validasiDapatkanStatistikAlert = [
  query('hari')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Hari harus antara 1-365'),
];

// Export semua fungsi dan validasi
module.exports = {
  dapatkanAlertAktif,
  acknowledgeAlert,
  resolveAlert,
  assignAlert,
  dapatkanDetailAlert,
  dapatkanStatistikAlert,
  dapatkanAlertPerluEscalation,
  validasiDapatkanAlertAktif,
  validasiAcknowledgeAlert,
  validasiResolveAlert,
  validasiAssignAlert,
  validasiDapatkanDetailAlert,
  validasiDapatkanStatistikAlert
};