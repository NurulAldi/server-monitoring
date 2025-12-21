// Rute utama aplikasi monitoring server
// Menangani endpoint dasar untuk health check dan status aplikasi

const express = require('express');
const router = express.Router();
const { HTTP_STATUS } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');

// Import kontroler chatbot AI
const kontrolerChatbotAI = require('../kontroler/kontrolerChatbotAI');

// Import rute alert
const ruteAlert = require('./ruteAlert');

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

/**
 * DESKRIPSI: Endpoint untuk chatbot AI dengan batasan ketat
 *
 * TUJUAN: Menyediakan interface untuk interaksi dengan AI yang hanya dapat:
 * - Menjawab pertanyaan informatif
 * - Menganalisis data kesehatan server
 * - Menjelaskan makna perubahan data
 *
 * AI TIDAK BOLEH mengambil tindakan langsung, mengubah data, atau membuat keputusan sistem.
 *
 * ALUR KERJA:
 * 1. Validasi autentikasi pengguna
 * 2. Validasi batasan pertanyaan (cegah instruksi berbahaya)
 * 3. Ambil data metrik jika diperlukan untuk analisis
 * 4. Generate jawaban AI dengan batasan
 * 5. Return response dengan disclaimer
 *
 * REQUEST BODY:
 * {
 *   "pertanyaan": "string - Pertanyaan pengguna",
 *   "serverId": "string - Opsional, ID server untuk analisis spesifik"
 * }
 *
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "jawaban": "string - Jawaban AI",
 *   "timestamp": "2025-12-21T10:30:00.000Z",
 *   "catatan": "string - Disclaimer tentang batasan AI"
 * }
 *
 * @route POST /ai/chat
 * @middleware autentikasi (required)
 * @param {string} pertanyaan - Pertanyaan pengguna
 * @param {string} serverId - ID server (opsional)
 * @returns {Object} Jawaban AI dengan batasan
 */
router.post('/ai/chat', kontrolerChatbotAI.tanyaChatbot);

/**
 * DESKRIPSI: Endpoint informasi batasan AI
 *
 * TUJUAN: Memberikan informasi jelas tentang peran dan batasan chatbot AI
 * untuk transparansi kepada pengguna.
 *
 * @route GET /ai/info
 * @returns {Object} Informasi peran dan batasan AI
 */
router.get('/ai/info', kontrolerChatbotAI.dapatkanInfoBatasan);

/**
 * DESKRIPSI: Endpoint riwayat chat AI user
 *
 * TUJUAN: Mengambil riwayat percakapan AI user untuk audit dan review.
 * Mendukung pagination dan filtering berdasarkan status dan tanggal.
 *
 * QUERY PARAMETERS:
 * - page: number - Halaman (default: 1)
 * - limit: number - Jumlah item per halaman (default: 20)
 * - status: string - Filter berdasarkan status (active, completed, error)
 * - startDate: string - Filter mulai tanggal (ISO format)
 * - endDate: string - Filter akhir tanggal (ISO format)
 *
 * @route GET /ai/history
 * @middleware autentikasi (required)
 * @returns {Object} Riwayat chat dengan pagination
 */
router.get('/ai/history', kontrolerChatbotAI.dapatkanRiwayatChat);

/**
 * DESKRIPSI: Endpoint statistik chat AI user
 *
 * TUJUAN: Memberikan statistik penggunaan AI chat untuk analisis performa
 * dan evaluasi sistem.
 *
 * QUERY PARAMETERS:
 * - startDate: string - Filter mulai tanggal (ISO format)
 * - endDate: string - Filter akhir tanggal (ISO format)
 *
 * @route GET /ai/stats
 * @middleware autentikasi (required)
 * @returns {Object} Statistik penggunaan AI chat
 */
router.get('/ai/stats', kontrolerChatbotAI.dapatkanStatistikChat);

/**
 * DESKRIPSI: Endpoint detail sesi chat tertentu
 *
 * TUJUAN: Mengambil detail lengkap sesi chat tertentu termasuk semua pesan
 * dan metadata untuk audit atau review.
 *
 * @route GET /ai/session/:sessionId
 * @middleware autentikasi (required)
 * @param {string} sessionId - ID sesi chat
 * @returns {Object} Detail lengkap sesi chat
 */
router.get('/ai/session/:sessionId', kontrolerChatbotAI.dapatkanDetailSesi);

/**
 * DESKRIPSI: Endpoint hapus sesi chat
 *
 * TUJUAN: Menghapus sesi chat (soft delete) untuk privacy dan cleanup.
 * Sesi akan diubah status menjadi 'cancelled'.
 *
 * @route DELETE /ai/session/:sessionId
 * @middleware autentikasi (required)
 * @param {string} sessionId - ID sesi chat
 * @returns {Object} Status penghapusan
 */
router.delete('/ai/session/:sessionId', kontrolerChatbotAI.hapusSesiChat);

// ============================================================================
// RUTE ALERT - Manajemen Alert dan Kondisi Alert
// ============================================================================

/**
 * Mount rute alert di /api/alert
 */
router.use('/alert', ruteAlert);

// Export router
module.exports = router;