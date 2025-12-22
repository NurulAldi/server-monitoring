// Rute untuk monitoring status server
// Endpoint untuk monitoring dan manajemen status server

const express = require('express');
const router = express.Router();
const layananStatusServer = require('../layanan/layananStatusServer');
const Server = require('../model/Server');
const { logger } = require('../utilitas/logger');
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const autentikasi = require('../middleware/autentikasi');

// Semua route memerlukan autentikasi admin
router.use(autentikasi.verifikasiToken, autentikasi.verifikasiPeran(['admin']));

// Get status semua server
router.get('/', async (req, res) => {
  try {
    const semuaStatus = layananStatusServer.getSemuaStatusServer();

    // Enrich dengan data server
    const servers = await Server.find({
      _id: { $in: Object.keys(semuaStatus) }
    }).select('_id nama ipAddress status');

    const enrichedStatus = servers.map(server => ({
      serverId: server._id,
      nama: server.nama,
      ipAddress: server.ipAddress,
      databaseStatus: server.status,
      monitoringStatus: semuaStatus[server._id.toString()] || null
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrichedStatus,
      summary: {
        total: enrichedStatus.length,
        healthy: enrichedStatus.filter(s => s.monitoringStatus?.status === 'HEALTHY').length,
        warning: enrichedStatus.filter(s => s.monitoringStatus?.status === 'WARNING').length,
        critical: enrichedStatus.filter(s => s.monitoringStatus?.status === 'CRITICAL').length,
        danger: enrichedStatus.filter(s => s.monitoringStatus?.status === 'DANGER').length,
        offline: enrichedStatus.filter(s => s.monitoringStatus?.status === 'OFFLINE').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('GET_ALL_SERVER_STATUS_FAILED', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mendapatkan status semua server',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get status server tertentu
router.get('/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId).select('_id nama ipAddress status statusServer waktuStatusTerakhir detailStatus');
    if (!server) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Server tidak ditemukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    const monitoringStatus = layananStatusServer.getStatusServer(serverId);
    const statusHistory = layananStatusServer.getStatusHistory(serverId, 20);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        server: {
          id: server._id,
          nama: server.nama,
          ipAddress: server.ipAddress,
          databaseStatus: server.status,
          monitoringStatus: server.statusServer,
          waktuStatusTerakhir: server.waktuStatusTerakhir,
          detailStatus: server.detailStatus
        },
        monitoring: monitoringStatus,
        history: statusHistory
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('GET_SERVER_STATUS_FAILED', error, { serverId: req.params.serverId });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mendapatkan status server',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get history status server
router.get('/:serverId/history', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { limit = 50, startDate, endDate } = req.query;

    const server = await Server.findById(serverId).select('_id nama');
    if (!server) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Server tidak ditemukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    let history = layananStatusServer.getStatusHistory(serverId, parseInt(limit));

    // Filter by date range jika disediakan
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();

      history = history.filter(h => {
        const timestamp = new Date(h.timestamp);
        return timestamp >= start && timestamp <= end;
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        serverId,
        serverName: server.nama,
        history,
        count: history.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('GET_SERVER_STATUS_HISTORY_FAILED', error, { serverId: req.params.serverId });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mendapatkan history status server',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Force update status server
router.post('/:serverId/update', async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId).select('_id nama');
    if (!server) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Server tidak ditemukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.logSystemActivity('MANUAL_STATUS_UPDATE', {
      serverId,
      triggeredBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    await layananStatusServer.updateStatusServer(serverId);

    const updatedStatus = layananStatusServer.getStatusServer(serverId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedStatus,
      message: `Status server ${server.nama} berhasil diupdate`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('MANUAL_STATUS_UPDATE_FAILED', error, {
      serverId: req.params.serverId,
      userId: req.user.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal update status server',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Override status server (maintenance mode)
router.post('/:serverId/override', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { status, reason, duration } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_INPUT,
          message: 'Status wajib diisi',
          timestamp: new Date().toISOString()
        }
      });
    }

    const validStatuses = ['HEALTHY', 'WARNING', 'CRITICAL', 'DANGER', 'OFFLINE', 'MAINTENANCE'];
    if (!validStatuses.includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_INPUT,
          message: `Status tidak valid. Status yang valid: ${validStatuses.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    const server = await Server.findById(serverId).select('_id nama');
    if (!server) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Server tidak ditemukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.logSystemActivity('STATUS_OVERRIDE_REQUEST', {
      serverId,
      requestedStatus: status,
      reason: reason || 'Manual override',
      duration,
      triggeredBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    const result = await layananStatusServer.overrideStatusServer(
      serverId,
      status,
      reason || 'Manual override by admin',
      duration ? parseInt(duration) : null
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `Status server ${server.nama} berhasil di-override`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('STATUS_OVERRIDE_FAILED', error, {
      serverId: req.params.serverId,
      requestedStatus: req.body.status,
      userId: req.user.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal override status server',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Revert status override
router.post('/:serverId/revert', async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId).select('_id nama');
    if (!server) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Server tidak ditemukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.logSystemActivity('STATUS_OVERRIDE_REVERT_REQUEST', {
      serverId,
      triggeredBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    const result = await layananStatusServer.revertOverrideStatus(serverId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `Status override server ${server.nama} berhasil di-revert`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('STATUS_OVERRIDE_REVERT_FAILED', error, {
      serverId: req.params.serverId,
      userId: req.user.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal revert status override',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get status layanan monitoring
router.get('/service/status', async (req, res) => {
  try {
    const status = layananStatusServer.getStatusLayanan();

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

module.exports = router;