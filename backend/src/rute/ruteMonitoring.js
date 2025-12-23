// Rute untuk monitoring dashboard
// Endpoint untuk mendapatkan data monitoring real-time

const express = require('express');
const router = express.Router();
const Metrik = require('../model/Metrik');
const Server = require('../model/Server');
const { logger } = require('../utilitas/logger');
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const autentikasi = require('../middleware/autentikasi');

// Semua route memerlukan autentikasi
router.use(autentikasi.verifikasiToken);

// Get dashboard summary metrics
router.get('/', async (req, res) => {
  try {
    // Get server counts by status
    const servers = await Server.find({ status: 'aktif' }).select('statusServer');
    const summary = {
      totalServer: servers.length,
      sehat: servers.filter(s => s.statusServer === 'HEALTHY').length,
      peringatan: servers.filter(s => s.statusServer === 'WARNING').length,
      kritis: servers.filter(s => s.statusServer === 'CRITICAL').length,
      bahaya: servers.filter(s => s.statusServer === 'DANGER').length,
      offline: servers.filter(s => s.statusServer === 'OFFLINE').length
    };

    // Get latest metrics for global averages
    const latestMetrics = await Metrik.find()
      .sort({ timestampPengumpulan: -1 })
      .limit(100) // Get last 100 metrics for averaging
      .select('cpu.memori jaringan');

    let cpuRataRata = 0;
    let memoriRataRata = 0;
    let totalMetrics = 0;

    if (latestMetrics.length > 0) {
      const cpuSum = latestMetrics.reduce((sum, m) => sum + (m.cpu?.persentase || 0), 0);
      const memoriSum = latestMetrics.reduce((sum, m) => sum + (m.memori?.persentase || 0), 0);
      totalMetrics = latestMetrics.length;

      cpuRataRata = Math.round((cpuSum / totalMetrics) * 100) / 100;
      memoriRataRata = Math.round((memoriSum / totalMetrics) * 100) / 100;
    }

    // Get active alerts count (simplified)
    const alertAktif = Math.floor(Math.random() * 5); // TODO: Implement real alert counting

    const summaryData = {
      timestamp: new Date().toISOString(),
      ringkasan: summary,
      perubahanTerbaru: [], // TODO: Implement recent changes
      metrikGlobal: {
        cpuRataRata,
        memoriRataRata,
        alertAktif
      }
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: summaryData
    });
  } catch (error) {
    logger.logSystemError('GET_MONITORING_SUMMARY_FAILED', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mendapatkan data monitoring',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get current metrics for all servers
router.get('/current', async (req, res) => {
  try {
    // Get latest metrics for each server
    const servers = await Server.find({ status: 'aktif' }).select('_id nama');

    const currentMetrics = [];

    for (const server of servers) {
      const latestMetric = await Metrik.findOne({ serverId: server._id })
        .sort({ timestampPengumpulan: -1 })
        .select('cpu memori disk jaringan timestampPengumpulan');

      if (latestMetric) {
        currentMetrics.push({
          serverId: server._id,
          nama: server.nama,
          metrics: {
            cpu: latestMetric.cpu?.persentase || 0,
            memori: latestMetric.memori?.persentase || 0,
            disk: latestMetric.disk?.persentase || 0,
            jaringan: {
              downloadMbps: latestMetric.jaringan?.downloadMbps || 0,
              uploadMbps: latestMetric.jaringan?.uploadMbps || 0,
              latensiMs: latestMetric.jaringan?.latensiMs || 0
            }
          },
          timestamp: latestMetric.timestampPengumpulan
        });
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: currentMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logSystemError('GET_CURRENT_METRICS_FAILED', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Gagal mendapatkan metrics terkini',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;