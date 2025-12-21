// Penjadwal untuk Sistem Monitoring Server
// Mengelola tugas-tugas terjadwal seperti monitoring, alert, dan laporan

const cron = require('node-cron');
const { logger } = require('../utilitas/logger');
const layananAlert = require('../layanan/layananAlert');
const layananAi = require('../layanan/layananAi');
const Server = require('../model/Server');
const Pengguna = require('../model/Pengguna');
const Metrik = require('../model/Metrik');

/**
 * DESKRIPSI: Kirim ringkasan harian ke semua user yang subscribe
 *
 * TUJUAN: Memberikan laporan periodik kondisi server setiap hari
 *
 * Dijalankan setiap hari pukul 08:00 WIB
 */
async function kirimRingkasanHarian() {
  try {
    logger.logSystem('DAILY_SUMMARY_JOB_STARTED', 'Memulai pengiriman ringkasan harian');

    // Cari semua user yang subscribe ringkasan harian
    const users = await Pengguna.find({
      'pengaturanEmail.ringkasanHarian': true,
      statusAktif: true,
      emailTerverifikasi: true
    });

    logger.logSystem('DAILY_SUMMARY_USERS_FOUND', `Ditemukan ${users.length} user yang subscribe ringkasan harian`);

    let successCount = 0;
    let errorCount = 0;

    // Kirim ringkasan ke setiap user
    for (const user of users) {
      try {
        const result = await layananAlert.kirimRingkasanHarian(user._id);

        if (result.success) {
          successCount++;
          logger.logSystem('DAILY_SUMMARY_SENT', {
            userId: user._id,
            userEmail: user.email,
            serverCount: result.serverCount,
            messageId: result.messageId
          });
        } else {
          errorCount++;
          logger.logSystem('DAILY_SUMMARY_SKIPPED', {
            userId: user._id,
            userEmail: user.email,
            reason: result.message
          });
        }

        // Delay 1 detik antar email untuk menghindari rate limit
        await delay(1000);

      } catch (error) {
        errorCount++;
        logger.logError('DAILY_SUMMARY_SEND_ERROR', error, {
          userId: user._id,
          userEmail: user.email
        });
      }
    }

    logger.logSystem('DAILY_SUMMARY_JOB_COMPLETED', {
      totalUsers: users.length,
      successCount,
      errorCount
    });

  } catch (error) {
    logger.logError('DAILY_SUMMARY_JOB_FAILED', error);
  }
}

/**
 * DESKRIPSI: Kirim rekomendasi AI ke user yang subscribe
 *
 * TUJUAN: Memberikan rekomendasi cerdas berdasarkan analisis performa
 *
 * Dijalankan setiap minggu pada hari Senin pukul 09:00 WIB
 */
async function kirimRekomendasiAI() {
  try {
    logger.logSystem('AI_RECOMMENDATION_JOB_STARTED', 'Memulai pengiriman rekomendasi AI');

    // Cari semua user yang subscribe rekomendasi AI
    const users = await Pengguna.find({
      'pengaturanEmail.rekomendasiAi': true,
      statusAktif: true,
      emailTerverifikasi: true
    });

    logger.logSystem('AI_RECOMMENDATION_USERS_FOUND', `Ditemukan ${users.length} user yang subscribe rekomendasi AI`);

    let totalRecommendations = 0;
    let sentCount = 0;

    // Untuk setiap user, analisis server-server mereka
    for (const user of users) {
      try {
        // Ambil semua server user
        const servers = await Server.find({ pemilik: user._id });

        for (const server of servers) {
          try {
            // Coba generate rekomendasi prediktif
            const rekomendasiPrediktif = await layananAi.generateRekomendasiPrediktif(server._id);

            if (rekomendasiPrediktif) {
              totalRecommendations++;

              // Kirim rekomendasi ke user
              const result = await layananAlert.kirimRekomendasiAI(user._id, rekomendasiPrediktif);

              if (result.success) {
                sentCount++;
                logger.logSystem('AI_RECOMMENDATION_SENT', {
                  userId: user._id,
                  serverId: server._id,
                  serverName: server.nama,
                  category: rekomendasiPrediktif.kategori,
                  messageId: result.messageId
                });
              }

              // Delay antar email
              await delay(2000);
            }

            // Coba generate rekomendasi maintenance
            const rekomendasiMaintenance = await layananAi.generateRekomendasiMaintenance(server._id);

            if (rekomendasiMaintenance) {
              totalRecommendations++;

              const result = await layananAlert.kirimRekomendasiAI(user._id, rekomendasiMaintenance);

              if (result.success) {
                sentCount++;
                logger.logSystem('MAINTENANCE_RECOMMENDATION_SENT', {
                  userId: user._id,
                  serverId: server._id,
                  serverName: server.nama,
                  category: rekomendasiMaintenance.kategori,
                  messageId: result.messageId
                });
              }

              // Delay antar email
              await delay(2000);
            }

          } catch (serverError) {
            logger.logError('SERVER_AI_ANALYSIS_ERROR', serverError, {
              userId: user._id,
              serverId: server._id,
              serverName: server.nama
            });
          }
        }

      } catch (userError) {
        logger.logError('USER_AI_RECOMMENDATION_ERROR', userError, {
          userId: user._id,
          userEmail: user.email
        });
      }
    }

    logger.logSystem('AI_RECOMMENDATION_JOB_COMPLETED', {
      totalUsers: users.length,
      totalRecommendations,
      sentCount
    });

  } catch (error) {
    logger.logError('AI_RECOMMENDATION_JOB_FAILED', error);
  }
}

