// Rute utama aplikasi monitoring server
// Menangani endpoint dasar untuk health check dan status aplikasi

const express = require('express');
const router = express.Router();
const { HTTP_STATUS } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');

/**
 * DESKRIPSI: Endpoint health check untuk validasi server backend
 *
 * TUJUAN: Memastikan server Express.js berjalan dengan benar dan dapat
 * menerima request HTTP. Endpoint ini digunakan untuk monitoring uptime
 * server dan load balancer health checks.
 *
 * ALUR KERJA:
 * 1. Terima request GET tanpa parameter
 * 2. Return response JSON dengan status OK
 * 3. Include timestamp untuk validasi freshness
 * 4. Log request untuk monitoring (opsional)
 *
 * RESPONSE FORMAT:
 * {
 *   "status": "OK",
 *   "timestamp": "2025-12-21T10:30:00.000Z",
 *   "uptime": 3600,
 *   "message": "Server backend dalam kondisi sehat"
 * }
 *
 * @route GET /health
 * @returns {Object} Status kesehatan server
 */
router.get('/health', (req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime(); // uptime dalam detik

  // Log health check (opsional, bisa dinonaktifkan untuk reduce noise)
  logger.logSystemActivity('HEALTH_CHECK_REQUEST', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    uptime: uptime
  });

  // Response health check
  res.status(HTTP_STATUS.OK).json({
    status: 'OK',
    timestamp: timestamp,
    uptime: Math.round(uptime), // uptime dalam detik (dibulatkan)
    message: 'Server backend dalam kondisi sehat'
  });
});

/**
 * DESKRIPSI: Endpoint informasi status aplikasi
 *
 * TUJUAN: Memberikan informasi detail tentang status aplikasi untuk
 * monitoring, debugging, dan informasi versi. Endpoint ini memberikan
 * overview kondisi aplikasi tanpa expose informasi sensitif.
 *
 * ALUR KERJA:
 * 1. Kumpulkan informasi aplikasi dari environment
 * 2. Hitung uptime dan memory usage
 * 3. Format response dengan informasi yang aman
 * 4. Log request untuk audit trail
 *
 * RESPONSE FORMAT:
 * {
 *   "aplikasi": {
 *     "nama": "backend-monitoring-server",
 *     "versi": "1.0.0",
 *     "deskripsi": "Backend untuk Sistem Monitoring Health Server",
 *     "environment": "development"
 *   },
 *   "server": {
 *     "status": "running",
 *     "uptime": 3600,
 *     "memory": {
 *       "used": 52428800,
 *       "total": 2147483648,
 *       "percentage": 2.44
 *     },
 *     "nodeVersion": "v18.17.0",
 *     "platform": "win32"
 *   },
 *   "timestamp": "2025-12-21T10:30:00.000Z"
 * }
 *
 * @route GET /status
 * @returns {Object} Informasi lengkap status aplikasi
 */
router.get('/status', (req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  // Informasi aplikasi dari package.json (hardcoded untuk simplicity)
  const infoAplikasi = {
    nama: 'backend-monitoring-server',
    versi: '1.0.0',
    deskripsi: 'Backend untuk Sistem Monitoring Health Server dengan Express.js, Socket.IO, dan AI Chatbot',
    environment: process.env.NODE_ENV || 'development'
  };

  // Informasi server
  const infoServer = {
    status: 'running',
    uptime: Math.round(uptime), // dalam detik
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 10000) / 100 // 2 decimal places
    },
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch
  };

  // Log status request
  logger.logSystemActivity('STATUS_REQUEST', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    memoryUsage: infoServer.memory.percentage
  });

  // Response status aplikasi
  res.status(HTTP_STATUS.OK).json({
    aplikasi: infoAplikasi,
    server: infoServer,
    timestamp: timestamp
  });
});

/**
 * DESKRIPSI: Endpoint root untuk informasi API
 *
 * TUJUAN: Memberikan informasi dasar tentang API yang tersedia
 * dan cara mengakses dokumentasi endpoint lainnya.
 *
 * @route GET /
 * @returns {Object} Informasi API dasar
 */
router.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    message: 'Backend Monitoring Server API',
    versi: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health - Health check server',
      status: 'GET /status - Informasi status aplikasi',
      dokumentasi: 'Lihat README.md untuk dokumentasi lengkap API'
    },
    timestamp: new Date().toISOString()
  });
});

// Export router
module.exports = router;