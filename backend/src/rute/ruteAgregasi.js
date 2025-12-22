// Rute untuk manajemen penjadwal agregasi metrik
// Endpoint untuk monitoring dan kontrol scheduler

const express = require('express');
const router = express.Router();
const penjadwalAgregasiMetrik = require('../penjadwal/penjadwalAgregasiMetrik');
const layananAgregasiMetrik = require('../layanan/layananAgregasiMetrik');
const { logger } = require('../utilitas/logger');
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const autentikasi = require('../middleware/autentikasi');

// Semua route memerlukan autentikasi admin
router.use(autentikasi.verifikasiToken, autentikasi.verifikasiPeran(['admin']));

// Get status penjadwal
router.get('/status', async (req, res) => {
  try {
    const status = penjadwalAgregasiMetrik.getStatus();
    const infoJadwal = penjadwalAgregasiMetrik.getInfoJadwal();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        scheduler: status,
        scheduleInfo: infoJadwal
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('GET_SCHEDULER_STATUS_FAILED', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mendapatkan status penjadwal',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get status layanan agregasi
router.get('/service-status', async (req, res) => {
  try {
    const status = layananAgregasiMetrik.getStatus();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('GET_SERVICE_STATUS_FAILED', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mendapatkan status layanan',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Trigger manual tugas tertentu
router.post('/trigger/:taskType', async (req, res) => {
  try {
    const { taskType } = req.params;
    const validTasks = ['agregasiHarian', 'analisisTrend', 'updateBaseline', 'cleanup'];

    if (!validTasks.includes(taskType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_INPUT,
          message: `Tipe tugas tidak valid. Tipe yang valid: ${validTasks.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.logSystemActivity('MANUAL_SCHEDULER_TRIGGER', {
      taskType,
      triggeredBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    const result = await penjadwalAgregasiMetrik.triggerManual(taskType);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `Tugas ${taskType} berhasil dijalankan`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('MANUAL_SCHEDULER_TRIGGER_FAILED', error, {
      taskType: req.params.taskType,
      userId: req.user.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: `Gagal menjalankan tugas ${req.params.taskType}`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Reset jadwal untuk tugas tertentu
router.post('/reset/:taskType', async (req, res) => {
  try {
    const { taskType } = req.params;
    const validTasks = ['agregasiHarian', 'analisisTrend', 'updateBaseline', 'cleanup'];

    if (!validTasks.includes(taskType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_INPUT,
          message: `Tipe tugas tidak valid. Tipe yang valid: ${validTasks.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.logSystemActivity('SCHEDULER_RESET', {
      taskType,
      resetBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    const result = penjadwalAgregasiMetrik.resetJadwal(taskType);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `Jadwal ${taskType} berhasil direset`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('SCHEDULER_RESET_FAILED', error, {
      taskType: req.params.taskType,
      userId: req.user.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: `Gagal reset jadwal ${req.params.taskType}`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Trigger agregasi manual untuk server tertentu
router.post('/aggregate/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { type = 'semua' } = req.body; // harian, trend, baseline, semua

    const validTypes = ['harian', 'trend', 'baseline', 'semua'];
    if (!validTypes.includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_INPUT,
          message: `Tipe agregasi tidak valid. Tipe yang valid: ${validTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.logSystemActivity('MANUAL_SERVER_AGGREGATION', {
      serverId,
      type,
      triggeredBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    const result = await layananAgregasiMetrik.triggerAgregasiManual(serverId, type);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `Agregasi ${type} berhasil dijalankan untuk server ${serverId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('MANUAL_SERVER_AGGREGATION_FAILED', error, {
      serverId: req.params.serverId,
      type: req.body.type,
      userId: req.user.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: `Gagal menjalankan agregasi untuk server ${req.params.serverId}`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Rebuild agregat untuk periode tertentu
router.post('/rebuild/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { startDate, endDate, type = 'semua' } = req.body;

    if (!startDate || !endDate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_INPUT,
          message: 'startDate dan endDate wajib diisi',
          timestamp: new Date().toISOString()
        }
      });
    }

    const validTypes = ['harian', 'trend', 'baseline', 'semua'];
    if (!validTypes.includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_INPUT,
          message: `Tipe rebuild tidak valid. Tipe yang valid: ${validTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.logSystemActivity('AGGREGATION_REBUILD', {
      serverId,
      startDate,
      endDate,
      type,
      triggeredBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    const result = await layananAgregasiMetrik.rebuildAgregat(serverId, startDate, endDate, type);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `Rebuild agregat ${type} berhasil untuk server ${serverId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('AGGREGATION_REBUILD_FAILED', error, {
      serverId: req.params.serverId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      type: req.body.type,
      userId: req.user.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: `Gagal rebuild agregat untuk server ${req.params.serverId}`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;