/**
 * DESKRIPSI: Cleanup data metrics lama
 *
 * TUJUAN: Menjaga database tetap optimal dengan menghapus data lama
 *
 * Dijalankan setiap hari pukul 02:00 WIB
 */
async function cleanupDataLama() {
  try {
    logger.logSystem('DATA_CLEANUP_JOB_STARTED', 'Memulai cleanup data lama');

    // Hapus metrics yang lebih dari 90 hari
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await Metrik.deleteMany({
      waktu: { $lt: ninetyDaysAgo }
    });

    logger.logSystem('DATA_CLEANUP_COMPLETED', {
      deletedCount: result.deletedCount,
      cutoffDate: ninetyDaysAgo
    });

  } catch (error) {
    logger.logError('DATA_CLEANUP_JOB_FAILED', error);
  }
}

/**
 * DESKRIPSI: Health check sistem monitoring
 *
 * TUJUAN: Memastikan sistem monitoring berjalan dengan baik
 *
 * Dijalankan setiap 10 menit
 */
async function healthCheckSistem() {
  try {
    // Cek koneksi database
    const serverCount = await Server.countDocuments();
    const userCount = await Pengguna.countDocuments();
    const metricsCount = await Metrik.countDocuments();

    // Log status sistem
    logger.logSystem('SYSTEM_HEALTH_CHECK', {
      serverCount,
      userCount,
      metricsCount,
      timestamp: new Date(),
      status: 'HEALTHY'
    });

  } catch (error) {
    logger.logError('SYSTEM_HEALTH_CHECK_FAILED', error);
  }
}

/**
 * DESKRIPSI: Inisialisasi semua penjadwal
 *
 * TUJUAN: Menjalankan semua tugas terjadwal saat aplikasi startup
 */
function inisialisasiPenjadwal() {
  try {
    logger.logSystem('SCHEDULER_INITIALIZATION_STARTED', 'Memulai inisialisasi penjadwal');

    // Health check setiap 10 menit
    cron.schedule('*/10 * * * *', () => {
      healthCheckSistem();
    }, {
      timezone: 'Asia/Jakarta'
    });

    // Ringkasan harian setiap hari pukul 08:00 WIB
    cron.schedule('0 8 * * *', () => {
      kirimRingkasanHarian();
    }, {
      timezone: 'Asia/Jakarta'
    });

    // Rekomendasi AI setiap Senin pukul 09:00 WIB
    cron.schedule('0 9 * * 1', () => {
      kirimRekomendasiAI();
    }, {
      timezone: 'Asia/Jakarta'
    });

    // Cleanup data setiap hari pukul 02:00 WIB
    cron.schedule('0 2 * * *', () => {
      cleanupDataLama();
    }, {
      timezone: 'Asia/Jakarta'
    });

    logger.logSystem('SCHEDULER_INITIALIZATION_COMPLETED', 'Semua penjadwal berhasil diinisialisasi');

    // Log jadwal yang aktif
    logger.logSystem('ACTIVE_SCHEDULES', {
      healthCheck: 'Setiap 10 menit',
      dailySummary: 'Setiap hari pukul 08:00 WIB',
      aiRecommendations: 'Setiap Senin pukul 09:00 WIB',
      dataCleanup: 'Setiap hari pukul 02:00 WIB'
    });

  } catch (error) {
    logger.logError('SCHEDULER_INITIALIZATION_FAILED', error);
    throw error;
  }
}

/**
 * DESKRIPSI: Utility function untuk delay
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * DESKRIPSI: Stop semua penjadwal (untuk testing atau shutdown)
 */
function stopPenjadwal() {
  try {
    cron.getTasks().forEach(task => task.destroy());
    logger.logSystem('SCHEDULER_STOPPED', 'Semua penjadwal berhasil dihentikan');
  } catch (error) {
    logger.logError('SCHEDULER_STOP_FAILED', error);
  }
}

// Export semua fungsi
module.exports = {
  inisialisasiPenjadwal,
  stopPenjadwal,
  kirimRingkasanHarian,
  kirimRekomendasiAI,
  cleanupDataLama,
  healthCheckSistem
};