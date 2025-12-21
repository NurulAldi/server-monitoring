// Kontroler untuk mengelola operasi server
// Handle request/response untuk endpoint server monitoring

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananServer = require('../layanan/layananServer');

// Tambah server baru
async function tambahServer(req, res) {
  try {
    const userId = req.user.id;
    const dataServer = req.body;

    // Log aktivitas
    logger.logUserActivity(userId, 'SERVER_CREATE_ATTEMPT', {
      serverName: dataServer.nama,
      serverType: dataServer.jenisServer,
      ip: req.ip
    });

    // Panggil layanan server
    const server = await layananServer.tambahServer(userId, dataServer);

    // Log berhasil
    logger.logUserActivity(userId, 'SERVER_CREATED', {
      serverId: server.id,
      serverName: server.nama,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Server berhasil ditambahkan.',
      data: { server },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'SERVER_CREATE_FAILED', {
      error: error.message,
      serverName: req.body.nama,
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message.includes('sudah terdaftar')) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code: ERROR_CODE.DUPLICATE_RESOURCE,
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
        message: 'Terjadi kesalahan saat menambah server.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Ambil semua server user
async function ambilSemuaServer(req, res) {
  try {
    const userId = req.user.id;
    const { halaman = 1, limit = 10, jenisServer, status } = req.query;

    // Log aktivitas
    logger.logUserActivity(userId, 'SERVERS_LIST_ACCESS', {
      page: halaman,
      limit: limit,
      filter: { jenisServer, status },
      ip: req.ip
    });

    // Panggil layanan server
    const hasil = await layananServer.ambilSemuaServer(userId, {
      halaman: parseInt(halaman),
      limit: parseInt(limit),
      jenisServer,
      status
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: hasil,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'SERVERS_LIST_FAILED', {
      error: error.message,
      ip: req.ip
    });

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat mengambil data server.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Ambil server by ID
async function ambilServerById(req, res) {
  try {
    const userId = req.user.id;
    const serverId = req.params.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'SERVER_DETAIL_ACCESS', {
      serverId: serverId,
      ip: req.ip
    });

    // Panggil layanan server
    const server = await layananServer.ambilServerById(userId, serverId);

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { server },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'SERVER_DETAIL_FAILED', {
      error: error.message,
      serverId: req.params.id,
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message === 'Server tidak ditemukan') {
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
        message: 'Terjadi kesalahan saat mengambil detail server.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Update server
async function updateServer(req, res) {
  try {
    const userId = req.user.id;
    const serverId = req.params.id;
    const dataUpdate = req.body;

    // Log aktivitas
    logger.logUserActivity(userId, 'SERVER_UPDATE_ATTEMPT', {
      serverId: serverId,
      changes: Object.keys(dataUpdate),
      ip: req.ip
    });

    // Panggil layanan server
    const server = await layananServer.updateServer(userId, serverId, dataUpdate);

    // Log berhasil
    logger.logUserActivity(userId, 'SERVER_UPDATED', {
      serverId: serverId,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Server berhasil diperbarui.',
      data: { server },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'SERVER_UPDATE_FAILED', {
      error: error.message,
      serverId: req.params.id,
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message === 'Server tidak ditemukan') {
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
        message: 'Terjadi kesalahan saat memperbarui server.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Hapus server
async function hapusServer(req, res) {
  try {
    const userId = req.user.id;
    const serverId = req.params.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'SERVER_DELETE_ATTEMPT', {
      serverId: serverId,
      ip: req.ip
    });

    // Panggil layanan server
    await layananServer.hapusServer(userId, serverId);

    // Log berhasil
    logger.logUserActivity(userId, 'SERVER_DELETED', {
      serverId: serverId,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Server berhasil dihapus.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'SERVER_DELETE_FAILED', {
      error: error.message,
      serverId: req.params.id,
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message === 'Server tidak ditemukan') {
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
        message: 'Terjadi kesalahan saat menghapus server.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Ping server untuk cek konektivitas
async function pingServer(req, res) {
  try {
    const userId = req.user.id;
    const serverId = req.params.id;

    // Log aktivitas
    logger.logUserActivity(userId, 'SERVER_PING_ATTEMPT', {
      serverId: serverId,
      ip: req.ip
    });

    // Panggil layanan server
    const hasilPing = await layananServer.pingServer(userId, serverId);

    // Log berhasil
    logger.logUserActivity(userId, 'SERVER_PING_SUCCESS', {
      serverId: serverId,
      status: hasilPing.status,
      responseTime: hasilPing.responseTime,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: hasilPing,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logUserActivity(req.user?.id || 'anonymous', 'SERVER_PING_FAILED', {
      error: error.message,
      serverId: req.params.id,
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message === 'Server tidak ditemukan') {
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
        message: 'Terjadi kesalahan saat ping server.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export semua fungsi kontroler
module.exports = {
  tambahServer,
  ambilSemuaServer,
  ambilServerById,
  updateServer,
  hapusServer,
  pingServer
};