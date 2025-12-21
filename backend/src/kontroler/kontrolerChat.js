// Kontroler untuk mengelola operasi chat AI
// Handle request/response untuk endpoint chat dengan AI

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananChat = require('../layanan/layananChat');

/**
 * DESKRIPSI: Handle request chat dengan AI untuk analisis server
 *
 * TUJUAN: Memungkinkan user bertanya tentang kondisi server atau
 * meminta rekomendasi analisis melalui AI chatbot.
 *
 * ALUR:
 * 1. Ambil pertanyaan dari request body
 * 2. Validasi pertanyaan tidak kosong dan panjangnya reasonable
 * 3. Panggil layanan chat untuk process pertanyaan
 * 4. Return response AI dalam format yang user-friendly
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.pertanyaan - Pertanyaan user ke AI
 * @param {string} req.body.idServer - ID server (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan jawaban AI
 */
async function chatDenganAi(req, res) {
  try {
    const userId = req.user.id;
    const { pertanyaan, idServer } = req.body;

    // Log aktivitas chat
    logger.logUserActivity(userId, 'CHAT_AI_REQUEST', {
      pertanyaan: pertanyaan.substring(0, 100), // Log hanya awal pertanyaan
      idServer: idServer,
      ip: req.ip
    });

    // Panggil layanan chat untuk process pertanyaan
    const hasilChat = await layananChat.prosesPertanyaanAi(userId, pertanyaan, idServer);

    // Log berhasil
    logger.logUserActivity(userId, 'CHAT_AI_SUCCESS', {
      idServer: idServer,
      panjangJawaban: hasilChat.jawaban.length,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        jawaban: hasilChat.jawaban,
        idServer: idServer,
        waktuResponse: hasilChat.waktuResponse,
        sumberData: hasilChat.sumberData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'CHAT_AI_FAILED', {
      error: error.message,
      pertanyaan: req.body?.pertanyaan?.substring(0, 50),
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message.includes('pertanyaan terlalu panjang')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.VALIDATION_ERROR,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (error.message.includes('Server tidak ditemukan')) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat memproses pertanyaan AI.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * DESKRIPSI: Ambil riwayat chat user dengan AI
 *
 * TUJUAN: Menampilkan percakapan sebelumnya antara user dan AI
 * untuk konteks dan referensi analisis server.
 *
 * ALUR:
 * 1. Ambil parameter pagination dari query
 * 2. Query riwayat chat berdasarkan user ID
 * 3. Format response dengan metadata pagination
 * 4. Return daftar riwayat chat
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.halaman - Halaman pagination (default: 1)
 * @param {number} req.query.limit - Jumlah item per halaman (default: 20)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan riwayat chat
 */
async function ambilRiwayatChat(req, res) {
  try {
    const userId = req.user.id;
    const { halaman = 1, limit = 20 } = req.query;

    // Log aktivitas
    logger.logUserActivity(userId, 'CHAT_HISTORY_ACCESS', {
      halaman: halaman,
      limit: limit,
      ip: req.ip
    });

    // Panggil layanan chat untuk ambil riwayat
    const hasilRiwayat = await layananChat.ambilRiwayatChat(userId, {
      halaman: parseInt(halaman),
      limit: parseInt(limit)
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: hasilRiwayat,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'CHAT_HISTORY_FAILED', {
      error: error.message,
      ip: req.ip
    });

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat mengambil riwayat chat.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * DESKRIPSI: Hapus riwayat chat tertentu
 *
 * TUJUAN: Memungkinkan user menghapus percakapan lama untuk
 * privasi atau mengurangi storage usage.
 *
 * ALUR:
 * 1. Ambil ID riwayat chat dari parameter
 * 2. Validasi ownership (hanya pemilik yang bisa hapus)
 * 3. Soft delete atau hard delete riwayat
 * 4. Return konfirmasi berhasil
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - ID riwayat chat
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi hapus
 */
async function hapusRiwayatChat(req, res) {
  try {
    const userId = req.user.id;
    const idRiwayat = req.params.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'CHAT_HISTORY_DELETE_ATTEMPT', {
      idRiwayat: idRiwayat,
      ip: req.ip
    });

    // Panggil layanan chat untuk hapus riwayat
    await layananChat.hapusRiwayatChat(userId, idRiwayat);

    // Log berhasil
    logger.logUserActivity(userId, 'CHAT_HISTORY_DELETED', {
      idRiwayat: idRiwayat,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Riwayat chat berhasil dihapus.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'CHAT_HISTORY_DELETE_FAILED', {
      error: error.message,
      idRiwayat: req.params.id,
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message === 'Riwayat chat tidak ditemukan') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (error.message === 'Akses ditolak') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODE.ACCESS_DENIED,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat menghapus riwayat chat.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export semua fungsi kontroler
module.exports = {
  chatDenganAi,
  ambilRiwayatChat,
  hapusRiwayatChat
};