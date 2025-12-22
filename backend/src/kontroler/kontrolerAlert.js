// Kontroler untuk mengelola operasi alert dan kondisi alert
// Handle request/response untuk endpoint manajemen alert monitoring

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananAlert = require('../layanan/layananAlert');
const { body, param, query, validationResult } = require('express-validator');
const Alert = require('../model/Alert');
const AlertCondition = require('../model/AlertCondition');
const Server = require('../model/Server');

/**
 * DESKRIPSI: Handle request untuk mendapatkan daftar kondisi alert
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function dapatkanKondisiAlert(req, res) {
  try {
    const userId = req.user.id;
    const { serverId, parameter, aktif = true } = req.query;

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_CONDITION_REQUEST', {
      serverId,
      parameter,
      aktif,
      ip: req.ip
    });

    // Query kondisi alert
    let query = {};
    if (serverId) query.serverId = serverId;
    if (parameter) query.parameter = parameter;
    if (aktif !== undefined) query.aktif = aktif === 'true';

    const kondisiAlert = await AlertCondition.find(query)
      .populate('serverId', 'nama jenisServer')
      .populate('metadata.dibuatOleh', 'nama email')
      .sort({ serverId: -1, parameter: 1, createdAt: -1 });

    // Format response
    const response = kondisiAlert.map(k => k.formatUntukDisplay());

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: response,
      meta: {
        total: response.length,
        serverId,
        parameter,
        aktif
      }
    });

  } catch (error) {
    logger.logError('ALERT_CONDITION_FETCH_FAILED', error, { userId: req.user.id });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mengambil data kondisi alert'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk membuat kondisi alert baru
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function buatKondisiAlert(req, res) {
  try {
    const userId = req.user.id;
    const kondisiData = req.body;

    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.VALIDATION_ERROR,
          message: 'Data tidak valid',
          details: errors.array()
        }
      });
    }

    // Set metadata
    kondisiData.metadata = {
      dibuatOleh: userId,
      ...kondisiData.metadata
    };

    // Buat kondisi alert baru
    const kondisiAlert = new AlertCondition(kondisiData);
    await kondisiAlert.save();

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_CONDITION_CREATED', {
      conditionId: kondisiAlert._id,
      parameter: kondisiAlert.parameter,
      serverId: kondisiAlert.serverId,
      ip: req.ip
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: kondisiAlert.formatUntukDisplay(),
      message: 'Kondisi alert berhasil dibuat'
    });

  } catch (error) {
    logger.logError('ALERT_CONDITION_CREATE_FAILED', error, {
      userId: req.user.id,
      data: req.body
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal membuat kondisi alert'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk update kondisi alert
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateKondisiAlert(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.VALIDATION_ERROR,
          message: 'Data tidak valid',
          details: errors.array()
        }
      });
    }

    // Update kondisi alert
    updateData.metadata = {
      diupdateOleh: userId,
      ...updateData.metadata
    };

    const kondisiAlert = await AlertCondition.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('serverId', 'nama jenisServer');

    if (!kondisiAlert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Kondisi alert tidak ditemukan'
        }
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_CONDITION_UPDATED', {
      conditionId: kondisiAlert._id,
      parameter: kondisiAlert.parameter,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: kondisiAlert.formatUntukDisplay(),
      message: 'Kondisi alert berhasil diupdate'
    });

  } catch (error) {
    logger.logError('ALERT_CONDITION_UPDATE_FAILED', error, {
      userId: req.user.id,
      conditionId: req.params.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal update kondisi alert'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk menghapus kondisi alert
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function hapusKondisiAlert(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Soft delete dengan set aktif = false
    const kondisiAlert = await AlertCondition.findByIdAndUpdate(
      id,
      {
        aktif: false,
        metadata: {
          diupdateOleh: userId
        }
      },
      { new: true }
    );

    if (!kondisiAlert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Kondisi alert tidak ditemukan'
        }
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_CONDITION_DELETED', {
      conditionId: kondisiAlert._id,
      parameter: kondisiAlert.parameter,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Kondisi alert berhasil dinonaktifkan'
    });

  } catch (error) {
    logger.logError('ALERT_CONDITION_DELETE_FAILED', error, {
      userId: req.user.id,
      conditionId: req.params.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal menghapus kondisi alert'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan daftar alert aktif
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
      severity,
      serverId,
      page: halamanInt,
      limit: limitInt,
      ip: req.ip
    });

    // Query alert aktif
    let query = { statusAlert: { $ne: 'resolved' } };
    if (severity) query.severity = severity;
    if (serverId) query.serverId = serverId;

    const alerts = await Alert.find(query)
      .populate('serverId', 'nama jenisServer host')
      .populate('assignedKe', 'nama email')
      .sort({ severity: -1, timestampPemicu: -1 })
      .skip((halamanInt - 1) * limitInt)
      .limit(limitInt);

    const total = await Alert.countDocuments(query);

    // Format response
    const response = alerts.map(alert => alert.formatUntukDisplay());

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: response,
      meta: {
        total,
        halaman: halamanInt,
        limit: limitInt,
        totalHalaman: Math.ceil(total / limitInt)
      }
    });

  } catch (error) {
    logger.logError('ALERT_ACTIVE_FETCH_FAILED', error, { userId: req.user.id });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mengambil data alert aktif'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk acknowledge alert
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function acknowledgeAlert(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { catatan } = req.body;

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Alert tidak ditemukan'
        }
      });
    }

    await alert.acknowledge(userId, catatan);

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_ACKNOWLEDGED', {
      alertId: alert._id,
      serverId: alert.serverId,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: alert.formatUntukDisplay(),
      message: 'Alert berhasil di-acknowledge'
    });

  } catch (error) {
    logger.logError('ALERT_ACKNOWLEDGE_FAILED', error, {
      userId: req.user.id,
      alertId: req.params.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal acknowledge alert'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk resolve alert
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function resolveAlert(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { catatan } = req.body;

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Alert tidak ditemukan'
        }
      });
    }

    await alert.resolve(userId, catatan);

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_RESOLVED', {
      alertId: alert._id,
      serverId: alert.serverId,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: alert.formatUntukDisplay(),
      message: 'Alert berhasil di-resolve'
    });

  } catch (error) {
    logger.logError('ALERT_RESOLVE_FAILED', error, {
      userId: req.user.id,
      alertId: req.params.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal resolve alert'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk evaluasi alert manual
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function evaluasiAlertManual(req, res) {
  try {
    const userId = req.user.id;
    const { serverId } = req.body;

    if (!serverId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.VALIDATION_ERROR,
          message: 'Server ID wajib diisi'
        }
      });
    }

    // Verifikasi server exists
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Server tidak ditemukan'
        }
      });
    }

    // Dapatkan metrics terbaru
    const Metrik = require('../model/Metrik');
    const metricsTerbaru = await Metrik.findOne({ serverId })
      .sort({ timestamp: -1 });

    if (!metricsTerbaru) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Metrics server tidak ditemukan'
        }
      });
    }

    // Evaluasi alert
    const alertsDibuat = await layananAlert.evaluasiKondisiAlert(serverId, metricsTerbaru.toObject());

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_MANUAL_EVALUATION', {
      serverId,
      alertsCreated: alertsDibuat.length,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        serverId,
        namaServer: server.nama,
        alertsDibuat: alertsDibuat.length,
        alerts: alertsDibuat.map(a => ({
          id: a._id,
          judul: a.judul,
          severity: a.severity,
          parameter: a.kondisiPemicu.metric
        }))
      },
      message: `Evaluasi alert selesai, ${alertsDibuat.length} alert dibuat`
    });

  } catch (error) {
    logger.logError('ALERT_MANUAL_EVALUATION_FAILED', error, {
      userId: req.user.id,
      serverId: req.body.serverId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal evaluasi alert manual'
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan statistik alert
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function dapatkanStatistikAlert(req, res) {
  try {
    const userId = req.user.id;
    const { hariTerakhir = 30 } = req.query;

    const statistik = await Alert.dapatkanStatistikAlert(parseInt(hariTerakhir));

    // Log aktivitas
    logger.logUserActivity(userId, 'ALERT_STATISTICS_REQUEST', {
      days: hariTerakhir,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statistik[0] || {},
      meta: {
        hariTerakhir: parseInt(hariTerakhir)
      }
    });

  } catch (error) {
    logger.logError('ALERT_STATISTICS_FAILED', error, { userId: req.user.id });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mengambil statistik alert'
      }
    });
  }
}

// Validation rules
const validasiBuatKondisiAlert = [
  body('parameter').isIn([
    'cpu_usage', 'memory_usage', 'disk_usage', 'network_io',
    'system_load', 'temperature', 'server_uptime', 'response_time', 'error_rate'
  ]).withMessage('Parameter tidak valid'),
  body('nama').isLength({ min: 1, max: 100 }).withMessage('Nama harus 1-100 karakter'),
  body('thresholds.warning.nilai').isNumeric().withMessage('Threshold warning harus angka'),
  body('thresholds.critical.nilai').isNumeric().withMessage('Threshold critical harus angka'),
  body('thresholds.recovery.nilai').isNumeric().withMessage('Threshold recovery harus angka')
];

const validasiUpdateKondisiAlert = [
  param('id').isMongoId().withMessage('ID kondisi tidak valid'),
  ...validasiBuatKondisiAlert
];

const validasiHapusKondisiAlert = [
  param('id').isMongoId().withMessage('ID kondisi tidak valid')
];

const validasiAcknowledgeAlert = [
  param('id').isMongoId().withMessage('ID alert tidak valid'),
  body('catatan').optional().isLength({ max: 500 }).withMessage('Catatan maksimal 500 karakter')
];

const validasiResolveAlert = [
  param('id').isMongoId().withMessage('ID alert tidak valid'),
  body('catatan').optional().isLength({ max: 1000 }).withMessage('Catatan maksimal 1000 karakter')
];


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
  // Kondisi alert
  dapatkanKondisiAlert,
  buatKondisiAlert,
  updateKondisiAlert,
  hapusKondisiAlert,
  validasiBuatKondisiAlert,
  validasiUpdateKondisiAlert,
  validasiHapusKondisiAlert,

  // Alert instances
  dapatkanAlertAktif,
  acknowledgeAlert,
  resolveAlert,
  assignAlert,
  evaluasiAlertManual,
  dapatkanDetailAlert,
  dapatkanStatistikAlert,
  dapatkanAlertPerluEscalation,

  // Validations for alert instances
  validasiDapatkanAlertAktif,
  validasiAcknowledgeAlert,
  validasiResolveAlert,
  validasiAssignAlert,
  validasiDapatkanDetailAlert,
  validasiDapatkanStatistikAlert
};