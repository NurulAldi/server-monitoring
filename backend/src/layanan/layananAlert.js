// Layanan Alert untuk Sistem Monitoring Server
// Mendeteksi kondisi server tidak sehat dan mengirim notifikasi

const { logger } = require('../utilitas/logger');
const layananEmail = require('./layananEmail');
const layananAi = require('./layananAi');
const Server = require('../model/Server');
const Metrik = require('../model/Metrik');
const Pengguna = require('../model/Pengguna');
const Alert = require('../model/Alert');

// Import Socket.IO untuk real-time updates
let io = null;

/**
 * Set Socket.IO instance untuk real-time alert updates
 * @param {SocketIO.Server} socketIo - Socket.IO server instance
 */
function setSocketIO(socketIo) {
  io = socketIo;
  logger.info('Socket.IO instance diset untuk layanan alert');
}

/**
 * DESKRIPSI: Buat alert baru dan emit real-time
 *
 * TUJUAN: Membuat alert dan mengirim notifikasi real-time via Socket.IO
 *
 * @param {Object} alertData - Data alert
 * @returns {Promise<Object>} Alert yang dibuat
 */
async function buatAlert(alertData) {
  try {
    const { serverId, tipe, severity, pesan, detail = {} } = alertData;

    // Get server info
    const server = await Server.findById(serverId).select('nama host pemilik');

    // Create alert record
    const alert = new Alert({
      serverId,
      userId: server?.pemilik,
      tipe,
      level: severity,
      pesan,
      data: detail,
      status: 'active'
    });

    await alert.save();

    // Prepare real-time alert data
    const realtimeAlertData = {
      alertId: alert._id.toString(),
      serverId: serverId.toString(),
      namaServer: server?.nama || 'Unknown Server',
      host: server?.host || 'Unknown Host',
      tipe,
      severity,
      pesan,
      detail,
      timestamp: alert.createdAt.toISOString(),
      status: 'active'
    };

    // Emit to Socket.IO if available
    if (io) {
      const alertNamespace = io.of('/alert');

      // Emit based on severity
      if (severity === 'critical') {
        alertNamespace.to('alerts_critical').emit('alert:baru', realtimeAlertData);
      } else if (severity === 'high') {
        alertNamespace.to('alerts_high').emit('alert:baru', realtimeAlertData);
        alertNamespace.to('alerts_critical').emit('alert:baru', realtimeAlertData);
      } else if (severity === 'medium') {
        alertNamespace.to('alerts_medium').emit('alert:baru', realtimeAlertData);
      } else {
        alertNamespace.to('alerts_low').emit('alert:baru', realtimeAlertData);
      }

      // Emit to server-specific room
      alertNamespace.to(`server_alerts_${serverId}`).emit('alert:server_baru', realtimeAlertData);

      // Emit to system namespace for general notifications
      const systemNamespace = io.of('/sistem');
      systemNamespace.to('system_general').emit('sistem:alert_baru', {
        ...realtimeAlertData,
        kategori: 'alert',
        prioritas: severity === 'critical' ? 'tinggi' : severity === 'high' ? 'sedang' : 'rendah'
      });

      logger.debug(`Alert emitted via Socket.IO: ${alert._id} (${severity})`);
    }

    // Send email notification based on user preferences and alert severity
    try {
      if (server?.pemilik) {
        const user = await Pengguna.findById(server.pemilik);
        if (user && user.pengaturanEmail) {
          const emailSettings = user.pengaturanEmail;

          // Check if user wants email for this severity level
          let shouldSendEmail = false;
          if (severity === 'critical' && emailSettings.alertKritis) {
            shouldSendEmail = true;
          } else if (severity === 'high' && emailSettings.alertTinggi) {
            shouldSendEmail = true;
          } else if (severity === 'medium' && emailSettings.alertSedang) {
            shouldSendEmail = true;
          } else if (severity === 'low' && emailSettings.alertRendah) {
            shouldSendEmail = true;
          }

          if (shouldSendEmail) {
            await kirimAlertServer(serverId, {
              ...detail,
              alertId: alert._id,
              severity,
              tipe
            });

            logger.debug(`Email alert sent untuk ${alert._id} ke user ${user._id}`);
          }
        }
      }
    } catch (emailError) {
      logger.logError('ALERT_EMAIL_FAILED', emailError, { alertId: alert._id });
    }

    logger.logSystemActivity('ALERT_CREATED', {
      alertId: alert._id,
      serverId,
      type: tipe,
      severity,
      message: pesan
    });

    return alert;

  } catch (error) {
    logger.logError('ALERT_CREATION_FAILED', error, alertData);
    throw error;
  }
}

