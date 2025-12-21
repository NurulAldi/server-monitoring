// Kontroler untuk mengelola operasi data metrik server
// Handle request/response untuk endpoint monitoring metrik performa server

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananMetrik = require('../layanan/layananMetrik');
const { body, param, query, validationResult } = require('express-validator');

/**
 * DESKRIPSI: Handle request untuk mendapatkan metrik terbaru dari server
 *
 * TUJUAN: Memberikan data performa server terkini untuk monitoring real-time
 * dan dashboard monitoring.
 *
 * ALUR:
 * 1. Validasi parameter server ID
 * 2. Ambil data metrik terbaru dari layanan
 * 3. Format response untuk frontend
 * 4. Log aktivitas untuk audit trail
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idServer - ID server yang diminta
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan data metrik terbaru
 */
async function dapatkanMetrikTerbaru(req, res) {
  try {
    const userId = req.user.id;
    const { idServer } = req.params;

    // Log aktivitas
    logger.logUserActivity(userId, 'METRICS_REQUEST_LATEST', {
      serverId: idServer,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan metrik terbaru
    const dataMetrik = await layananMetrik.dapatkanMetrikTerbaru(idServer);

    // Log berhasil
    logger.logUserActivity(userId, 'METRICS_REQUEST_SUCCESS', {
      serverId: idServer,
      metricsCount: dataMetrik ? 1 : 0,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Data metrik terbaru berhasil didapatkan',
      data: dataMetrik
    });

  } catch (error) {
    // Log error
    logger.logError('METRICS_LATEST_ERROR', error, {
      userId: req.user.id,
      serverId: req.params.idServer,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil data metrik',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan histori metrik server
 *
 * TUJUAN: Memberikan data historis performa server untuk analisis trend
 * dan troubleshooting masalah performa.
 *
 * ALUR:
 * 1. Validasi parameter server ID dan filter waktu
 * 2. Ambil data histori dari layanan dengan pagination
 * 3. Format response dengan metadata pagination
 * 4. Log aktivitas untuk monitoring usage
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idServer - ID server
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.jam - Jumlah jam histori (default: 24)
 * @param {number} req.query.halaman - Nomor halaman (default: 1)
 * @param {number} req.query.limit - Jumlah data per halaman (default: 50)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan histori metrik
 */
async function dapatkanHistoriMetrik(req, res) {
  try {
    const userId = req.user.id;
    const { idServer } = req.params;
    const { jam = 24, halaman = 1, limit = 50 } = req.query;

    // Validasi parameter
    const jamInt = parseInt(jam);
    const halamanInt = parseInt(halaman);
    const limitInt = parseInt(limit);

    if (jamInt < 1 || jamInt > 168) { // Max 1 minggu
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Parameter jam harus antara 1-168 jam'
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'METRICS_REQUEST_HISTORY', {
      serverId: idServer,
      hours: jamInt,
      page: halamanInt,
      limit: limitInt,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan histori
    const hasilHistori = await layananMetrik.dapatkanHistoriMetrik(
      idServer,
      jamInt,
      halamanInt,
      limitInt
    );

    // Log berhasil
    logger.logUserActivity(userId, 'METRICS_HISTORY_SUCCESS', {
      serverId: idServer,
      dataCount: hasilHistori.data.length,
      totalPages: hasilHistori.pagination.totalHalaman,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Histori metrik berhasil didapatkan',
      data: hasilHistori.data,
      pagination: hasilHistori.pagination
    });

  } catch (error) {
    // Log error
    logger.logError('METRICS_HISTORY_ERROR', error, {
      userId: req.user.id,
      serverId: req.params.idServer,
      hours: req.query.jam,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil histori metrik',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan statistik metrik server
 *
 * TUJUAN: Memberikan ringkasan statistik performa server untuk dashboard
 * dan laporan monitoring.
 *
 * ALUR:
 * 1. Validasi parameter server ID dan periode
 * 2. Hitung statistik dari layanan
 * 3. Format response dengan rata-rata, maksimum, dan trend
 * 4. Log aktivitas untuk tracking usage
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idServer - ID server
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.jam - Periode statistik dalam jam (default: 24)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan statistik metrik
 */
async function dapatkanStatistikMetrik(req, res) {
  try {
    const userId = req.user.id;
    const { idServer } = req.params;
    const { jam = 24 } = req.query;

    // Validasi parameter
    const jamInt = parseInt(jam);
    if (jamInt < 1 || jamInt > 720) { // Max 30 hari
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Parameter jam harus antara 1-720 jam'
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'METRICS_REQUEST_STATS', {
      serverId: idServer,
      hours: jamInt,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan statistik
    const statistik = await layananMetrik.dapatkanStatistikMetrik(idServer, jamInt);

    // Log berhasil
    logger.logUserActivity(userId, 'METRICS_STATS_SUCCESS', {
      serverId: idServer,
      dataPoints: statistik.jumlahData,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Statistik metrik berhasil didapatkan',
      data: statistik
    });

  } catch (error) {
    // Log error
    logger.logError('METRICS_STATS_ERROR', error, {
      userId: req.user.id,
      serverId: req.params.idServer,
      hours: req.query.jam,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil statistik metrik',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendeteksi anomali pada metrik server
 *
 * TUJUAN: Mengidentifikasi pola tidak normal pada performa server
 * untuk early warning dan proactive monitoring.
 *
 * ALUR:
 * 1. Validasi parameter server ID dan periode analisis
 * 2. Analisis data metrik untuk deteksi anomali
 * 3. Return daftar anomali yang terdeteksi dengan confidence score
 * 4. Log aktivitas untuk audit
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.idServer - ID server
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.jam - Periode analisis dalam jam (default: 24)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan data anomali
 */
async function deteksiAnomaliMetrik(req, res) {
  try {
    const userId = req.user.id;
    const { idServer } = req.params;
    const { jam = 24 } = req.query;

    // Validasi parameter
    const jamInt = parseInt(jam);
    if (jamInt < 6 || jamInt > 168) { // Min 6 jam, max 1 minggu
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Parameter jam harus antara 6-168 jam untuk analisis anomali'
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'METRICS_ANOMALY_DETECTION', {
      serverId: idServer,
      hours: jamInt,
      ip: req.ip
    });

    // Panggil layanan untuk deteksi anomali
    const hasilAnomali = await layananMetrik.deteksiAnomaliMetrik(idServer, jamInt);

    // Log berhasil
    logger.logUserActivity(userId, 'METRICS_ANOMALY_SUCCESS', {
      serverId: idServer,
      anomaliesFound: hasilAnomali.anomali.length,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deteksi anomali metrik berhasil',
      data: hasilAnomali
    });

  } catch (error) {
    // Log error
    logger.logError('METRICS_ANOMALY_ERROR', error, {
      userId: req.user.id,
      serverId: req.params.idServer,
      hours: req.query.jam,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mendeteksi anomali metrik',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan ringkasan kesehatan server
 *
 * TUJUAN: Memberikan overview cepat status kesehatan semua server
 * untuk dashboard monitoring utama.
 *
 * ALUR:
 * 1. Ambil data metrik terbaru dari semua server user
 * 2. Hitung status kesehatan keseluruhan
 * 3. Format response dengan summary per server
 * 4. Log aktivitas monitoring
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan ringkasan kesehatan
 */
async function dapatkanRingkasanKesehatan(req, res) {
  try {
    const userId = req.user.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'METRICS_HEALTH_SUMMARY', {
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan ringkasan kesehatan
    const ringkasanKesehatan = await layananMetrik.dapatkanRingkasanKesehatan(userId);

    // Log berhasil
    logger.logUserActivity(userId, 'METRICS_HEALTH_SUCCESS', {
      serversCount: ringkasanKesehatan.ringkasan.length,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Ringkasan kesehatan server berhasil didapatkan',
      data: ringkasanKesehatan
    });

  } catch (error) {
    // Log error
    logger.logError('METRICS_HEALTH_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil ringkasan kesehatan',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * VALIDATION RULES
 *
 * Aturan validasi untuk input kontroler metrik
 */
const validasiDapatkanMetrikTerbaru = [
  param('idServer')
    .isMongoId()
    .withMessage('ID server tidak valid'),
];

const validasiDapatkanHistoriMetrik = [
  param('idServer')
    .isMongoId()
    .withMessage('ID server tidak valid'),
  query('jam')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Jam harus antara 1-168'),
  query('halaman')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Halaman harus lebih dari 0'),
  query('limit')
    .optional()
    .isInt({ min: 5, max: 100 })
    .withMessage('Limit harus antara 5-100'),
];

const validasiDapatkanStatistikMetrik = [
  param('idServer')
    .isMongoId()
    .withMessage('ID server tidak valid'),
  query('jam')
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage('Jam harus antara 1-720'),
];

const validasiDeteksiAnomaliMetrik = [
  param('idServer')
    .isMongoId()
    .withMessage('ID server tidak valid'),
  query('jam')
    .optional()
    .isInt({ min: 6, max: 168 })
    .withMessage('Jam harus antara 6-168 untuk analisis anomali'),
];

// Export semua fungsi dan validasi
module.exports = {
  dapatkanMetrikTerbaru,
  dapatkanHistoriMetrik,
  dapatkanStatistikMetrik,
  deteksiAnomaliMetrik,
  dapatkanRingkasanKesehatan,
  validasiDapatkanMetrikTerbaru,
  validasiDapatkanHistoriMetrik,
  validasiDapatkanStatistikMetrik,
  validasiDeteksiAnomaliMetrik
};