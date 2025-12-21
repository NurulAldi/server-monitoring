// Layanan untuk mengelola operasi server monitoring
// Business logic untuk CRUD server dan monitoring

const Server = require('../model/Server');
const { logger } = require('../utilitas/logger');
const { ERROR_CODE } = require('../utilitas/konstanta');

// Tambah server baru
async function tambahServer(userId, dataServer) {
  try {
    const {
      nama,
      deskripsi,
      jenisServer,
      alamatIp,
      sistemOperasi,
      spesifikasi
    } = dataServer;

    // Cek apakah IP sudah terdaftar untuk user ini
    const serverAda = await Server.findOne({
      alamatIp: alamatIp,
      pemilik: userId
    });

    if (serverAda) {
      throw new Error('Server dengan IP ini sudah terdaftar');
    }

    // Buat server baru
    const serverBaru = new Server({
      nama: nama.trim(),
      deskripsi: deskripsi?.trim(),
      jenisServer,
      alamatIp,
      sistemOperasi,
      spesifikasi,
      pemilik: userId,
      status: 'offline', // Default status
      terakhirOnline: null
    });

    // Simpan ke database
    const serverTersimpan = await serverBaru.save();

    // Populate pemilik untuk response
    await serverTersimpan.populate('pemilik', 'nama email');

    return {
      id: serverTersimpan._id,
      nama: serverTersimpan.nama,
      deskripsi: serverTersimpan.deskripsi,
      jenisServer: serverTersimpan.jenisServer,
      alamatIp: serverTersimpan.alamatIp,
      sistemOperasi: serverTersimpan.sistemOperasi,
      spesifikasi: serverTersimpan.spesifikasi,
      status: serverTersimpan.status,
      pemilik: {
        id: serverTersimpan.pemilik._id,
        nama: serverTersimpan.pemilik.nama,
        email: serverTersimpan.pemilik.email
      },
      dibuatPada: serverTersimpan.dibuatPada,
      diperbaruiPada: serverTersimpan.diperbaruiPada
    };

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_CREATE_ERROR', error, {
      userId: userId,
      serverData: dataServer
    });
    throw error;
  }
}

// Ambil semua server user dengan pagination dan filter
async function ambilSemuaServer(userId, options = {}) {
  try {
    const {
      halaman = 1,
      limit = 10,
      jenisServer,
      status
    } = options;

    // Build filter query
    const filter = { pemilik: userId };

    if (jenisServer) {
      filter.jenisServer = jenisServer;
    }

    if (status) {
      filter.status = status;
    }

    // Hitung total untuk pagination
    const total = await Server.countDocuments(filter);

    // Ambil data dengan pagination
    const servers = await Server.find(filter)
      .populate('pemilik', 'nama email')
      .sort({ diperbaruiPada: -1 }) // Urutkan berdasarkan update terbaru
      .skip((halaman - 1) * limit)
      .limit(limit)
      .lean();

    // Format response
    const dataServers = servers.map(server => ({
      id: server._id,
      nama: server.nama,
      deskripsi: server.deskripsi,
      jenisServer: server.jenisServer,
      alamatIp: server.alamatIp,
      sistemOperasi: server.sistemOperasi,
      spesifikasi: server.spesifikasi,
      status: server.status,
      terakhirOnline: server.terakhirOnline,
      pemilik: {
        id: server.pemilik._id,
        nama: server.pemilik.nama,
        email: server.pemilik.email
      },
      dibuatPada: server.dibuatPada,
      diperbaruiPada: server.diperbaruiPada
    }));

    return {
      servers: dataServers,
      pagination: {
        halaman: halaman,
        limit: limit,
        total: total,
        totalHalaman: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_LIST_ERROR', error, {
      userId: userId,
      options: options
    });
    throw error;
  }
}

// Ambil server by ID dengan validasi ownership
async function ambilServerById(userId, serverId) {
  try {
    const server = await Server.findOne({
      _id: serverId,
      pemilik: userId
    }).populate('pemilik', 'nama email');

    if (!server) {
      throw new Error('Server tidak ditemukan');
    }

    return {
      id: server._id,
      nama: server.nama,
      deskripsi: server.deskripsi,
      jenisServer: server.jenisServer,
      alamatIp: server.alamatIp,
      sistemOperasi: server.sistemOperasi,
      spesifikasi: server.spesifikasi,
      status: server.status,
      terakhirOnline: server.terakhirOnline,
      metrikTerbaru: server.metrikTerbaru,
      alertAktif: server.alertAktif,
      pemilik: {
        id: server.pemilik._id,
        nama: server.pemilik.nama,
        email: server.pemilik.email
      },
      dibuatPada: server.dibuatPada,
      diperbaruiPada: server.diperbaruiPada
    };

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_GET_BY_ID_ERROR', error, {
      userId: userId,
      serverId: serverId
    });
    throw error;
  }
}