/**
 * DESKRIPSI: Evaluasi kondisi kesehatan server
 *
 * TUJUAN: Menentukan status kesehatan server berdasarkan metrics terbaru
 *
 * @param {Object} metrics - Data metrics server
 * @returns {Object} Status kesehatan dan detail
 */
function evaluasiKesehatanServer(metrics) {
  const threshold = {
    cpu: { warning: 80, critical: 90 },
    memori: { warning: 85, critical: 95 },
    disk: { warning: 85, critical: 95 }
  };

  let status = 'OK';
  let level = 'NORMAL';
  let pesan = 'Server dalam kondisi baik';
  const masalah = [];

  // Evaluasi CPU
  if (metrics.cpu >= threshold.cpu.critical) {
    status = 'CRITICAL';
    level = 'CRITICAL';
    masalah.push(`CPU usage ${metrics.cpu}% (Critical > ${threshold.cpu.critical}%)`);
  } else if (metrics.cpu >= threshold.cpu.warning) {
    if (status !== 'CRITICAL') status = 'WARNING';
    if (level !== 'CRITICAL') level = 'WARNING';
    masalah.push(`CPU usage ${metrics.cpu}% (Warning > ${threshold.cpu.warning}%)`);
  }

  // Evaluasi Memory
  if (metrics.memori >= threshold.memori.critical) {
    status = 'CRITICAL';
    level = 'CRITICAL';
    masalah.push(`Memory usage ${metrics.memori}% (Critical > ${threshold.memori.critical}%)`);
  } else if (metrics.memori >= threshold.memori.warning) {
    if (status !== 'CRITICAL') status = 'WARNING';
    if (level !== 'CRITICAL') level = 'WARNING';
    masalah.push(`Memory usage ${metrics.memori}% (Warning > ${threshold.memori.warning}%)`);
  }

  // Evaluasi Disk
  if (metrics.disk >= threshold.disk.critical) {
    status = 'CRITICAL';
    level = 'CRITICAL';
    masalah.push(`Disk usage ${metrics.disk}% (Critical > ${threshold.disk.critical}%)`);
  } else if (metrics.disk >= threshold.disk.warning) {
    if (status !== 'CRITICAL') status = 'WARNING';
    if (level !== 'CRITICAL') level = 'WARNING';
    masalah.push(`Disk usage ${metrics.disk}% (Warning > ${threshold.disk.warning}%)`);
  }

  // Jika ada masalah, update pesan
  if (masalah.length > 0) {
    pesan = `Server mengalami masalah: ${masalah.join(', ')}`;
  }

  return {
    status,
    level,
    pesan,
    masalah,
    threshold
  };
}

/**
 * DESKRIPSI: Cek apakah alert sudah dikirim sebelumnya
 *
 * TUJUAN: Mencegah spam alert yang berulang untuk kondisi yang sama
 *
 * @param {string} serverId - ID server
 * @param {string} alertType - Tipe alert
 * @param {number} cooldownMinutes - Cooldown dalam menit (default 30)
 * @returns {boolean} True jika boleh kirim alert
 */
async function bolehKirimAlert(serverId, alertType, cooldownMinutes = 30) {
  try {
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const recentAlert = await Alert.findOne({
      serverId,
      tipe: alertType,
      dibuatPada: { $gte: cooldownTime }
    }).sort({ dibuatPada: -1 });

    return !recentAlert; // Boleh kirim jika tidak ada alert recent

  } catch (error) {
    logger.logError('ALERT_COOLDOWN_CHECK_FAILED', error, { serverId, alertType });
    return true; // Jika error, izinkan kirim alert
  }
}

