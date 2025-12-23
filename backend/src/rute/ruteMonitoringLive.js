// Rute untuk Monitoring Live - Global State & Manual Override API
// Endpoint untuk automated simulation dan manual testing

const express = require('express');
const router = express.Router();
const { monitoringLiveService } = require('../layanan/layananMonitoringLive');
const autentikasi = require('../middleware/autentikasi');
const { HTTP_STATUS } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');

/**
 * GET /api/monitoring/health
 * Mendapatkan current global state untuk semua server atau server tertentu
 */
router.get('/health', autentikasi.verifikasiToken, async (req, res) => {
  try {
    const { serverId } = req.query;

    let result;
    if (serverId) {
      // Get metrics untuk server tertentu
      result = monitoringLiveService.getCurrentMetrics(serverId);
    } else {
      // Get all servers metrics
      result = monitoringLiveService.getAllMetrics();
    }

    logger.logUserActivity(req.user.id, 'MONITORING_HEALTH_REQUEST', {
      serverId: serverId || 'all',
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Current monitoring state retrieved',
      data: result,
      timestamp: new Date()
    });

  } catch (error) {
    logger.logError('MONITORING_HEALTH_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve monitoring health',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/monitoring/override
 * Manual override untuk testing - inject specific values
 * 
 * Body: {
 *   serverId: string (required),
 *   cpu?: number (0-100),
 *   ram?: number (0-100),
 *   disk?: number (0-100),
 *   temperature?: number (0-100),
 *   lockDuration?: number (milliseconds, default: 2 minutes)
 * }
 */
router.post('/override', autentikasi.verifikasiToken, async (req, res) => {
  try {
    const { serverId, cpu, ram, disk, temperature, lockDuration } = req.body;

    // Validation
    if (!serverId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'serverId is required'
      });
    }

    // Build override object (only include provided values)
    const overrideMetrics = {};
    if (cpu !== undefined) overrideMetrics.cpu = Number(cpu);
    if (ram !== undefined) overrideMetrics.ram = Number(ram);
    if (disk !== undefined) overrideMetrics.disk = Number(disk);
    if (temperature !== undefined) overrideMetrics.temperature = Number(temperature);

    // Check if at least one metric is provided
    if (Object.keys(overrideMetrics).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'At least one metric (cpu, ram, disk, temperature) must be provided'
      });
    }

    // Validate ranges
    for (const [key, value] of Object.entries(overrideMetrics)) {
      if (isNaN(value) || value < 0 || value > 100) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Invalid value for ${key}: must be between 0 and 100`
        });
      }
    }

    // Apply override
    const result = monitoringLiveService.setOverride(
      serverId,
      overrideMetrics,
      lockDuration ? Number(lockDuration) : undefined
    );

    logger.logUserActivity(req.user.id, 'MONITORING_OVERRIDE_APPLIED', {
      serverId,
      overrideMetrics,
      lockDuration,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Override applied successfully',
      data: result,
      timestamp: new Date()
    });

  } catch (error) {
    logger.logError('MONITORING_OVERRIDE_ERROR', error, {
      userId: req.user.id,
      body: req.body,
      ip: req.ip
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to apply override',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/monitoring/override/:serverId
 * Clear manual override untuk server tertentu
 */
router.delete('/override/:serverId', autentikasi.verifikasiToken, async (req, res) => {
  try {
    const { serverId } = req.params;

    monitoringLiveService.clearOverride(serverId);

    logger.logUserActivity(req.user.id, 'MONITORING_OVERRIDE_CLEARED', {
      serverId,
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Override cleared successfully',
      serverId,
      timestamp: new Date()
    });

  } catch (error) {
    logger.logError('MONITORING_OVERRIDE_CLEAR_ERROR', error, {
      userId: req.user.id,
      serverId: req.params.serverId,
      ip: req.ip
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to clear override',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/monitoring/status
 * Get service status (untuk debugging)
 */
router.get('/status', autentikasi.verifikasiToken, async (req, res) => {
  try {
    const status = monitoringLiveService.getStatus();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Monitoring service status',
      data: status,
      timestamp: new Date()
    });

  } catch (error) {
    logger.logError('MONITORING_STATUS_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get service status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/monitoring/start
 * Start automated loop (biasanya dipanggil saat server startup)
 */
router.post('/start', autentikasi.verifikasiToken, async (req, res) => {
  try {
    monitoringLiveService.startAutomatedLoop();

    logger.logUserActivity(req.user.id, 'MONITORING_LOOP_STARTED', {
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Monitoring automated loop started',
      timestamp: new Date()
    });

  } catch (error) {
    logger.logError('MONITORING_START_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to start monitoring loop',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/monitoring/stop
 * Stop automated loop (untuk maintenance/debugging)
 */
router.post('/stop', autentikasi.verifikasiToken, async (req, res) => {
  try {
    monitoringLiveService.stopAutomatedLoop();

    logger.logUserActivity(req.user.id, 'MONITORING_LOOP_STOPPED', {
      ip: req.ip
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Monitoring automated loop stopped',
      timestamp: new Date()
    });

  } catch (error) {
    logger.logError('MONITORING_STOP_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to stop monitoring loop',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
