// Kontroler untuk mengelola operasi konfigurasi sistem
// Handle request/response untuk endpoint pengaturan monitoring

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananKonfigurasi = require('../layanan/layananKonfigurasi');
const { body, param, query, validationResult } = require('express-validator');

/**
 * DESKRIPSI: Handle request untuk mendapatkan semua konfigurasi sistem
 *
 * TUJUAN: Menampilkan semua pengaturan monitoring yang aktif
 * untuk review dan management konfigurasi.
 *
 * ALUR:
 * 1. Validasi akses admin (opsional berdasarkan kebutuhan)
 * 2. Ambil semua konfigurasi dari layanan
 * 3. Format response dengan grouping logis
 * 4. Log aktivitas akses konfigurasi
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan semua konfigurasi
 */
async function dapatkanSemuaKonfigurasi(req, res) {
  try {
    const userId = req.user.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'CONFIG_REQUEST_ALL', {
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan semua konfigurasi
    const semuaKonfigurasi = await layananKonfigurasi.dapatkanSemuaKonfigurasi();

    // Log berhasil
    logger.logUserActivity(userId, 'CONFIG_ALL_SUCCESS', {
      configCount: Object.keys(semuaKonfigurasi).length,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Semua konfigurasi berhasil didapatkan',
      data: semuaKonfigurasi
    });

  } catch (error) {
    // Log error
    logger.logError('CONFIG_ALL_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil konfigurasi',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan konfigurasi berdasarkan kategori
 *
 * TUJUAN: Menampilkan pengaturan dalam kategori tertentu untuk
 * management konfigurasi yang lebih fokus.
 *
 * ALUR:
 * 1. Validasi parameter kategori
 * 2. Ambil konfigurasi berdasarkan kategori dari layanan
 * 3. Format response dengan informasi lengkap
 * 4. Log akses konfigurasi per kategori
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.kategori - Kategori konfigurasi
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan konfigurasi kategori
 */
async function dapatkanKonfigurasiKategori(req, res) {
  try {
    const userId = req.user.id;
    const { kategori } = req.params;

    // Validasi kategori yang didukung
    const kategoriValid = ['monitoring', 'alert', 'ai', 'email', 'sistem'];
    if (!kategoriValid.includes(kategori)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Kategori tidak valid. Pilih dari: ${kategoriValid.join(', ')}`
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'CONFIG_REQUEST_CATEGORY', {
      category: kategori,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan konfigurasi kategori
    const konfigurasiKategori = await layananKonfigurasi.dapatkanKonfigurasiKategori(kategori);

    // Log berhasil
    logger.logUserActivity(userId, 'CONFIG_CATEGORY_SUCCESS', {
      category: kategori,
      configCount: Object.keys(konfigurasiKategori).length,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Konfigurasi kategori ${kategori} berhasil didapatkan`,
      data: konfigurasiKategori
    });

  } catch (error) {
    // Log error
    logger.logError('CONFIG_CATEGORY_ERROR', error, {
      userId: req.user.id,
      category: req.params.kategori,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil konfigurasi kategori',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk update konfigurasi tertentu
 *
 * TUJUAN: Mengubah nilai konfigurasi sistem untuk penyesuaian
 * behavior monitoring sesuai kebutuhan.
 *
 * ALUR:
 * 1. Validasi input konfigurasi
 * 2. Panggil layanan untuk update konfigurasi
 * 3. Log perubahan konfigurasi untuk audit
 * 4. Return konfirmasi update
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.kunci - Kunci konfigurasi yang akan diupdate
 * @param {Object} req.body - Request body
 * @param {any} req.body.nilai - Nilai baru untuk konfigurasi
 * @param {string} req.body.keterangan - Keterangan perubahan (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi update
 */
async function updateKonfigurasi(req, res) {
  try {
    const userId = req.user.id;
    const { kunci } = req.params;
    const { nilai, keterangan } = req.body;

    // Log aktivitas
    logger.logUserActivity(userId, 'CONFIG_UPDATE_REQUEST', {
      configKey: kunci,
      hasNote: !!keterangan,
      ip: req.ip
    });

    // Panggil layanan untuk update konfigurasi
    const konfigurasiDiupdate = await layananKonfigurasi.updateKonfigurasi(
      kunci,
      nilai,
      userId,
      keterangan
    );

    // Log berhasil
    logger.logUserActivity(userId, 'CONFIG_UPDATE_SUCCESS', {
      configKey: kunci,
      oldValue: konfigurasiDiupdate.nilaiLama,
      newValue: konfigurasiDiupdate.nilaiBaru,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Konfigurasi berhasil diupdate',
      data: konfigurasiDiupdate
    });

  } catch (error) {
    // Log error
    logger.logError('CONFIG_UPDATE_ERROR', error, {
      userId: req.user.id,
      configKey: req.params.kunci,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat update konfigurasi',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk reset konfigurasi ke default
 *
 * TUJUAN: Mengembalikan konfigurasi ke nilai default sistem
 * untuk recovery dari konfigurasi yang bermasalah.
 *
 * ALUR:
 * 1. Validasi kunci konfigurasi
 * 2. Panggil layanan untuk reset ke default
 * 3. Log reset konfigurasi untuk audit
 * 4. Return konfirmasi reset
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.kunci - Kunci konfigurasi yang akan direset
 * @param {Object} req.body - Request body
 * @param {string} req.body.konfirmasi - Konfirmasi reset (harus 'RESET')
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi reset
 */
async function resetKonfigurasi(req, res) {
  try {
    const userId = req.user.id;
    const { kunci } = req.params;
    const { konfirmasi } = req.body;

    // Validasi konfirmasi
    if (konfirmasi !== 'RESET') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Konfirmasi reset harus berisi "RESET"'
      });
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'CONFIG_RESET_REQUEST', {
      configKey: kunci,
      ip: req.ip
    });

    // Panggil layanan untuk reset konfigurasi
    const konfigurasiDireset = await layananKonfigurasi.resetKonfigurasi(kunci, userId);

    // Log berhasil
    logger.logUserActivity(userId, 'CONFIG_RESET_SUCCESS', {
      configKey: kunci,
      oldValue: konfigurasiDireset.nilaiLama,
      defaultValue: konfigurasiDireset.nilaiDefault,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Konfigurasi berhasil direset ke default',
      data: konfigurasiDireset
    });

  } catch (error) {
    // Log error
    logger.logError('CONFIG_RESET_ERROR', error, {
      userId: req.user.id,
      configKey: req.params.kunci,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat reset konfigurasi',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk mendapatkan history perubahan konfigurasi
 *
 * TUJUAN: Melacak semua perubahan konfigurasi untuk audit trail
 * dan troubleshooting masalah konfigurasi.
 *
 * ALUR:
 * 1. Validasi parameter pagination
 * 2. Ambil history perubahan dari layanan
 * 3. Format response dengan detail perubahan
 * 4. Log akses history
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.halaman - Nomor halaman (default: 1)
 * @param {number} req.query.limit - Jumlah data per halaman (default: 20)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan history konfigurasi
 */
async function dapatkanHistoryKonfigurasi(req, res) {
  try {
    const userId = req.user.id;
    const { halaman = 1, limit = 20 } = req.query;

    // Validasi parameter
    const halamanInt = parseInt(halaman);
    const limitInt = parseInt(limit);

    // Log aktivitas
    logger.logUserActivity(userId, 'CONFIG_HISTORY_REQUEST', {
      page: halamanInt,
      limit: limitInt,
      ip: req.ip
    });

    // Panggil layanan untuk dapatkan history
    const historyKonfigurasi = await layananKonfigurasi.dapatkanHistoryKonfigurasi(
      halamanInt,
      limitInt
    );

    // Log berhasil
    logger.logUserActivity(userId, 'CONFIG_HISTORY_SUCCESS', {
      changesCount: historyKonfigurasi.data.length,
      totalPages: historyKonfigurasi.pagination.totalHalaman,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'History konfigurasi berhasil didapatkan',
      data: historyKonfigurasi.data,
      pagination: historyKonfigurasi.pagination
    });

  } catch (error) {
    // Log error
    logger.logError('CONFIG_HISTORY_ERROR', error, {
      userId: req.user.id,
      page: req.query.halaman,
      limit: req.query.limit,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil history konfigurasi',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk test konfigurasi AI
 *
 * TUJUAN: Memverifikasi konfigurasi AI service berfungsi dengan baik
 * sebelum digunakan untuk monitoring.
 *
 * ALUR:
 * 1. Panggil layanan untuk test koneksi AI
 * 2. Log hasil test untuk monitoring
 * 3. Return status koneksi AI
 * 4. Berikan informasi troubleshooting jika gagal
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan hasil test AI
 */
async function testKonfigurasiAI(req, res) {
  try {
    const userId = req.user.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'CONFIG_AI_TEST_REQUEST', {
      ip: req.ip
    });

    // Panggil layanan untuk test AI
    const hasilTest = await layananKonfigurasi.testKonfigurasiAI();

    // Log berhasil
    logger.logUserActivity(userId, 'CONFIG_AI_TEST_SUCCESS', {
      aiStatus: hasilTest.success ? 'connected' : 'failed',
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Test konfigurasi AI selesai',
      data: hasilTest
    });

  } catch (error) {
    // Log error
    logger.logError('CONFIG_AI_TEST_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat test konfigurasi AI',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * DESKRIPSI: Handle request untuk test konfigurasi email
 *
 * TUJUAN: Memverifikasi konfigurasi email service untuk notifikasi alert
 * berfungsi dengan baik.
 *
 * ALUR:
 * 1. Panggil layanan untuk test email
 * 2. Log hasil test untuk monitoring
 * 3. Return status koneksi email
 * 4. Berikan informasi troubleshooting jika gagal
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan hasil test email
 */
async function testKonfigurasiEmail(req, res) {
  try {
    const userId = req.user.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'CONFIG_EMAIL_TEST_REQUEST', {
      ip: req.ip
    });

    // Panggil layanan untuk test email
    const hasilTest = await layananKonfigurasi.testKonfigurasiEmail();

    // Log berhasil
    logger.logUserActivity(userId, 'CONFIG_EMAIL_TEST_SUCCESS', {
      emailStatus: hasilTest.success ? 'connected' : 'failed',
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Test konfigurasi email selesai',
      data: hasilTest
    });

  } catch (error) {
    // Log error
    logger.logError('CONFIG_EMAIL_TEST_ERROR', error, {
      userId: req.user.id,
      ip: req.ip
    });

    // Response error
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat test konfigurasi email',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * VALIDATION RULES
 *
 * Aturan validasi untuk input kontroler konfigurasi
 */
const validasiDapatkanKonfigurasiKategori = [
  param('kategori')
    .isIn(['monitoring', 'alert', 'ai', 'email', 'sistem'])
    .withMessage('Kategori tidak valid'),
];

const validasiUpdateKonfigurasi = [
  param('kunci')
    .notEmpty()
    .withMessage('Kunci konfigurasi wajib diisi'),
  body('nilai')
    .exists()
    .withMessage('Nilai konfigurasi wajib diisi'),
  body('keterangan')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Keterangan maksimal 500 karakter'),
];

const validasiResetKonfigurasi = [
  param('kunci')
    .notEmpty()
    .withMessage('Kunci konfigurasi wajib diisi'),
  body('konfirmasi')
    .equals('RESET')
    .withMessage('Konfirmasi harus berisi "RESET"'),
];

const validasiDapatkanHistoryKonfigurasi = [
  query('halaman')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Halaman harus lebih dari 0'),
  query('limit')
    .optional()
    .isInt({ min: 5, max: 100 })
    .withMessage('Limit harus antara 5-100'),
];

// Export semua fungsi dan validasi
module.exports = {
  dapatkanSemuaKonfigurasi,
  dapatkanKonfigurasiKategori,
  updateKonfigurasi,
  resetKonfigurasi,
  dapatkanHistoryKonfigurasi,
  testKonfigurasiAI,
  testKonfigurasiEmail,
  validasiDapatkanKonfigurasiKategori,
  validasiUpdateKonfigurasi,
  validasiResetKonfigurasi,
  validasiDapatkanHistoryKonfigurasi
};