/**
 * DESKRIPSI: Simpan alert ke database
 *
 * TUJUAN: Tracking semua alert yang dikirim
 *
 * @param {Object} dataAlert - Data alert
 * @returns {Object} Alert yang disimpan
 */
async function simpanAlert(dataAlert) {
  try {
    const alert = new Alert({
      serverId: dataAlert.serverId,
      userId: dataAlert.userId,
      tipe: dataAlert.tipe,
      level: dataAlert.level,
      pesan: dataAlert.pesan,
      data: dataAlert.data,
      status: 'sent'
    });

    await alert.save();
    return alert;

  } catch (error) {
    logger.logError('ALERT_SAVE_FAILED', error, dataAlert);
    throw error;
  }
}

/**
 * DESKRIPSI: Kirim alert untuk kondisi server tidak sehat
 *
 * TUJUAN: Mendeteksi dan mengirim notifikasi ketika server bermasalah
 *
 * @param {string} serverId - ID server yang bermasalah
 * @param {Object} metrics - Data metrics terbaru
 * @returns {Promise<Object>} Hasil pengiriman alert
 */
async function kirimAlertServer(serverId, metrics) {
  try {
    // Ambil data server
    const server = await Server.findById(serverId);
    if (!server) {
      throw new Error(`Server dengan ID ${serverId} tidak ditemukan`);
    }

    // Evaluasi kesehatan server
    const evaluasi = evaluasiKesehatanServer(metrics);

    // Jika server sehat, skip
    if (evaluasi.status === 'OK') {
      return { success: true, message: 'Server dalam kondisi baik' };
    }

    // Cek cooldown alert
    const alertType = `server_${evaluasi.status.toLowerCase()}`;
    const bolehKirim = await bolehKirimAlert(serverId, alertType);

    if (!bolehKirim) {
      return { success: true, message: 'Alert cooldown aktif, skip pengiriman' };
    }

    // Ambil data user
    const user = await Pengguna.findById(server.pemilik);
    if (!user) {
      throw new Error(`User pemilik server tidak ditemukan`);
    }

    // Cek pengaturan email user
    if (!user.pengaturanEmail) {
      return { success: true, message: 'User tidak mengaktifkan notifikasi email' };
    }

    const emailSettings = user.pengaturanEmail;
    const shouldSendAlert = (evaluasi.level === 'CRITICAL' && emailSettings.alertKritis) ||
                           (evaluasi.level === 'WARNING' && emailSettings.alertPeringatan);

    if (!shouldSendAlert) {
      return { success: true, message: 'User tidak subscribe alert level ini' };
    }

    // Generate rekomendasi AI
    let rekomendasiAi = null;
    try {
      if (emailSettings.rekomendasiAi) {
        rekomendasiAi = await layananAi.generateRekomendasi(server, metrics, evaluasi);
      }
    } catch (aiError) {
      logger.logError('AI_RECOMMENDATION_GENERATION_FAILED', aiError, {
        serverId,
        metrics,
        evaluation: evaluasi
      });
    }

    // Data alert untuk email
    const dataAlert = {
      server: {
        _id: server._id,
        nama: server.nama,
        jenisServer: server.jenisServer
      },
      metrics,
      level: evaluasi.level,
      pesan: evaluasi.pesan,
      rekomendasiAi,
      waktuAlert: new Date()
    };

    // Kirim email alert
    const hasilEmail = await layananEmail.kirimEmailAlertServer(user.email, dataAlert);

    // Simpan alert ke database
    await simpanAlert({
      serverId,
      userId: user._id,
      tipe: alertType,
      level: evaluasi.level,
      pesan: evaluasi.pesan,
      data: {
        metrics,
        rekomendasiAi,
        emailSent: true,
        emailMessageId: hasilEmail.messageId
      }
    });

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log alert berhasil
    logger.logAlert('SERVER_ALERT_SENT', {
      serverId,
      serverName: server.nama,
      userId: user._id,
      userEmail: user.email,
      alertLevel: evaluasi.level,
      alertMessage: evaluasi.pesan,
      emailMessageId: hasilEmail.messageId,
      aiRecommendation: !!rekomendasiAi
    });

    return {
      success: true,
      alertLevel: evaluasi.level,
      emailSent: true,
      messageId: hasilEmail.messageId,
      aiRecommendation: !!rekomendasiAi
    };

  } catch (error) {
    // Log error
    logger.logError('SERVER_ALERT_SEND_FAILED', error, {
      serverId,
      metrics
    });

    // Simpan alert gagal ke database
    try {
      await simpanAlert({
        serverId,
        userId: null, // User tidak diketahui jika error di awal
        tipe: 'server_error',
        level: 'ERROR',
        pesan: `Gagal kirim alert: ${error.message}`,
        data: { metrics, error: error.message },
        status: 'failed'
      });
    } catch (saveError) {
      logger.logError('ALERT_SAVE_FAILED', saveError, { serverId });
    }

    throw new Error(`Gagal kirim alert server: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim alert recovery ketika server kembali normal
 *
 * TUJUAN: Memberitahu user bahwa server sudah kembali ke kondisi normal
 *
 * @param {string} serverId - ID server yang recovery
 * @param {Object} metrics - Metrics terbaru setelah recovery
 * @returns {Promise<Object>} Hasil pengiriman alert recovery
 */
async function kirimAlertRecovery(serverId, metrics) {
  try {
    // Ambil data server
    const server = await Server.findById(serverId);
    if (!server) {
      throw new Error(`Server dengan ID ${serverId} tidak ditemukan`);
    }

    // Ambil data user
    const user = await Pengguna.findById(server.pemilik);
    if (!user || !user.pengaturanEmail?.alertRecovery) {
      return { success: true, message: 'User tidak subscribe alert recovery' };
    }

    // Cari alert terakhir untuk server ini
    const lastAlert = await Alert.findOne({
      serverId,
      tipe: { $in: ['server_critical', 'server_warning'] }
    }).sort({ dibuatPada: -1 });

    if (!lastAlert) {
      return { success: true, message: 'Tidak ada alert sebelumnya untuk server ini' };
    }

    // Hitung durasi downtime
    const downtimeDuration = new Date() - lastAlert.dibuatPada;
    const durasiDown = formatDurasi(downtimeDuration);

    // Data recovery
    const dataRecovery = {
      server: {
        _id: server._id,
        nama: server.nama,
        jenisServer: server.jenisServer
      },
      waktuRecovery: new Date(),
      durasiDown,
      metricsTerakhir: metrics
    };

    // Kirim email recovery
    const hasilEmail = await layananEmail.kirimEmailRecoveryServer(
      user.email,
      user.namaPengguna,
      dataRecovery
    );

    // Simpan alert recovery ke database
    await simpanAlert({
      serverId,
      userId: user._id,
      tipe: 'server_recovery',
      level: 'INFO',
      pesan: `Server ${server.nama} kembali normal setelah ${durasiDown} downtime`,
      data: {
        recoveryData: dataRecovery,
        previousAlertId: lastAlert._id,
        emailSent: true,
        emailMessageId: hasilEmail.messageId
      }
    });

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log recovery berhasil
    logger.logAlert('SERVER_RECOVERY_ALERT_SENT', {
      serverId,
      serverName: server.nama,
      userId: user._id,
      userEmail: user.email,
      downtime: durasiDown,
      emailMessageId: hasilEmail.messageId
    });

    return {
      success: true,
      emailSent: true,
      messageId: hasilEmail.messageId,
      downtime: durasiDown
    };

  } catch (error) {
    logger.logError('SERVER_RECOVERY_ALERT_SEND_FAILED', error, { serverId });
    throw new Error(`Gagal kirim alert recovery: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim ringkasan harian kesehatan server
 *
 * TUJUAN: Memberikan laporan periodik kondisi semua server user
 *
 * @param {string} userId - ID user penerima ringkasan
 * @returns {Promise<Object>} Hasil pengiriman ringkasan
 */
async function kirimRingkasanHarian(userId) {
  try {
    // Ambil data user
    const user = await Pengguna.findById(userId);
    if (!user || !user.pengaturanEmail?.ringkasanHarian) {
      return { success: true, message: 'User tidak subscribe ringkasan harian' };
    }

    // Ambil semua server user
    const servers = await Server.find({ pemilik: userId });

    if (servers.length === 0) {
      return { success: true, message: 'User tidak memiliki server' };
    }

    // Ambil metrics terbaru untuk setiap server
    const dataServer = await Promise.all(
      servers.map(async (server) => {
        const metricsTerbaru = await Metrik.findOne({ serverId: server._id })
          .sort({ waktu: -1 });

        const evaluasi = metricsTerbaru ?
          evaluasiKesehatanServer(metricsTerbaru) :
          { status: 'UNKNOWN', level: 'UNKNOWN' };

        return {
          _id: server._id,
          nama: server.nama,
          jenisServer: server.jenisServer,
          status: evaluasi.status,
          metrics: metricsTerbaru || null,
          lastUpdate: metricsTerbaru?.waktu || null
        };
      })
    );

    // Kirim email ringkasan
    const hasilEmail = await layananEmail.kirimEmailRingkasanHarian(
      user.email,
      user.namaPengguna,
      dataServer
    );

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log ringkasan berhasil
    logger.logAlert('DAILY_SUMMARY_SENT', {
      userId,
      userEmail: user.email,
      serverCount: servers.length,
      emailMessageId: hasilEmail.messageId
    });

    return {
      success: true,
      emailSent: true,
      messageId: hasilEmail.messageId,
      serverCount: servers.length
    };

  } catch (error) {
    logger.logError('DAILY_SUMMARY_SEND_FAILED', error, { userId });
    throw new Error(`Gagal kirim ringkasan harian: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim rekomendasi AI ke user
 *
 * TUJUAN: Memberikan rekomendasi cerdas berdasarkan analisis performa
 *
 * @param {string} userId - ID user penerima rekomendasi
 * @param {Object} dataRekomendasi - Data rekomendasi dari AI
 * @returns {Promise<Object>} Hasil pengiriman rekomendasi
 */
async function kirimRekomendasiAI(userId, dataRekomendasi) {
  try {
    // Ambil data user
    const user = await Pengguna.findById(userId);
    if (!user || !user.pengaturanEmail?.rekomendasiAi) {
      return { success: true, message: 'User tidak subscribe rekomendasi AI' };
    }

    // Kirim email rekomendasi
    const hasilEmail = await layananEmail.kirimEmailRekomendasiAI(
      user.email,
      user.namaPengguna,
      dataRekomendasi
    );

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log rekomendasi berhasil
    logger.logAlert('AI_RECOMMENDATION_SENT', {
      userId,
      userEmail: user.email,
      serverId: dataRekomendasi.server._id,
      recommendationCategory: dataRekomendasi.kategori,
      emailMessageId: hasilEmail.messageId
    });

    return {
      success: true,
      emailSent: true,
      messageId: hasilEmail.messageId
    };

  } catch (error) {
    logger.logError('AI_RECOMMENDATION_SEND_FAILED', error, {
      userId,
      recommendationData: dataRekomendasi
    });
    throw new Error(`Gagal kirim rekomendasi AI: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Format durasi dalam format yang mudah dibaca
 *
 * @param {number} milliseconds - Durasi dalam milliseconds
 * @returns {string} Durasi yang diformat
 */
function formatDurasi(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} hari ${hours % 24} jam ${minutes % 60} menit`;
  } else if (hours > 0) {
    return `${hours} jam ${minutes % 60} menit`;
  } else if (minutes > 0) {
    return `${minutes} menit ${seconds % 60} detik`;
  } else {
    return `${seconds} detik`;
  }
}

// Export semua fungsi
module.exports = {
  evaluasiKesehatanServer,
  kirimAlertServer,
  kirimAlertRecovery,
  kirimRingkasanHarian,
  kirimRekomendasiAI,
  bolehKirimAlert,
  simpanAlert,
  buatAlert,
  setSocketIO
};