// Update server
async function updateServer(userId, serverId, dataUpdate) {
  try {
    // Cek kepemilikan server
    const server = await Server.findOne({
      _id: serverId,
      pemilik: userId
    });

    if (!server) {
      throw new Error('Server tidak ditemukan');
    }

    // Jika IP diupdate, cek apakah sudah digunakan server lain
    if (dataUpdate.alamatIp && dataUpdate.alamatIp !== server.alamatIp) {
      const serverAda = await Server.findOne({
        alamatIp: dataUpdate.alamatIp,
        pemilik: userId,
        _id: { $ne: serverId }
      });

      if (serverAda) {
        throw new Error('Server dengan IP ini sudah terdaftar');
      }
    }

    // Update data
    Object.keys(dataUpdate).forEach(key => {
      if (dataUpdate[key] !== undefined) {
        server[key] = dataUpdate[key];
      }
    });

    server.diperbaruiPada = new Date();

    // Simpan perubahan
    const serverTersimpan = await server.save();
    await serverTersimpan.populate('pemilik', 'nama email');

    return {
      id: serverTersimpan._id,
      nama: serverTersimpan.nama,
      deskripsi: serverTersimpan.deskripsi,
      jenisServer: serverTersimpan.jenisServer,
      alamatIp: serverTersimpan.alamatIp,
      sistemOperasi: serverTersimpan.sistemOperasi,
      spesifikasi: serverTersimpan.spesifikasi,
      status: serverTersimpan.status,
      diperbaruiPada: serverTersimpan.diperbaruiPada
    };

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_UPDATE_ERROR', error, {
      userId: userId,
      serverId: serverId,
      updateData: dataUpdate
    });
    throw error;
  }
}

// Hapus server
async function hapusServer(userId, serverId) {
  try {
    // Cek kepemilikan server
    const server = await Server.findOne({
      _id: serverId,
      pemilik: userId
    });

    if (!server) {
      throw new Error('Server tidak ditemukan');
    }

    // Hapus server (soft delete dengan menandai sebagai deleted)
    // Atau hard delete jika tidak ada data terkait
    await Server.findByIdAndDelete(serverId);

    return { success: true };

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_DELETE_ERROR', error, {
      userId: userId,
      serverId: serverId
    });
    throw error;
  }
}

// Ping server untuk cek konektivitas
async function pingServer(userId, serverId) {
  try {
    // Cek kepemilikan server
    const server = await Server.findOne({
      _id: serverId,
      pemilik: userId
    });

    if (!server) {
      throw new Error('Server tidak ditemukan');
    }

    // Implementasi ping sederhana (dalam implementasi nyata bisa menggunakan library ping)
    // Untuk demo, kita simulasi ping dengan delay random
    const startTime = Date.now();

    // Simulasi network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    const responseTime = Date.now() - startTime;
    const isOnline = responseTime < 1000; // Anggap online jika < 1 detik

    // Update status server
    server.status = isOnline ? 'online' : 'offline';
    if (isOnline) {
      server.terakhirOnline = new Date();
    }
    await server.save();

    return {
      serverId: server._id,
      alamatIp: server.alamatIp,
      status: server.status,
      responseTime: responseTime,
      terakhirOnline: server.terakhirOnline,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_PING_ERROR', error, {
      userId: userId,
      serverId: serverId
    });
    throw error;
  }
}

// Update status server (dipanggil oleh monitoring service)
async function updateStatusServer(serverId, status, metrikTerbaru = null) {
  try {
    const updateData = {
      status: status,
      diperbaruiPada: new Date()
    };

    if (status === 'online') {
      updateData.terakhirOnline = new Date();
    }

    if (metrikTerbaru) {
      updateData.metrikTerbaru = metrikTerbaru;
    }

    const server = await Server.findByIdAndUpdate(serverId, updateData, { new: true });

    if (!server) {
      throw new Error('Server tidak ditemukan');
    }

    return server;

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_UPDATE_STATUS_ERROR', error, {
      serverId: serverId,
      status: status
    });
    throw error;
  }
}

// Ambil servers yang perlu dipantau (untuk scheduler)
async function ambilServersUntukMonitoring(limit = 50) {
  try {
    // Ambil servers yang aktif dan belum lama diupdate
    const servers = await Server.find({
      status: { $in: ['online', 'offline'] }
    })
    .select('_id alamatIp nama pemilik')
    .limit(limit)
    .lean();

    return servers;

  } catch (error) {
    logger.logSystemError('SERVER_SERVICE_GET_FOR_MONITORING_ERROR', error, {});
    throw error;
  }
}

// Export semua fungsi layanan
module.exports = {
  tambahServer,
  ambilSemuaServer,
  ambilServerById,
  updateServer,
  hapusServer,
  pingServer,
  updateStatusServer,
  ambilServersUntukMonitoring
};