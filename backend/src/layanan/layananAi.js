// Layanan AI untuk Sistem Monitoring Server
// Memberikan rekomendasi cerdas berdasarkan analisis performa server

const { logger } = require('../utilitas/logger');
const Metrik = require('../model/Metrik');
const Server = require('../model/Server');

/**
 * DESKRIPSI: Generate rekomendasi AI berdasarkan kondisi server
 *
 * TUJUAN: Menganalisis performa server dan memberikan rekomendasi actionable
 *
 * @param {Object} server - Data server
 * @param {Object} metrics - Metrics terbaru server
 * @param {Object} evaluasi - Hasil evaluasi kesehatan server
 * @returns {string} Rekomendasi AI dalam format text
 */
async function generateRekomendasi(server, metrics, evaluasi) {
  try {
    const rekomendasi = {
      deskripsi: '',
      analisis: '',
      dampak: '',
      actionItems: []
    };

    // Analisis berdasarkan masalah yang terdeteksi
    if (evaluasi.masalah.length > 0) {
      const masalahUtama = evaluasi.masalah[0]; // Fokus pada masalah terbesar

      if (masalahUtama.includes('CPU')) {
        rekomendasi.deskripsi = 'CPU server mengalami beban tinggi. Periksa proses yang menggunakan CPU berlebih.';
        rekomendasi.analisis = `CPU usage ${metrics.cpu}% menunjukkan server bekerja keras. Ini bisa disebabkan oleh aplikasi yang tidak efisien, traffic tinggi, atau proses background yang berjalan terus menerus.`;
        rekomendasi.dampak = 'Performa aplikasi bisa melambat, response time meningkat, dan berpotensi menyebabkan downtime jika tidak segera ditangani.';
        rekomendasi.actionItems = [
          {
            judul: 'Identifikasi proses dengan CPU tinggi',
            deskripsi: 'Gunakan command `top` atau `htop` untuk melihat proses yang menggunakan CPU terbanyak',
            prioritas: 'high'
          },
          {
            judul: 'Periksa aplikasi yang sedang berjalan',
            deskripsi: 'Restart aplikasi yang mengalami memory leak atau infinite loop',
            prioritas: 'high'
          },
          {
            judul: 'Optimalkan konfigurasi server',
            deskripsi: 'Pertimbangkan menambah CPU core atau menggunakan load balancer',
            prioritas: 'medium'
          }
        ];
      }

      else if (masalahUtama.includes('Memory')) {
        rekomendasi.deskripsi = 'Memory server hampir penuh. Ada kemungkinan memory leak pada aplikasi.';
        rekomendasi.analisis = `Memory usage ${metrics.memori}% menunjukkan server kehabisan RAM. Aplikasi mungkin mengalami memory leak atau ada proses yang tidak melepaskan memory dengan benar.`;
        rekomendasi.dampak = 'Aplikasi bisa crash, performa menurun drastis, dan sistem operasi akan menggunakan swap yang sangat lambat.';
        rekomendasi.actionItems = [
          {
            judul: 'Periksa memory usage per proses',
            deskripsi: 'Gunakan `ps aux --sort=-%mem` untuk melihat proses yang menggunakan memory terbanyak',
            prioritas: 'high'
          },
          {
            judul: 'Restart aplikasi yang memory leak',
            deskripsi: 'Identifikasi dan restart aplikasi yang tidak melepaskan memory',
            prioritas: 'high'
          },
          {
            judul: 'Tambah RAM atau gunakan swap file',
            deskripsi: 'Pertimbangkan upgrade hardware atau optimalkan penggunaan memory',
            prioritas: 'medium'
          }
        ];
      }

      else if (masalahUtama.includes('Disk')) {
        rekomendasi.deskripsi = 'Storage server hampir penuh. Perlu pembersihan file atau penambahan storage.';
        rekomendasi.analisis = `Disk usage ${metrics.disk}% menunjukkan storage server akan segera penuh. File log, cache, atau data aplikasi yang tidak terkelola bisa menjadi penyebabnya.`;
        rekomendasi.dampak = 'Aplikasi tidak bisa menulis file, log error meningkat, dan server bisa crash jika disk penuh 100%.';
        rekomendasi.actionItems = [
          {
            judul: 'Periksa penggunaan disk per direktori',
            deskripsi: 'Gunakan `du -h / | sort -hr | head -20` untuk melihat direktori terbesar',
            prioritas: 'high'
          },
          {
            judul: 'Bersihkan file log lama',
            deskripsi: 'Hapus atau archive file log yang sudah tidak diperlukan',
            prioritas: 'high'
          },
          {
            judul: 'Tambah storage atau gunakan cloud storage',
            deskripsi: 'Pertimbangkan menambah disk atau menggunakan external storage',
            prioritas: 'medium'
          }
        ];
      }
    }

    // Jika tidak ada masalah spesifik, berikan rekomendasi preventif
    if (rekomendasi.actionItems.length === 0) {
      // Analisis tren performa
      const tren = await analisisTrenPerforma(server._id);

      if (tren.cpuIncreasing) {
        rekomendasi.deskripsi = 'CPU usage menunjukkan tren meningkat. Persiapkan kapasitas tambahan.';
        rekomendasi.analisis = 'Berdasarkan data historis, penggunaan CPU server cenderung meningkat seiring waktu.';
        rekomendasi.dampak = 'Jika tren berlanjut, server akan mengalami overload dalam beberapa minggu ke depan.';
        rekomendasi.actionItems = [
          {
            judul: 'Monitor tren penggunaan CPU',
            deskripsi: 'Perhatikan pola penggunaan CPU dalam beberapa hari ke depan',
            prioritas: 'medium'
          },
          {
            judul: 'Optimalkan aplikasi',
            deskripsi: 'Periksa dan optimalkan kode aplikasi yang menggunakan CPU tinggi',
            prioritas: 'medium'
          }
        ];
      } else {
        rekomendasi.deskripsi = 'Server dalam kondisi baik. Pertahankan monitoring rutin.';
        rekomendasi.analisis = 'Semua metrics server dalam batas normal. Sistem berjalan dengan baik.';
        rekomendasi.dampak = 'Tidak ada risiko immediate, tapi tetap lakukan monitoring preventif.';
        rekomendasi.actionItems = [
          {
            judul: 'Lakukan maintenance rutin',
            deskripsi: 'Update sistem, bersihkan cache, dan backup data secara berkala',
            prioritas: 'low'
          }
        ];
      }
    }

    return rekomendasi;

  } catch (error) {
    logger.logError('AI_RECOMMENDATION_GENERATION_ERROR', error, {
      serverId: server._id,
      metrics,
      evaluation: evaluasi
    });

    // Return rekomendasi default jika AI gagal
    return {
      deskripsi: 'Periksa kondisi server secara manual dan lakukan troubleshooting.',
      analisis: 'Sistem AI mengalami kesulitan menganalisis data saat ini.',
      dampak: 'Perlu intervensi manual untuk memastikan server berjalan normal.',
      actionItems: [
        {
          judul: 'Periksa log sistem',
          deskripsi: 'Lihat log aplikasi dan sistem untuk mencari error atau warning',
          prioritas: 'high'
        },
        {
          judul: 'Restart layanan yang bermasalah',
          deskripsi: 'Restart aplikasi atau service yang tidak merespons',
          prioritas: 'medium'
        }
      ]
    };
  }
}

/**
 * DESKRIPSI: Analisis tren performa server dari data historis
 *
 * TUJUAN: Mendeteksi pola penggunaan yang bisa mengindikasikan masalah di masa depan
 *
 * @param {string} serverId - ID server yang akan dianalisis
 * @returns {Object} Analisis tren performa
 */
async function analisisTrenPerforma(serverId) {
  try {
    // Ambil data metrics 7 hari terakhir
    const satuMingguLalu = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const metricsHistoris = await Metrik.find({
      serverId,
      waktu: { $gte: satuMingguLalu }
    }).sort({ waktu: 1 });

    if (metricsHistoris.length < 10) {
      return { insufficientData: true };
    }

    // Analisis tren CPU
    const cpuValues = metricsHistoris.map(m => m.cpu);
    const cpuTrend = hitungTrenLinear(cpuValues);

    // Analisis tren Memory
    const memoryValues = metricsHistoris.map(m => m.memori);
    const memoryTrend = hitungTrenLinear(memoryValues);

    // Analisis tren Disk
    const diskValues = metricsHistoris.map(m => m.disk);
    const diskTrend = hitungTrenLinear(diskValues);

    return {
      cpuIncreasing: cpuTrend > 0.5, // Tren naik signifikan
      memoryIncreasing: memoryTrend > 0.5,
      diskIncreasing: diskTrend > 0.5,
      cpuTrend,
      memoryTrend,
      diskTrend,
      dataPoints: metricsHistoris.length
    };

  } catch (error) {
    logger.logError('PERFORMANCE_TREND_ANALYSIS_ERROR', error, { serverId });
    return { error: true };
  }
}

/**
 * DESKRIPSI: Hitung tren linear dari array data
 *
 * TUJUAN: Menentukan apakah data menunjukkan tren naik atau turun
 *
 * @param {Array<number>} data - Array data numerik
 * @returns {number} Slope dari tren linear (positif = naik, negatif = turun)
 */
function hitungTrenLinear(data) {
  if (data.length < 2) return 0;

  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Hitung statistik dasar
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  // Hitung slope (m) dari y = mx + b
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  return slope;
}

/**
 * DESKRIPSI: Generate rekomendasi prediktif berdasarkan pola historis
 *
 * TUJUAN: Memberikan warning dini sebelum server mengalami masalah
 *
 * @param {string} serverId - ID server
 * @returns {Object|null} Rekomendasi prediktif atau null jika tidak ada
 */
async function generateRekomendasiPrediktif(serverId) {
  try {
    const tren = await analisisTrenPerforma(serverId);

    if (tren.error || tren.insufficientData) {
      return null;
    }

    // Jika CPU trending naik signifikan
    if (tren.cpuIncreasing) {
      const server = await Server.findById(serverId);
      if (!server) return null;

      return {
        server: {
          _id: server._id,
          nama: server.nama,
          jenisServer: server.jenisServer
        },
        kategori: 'Performa',
        prioritas: 'medium',
        rekomendasi: {
          deskripsi: 'CPU usage menunjukkan tren meningkat. Siapkan kapasitas tambahan untuk mencegah overload.',
          analisis: `Berdasarkan data 7 hari terakhir, CPU usage meningkat dengan rata-rata ${tren.cpuTrend.toFixed(2)}% per hari.`,
          dampak: 'Server berisiko overload dalam 1-2 minggu jika tren berlanjut.',
          actionItems: [
            {
              judul: 'Monitor kapasitas CPU',
              deskripsi: 'Perhatikan penggunaan CPU dalam beberapa hari ke depan',
              prioritas: 'medium'
            },
            {
              judul: 'Optimalkan aplikasi',
              deskripsi: 'Periksa dan perbaiki bottleneck pada aplikasi',
              prioritas: 'medium'
            },
            {
              judul: 'Plan upgrade hardware',
              deskripsi: 'Persiapkan upgrade CPU atau penambahan server untuk load balancing',
              prioritas: 'low'
            }
          ]
        }
      };
    }

    // Jika memory trending naik signifikan
    if (tren.memoryIncreasing) {
      const server = await Server.findById(serverId);
      if (!server) return null;

      return {
        server: {
          _id: server._id,
          nama: server.nama,
          jenisServer: server.jenisServer
        },
        kategori: 'Memory',
        prioritas: 'high',
        rekomendasi: {
          deskripsi: 'Memory usage trending naik. Periksa aplikasi untuk memory leak.',
          analisis: `Memory usage meningkat ${tren.memoryTrend.toFixed(2)}% per hari. Kemungkinan ada memory leak.`,
          dampak: 'Risiko crash aplikasi atau server jika memory penuh.',
          actionItems: [
            {
              judul: 'Periksa memory leak',
              deskripsi: 'Debug aplikasi untuk menemukan proses yang tidak melepaskan memory',
              prioritas: 'high'
            },
            {
              judul: 'Implementasi memory monitoring',
              deskripsi: 'Tambahkan monitoring memory per proses',
              prioritas: 'medium'
            },
            {
              judul: 'Siapkan swap space tambahan',
              deskripsi: 'Pastikan ada cukup swap space untuk kondisi emergency',
              prioritas: 'medium'
            }
          ]
        }
      };
    }

    return null; // Tidak ada rekomendasi prediktif

  } catch (error) {
    logger.logError('PREDICTIVE_RECOMMENDATION_GENERATION_ERROR', error, { serverId });
    return null;
  }
}

/**
 * DESKRIPSI: Generate rekomendasi maintenance berdasarkan pola penggunaan
 *
 * TUJUAN: Memberikan saran maintenance preventif
 *
 * @param {string} serverId - ID server
 * @returns {Object|null} Rekomendasi maintenance atau null
 */
async function generateRekomendasiMaintenance(serverId) {
  try {
    // Ambil data server
    const server = await Server.findById(serverId);
    if (!server) return null;

    // Ambil metrics terbaru
    const metricsTerbaru = await Metrik.findOne({ serverId })
      .sort({ waktu: -1 });

    if (!metricsTerbaru) return null;

    const rekomendasi = [];

    // Rekomendasi berdasarkan waktu operasi
    const uptime = metricsTerbaru.uptime || 0;
    if (uptime > 30 * 24 * 60 * 60) { // 30 hari
      rekomendasi.push({
        kategori: 'Maintenance',
        prioritas: 'low',
        rekomendasi: {
          deskripsi: 'Server sudah berjalan lama tanpa restart. Pertimbangkan restart preventif.',
          analisis: `Server telah berjalan selama ${Math.floor(uptime / (24 * 60 * 60))} hari tanpa restart.`,
          dampak: 'Restart preventif mengurangi risiko masalah akumulatif.',
          actionItems: [
            {
              judul: 'Schedule restart server',
              deskripsi: 'Rencanakan restart server pada waktu maintenance',
              prioritas: 'low'
            }
          ]
        }
      });
    }

    // Rekomendasi berdasarkan performa disk
    if (metricsTerbaru.disk > 70) {
      rekomendasi.push({
        kategori: 'Storage',
        prioritas: 'medium',
        rekomendasi: {
          deskripsi: 'Disk usage cukup tinggi. Lakukan pembersihan rutin.',
          analisis: `Disk usage ${metricsTerbaru.disk}%. Perlu monitoring dan pembersihan berkala.`,
          dampak: 'Mencegah disk penuh yang bisa menyebabkan downtime.',
          actionItems: [
            {
              judul: 'Bersihkan file temporary',
              deskripsi: 'Hapus file cache, log lama, dan temporary files',
              prioritas: 'medium'
            },
            {
              judul: 'Archive data lama',
              deskripsi: 'Pindahkan data yang tidak aktif ke storage archive',
              prioritas: 'low'
            }
          ]
        }
      });
    }

    return rekomendasi.length > 0 ? rekomendasi[0] : null;

  } catch (error) {
    logger.logError('MAINTENANCE_RECOMMENDATION_GENERATION_ERROR', error, { serverId });
    return null;
  }
}

// Export semua fungsi
module.exports = {
  generateRekomendasi,
  analisisTrenPerforma,
  generateRekomendasiPrediktif,
  generateRekomendasiMaintenance,
  hitungTrenLinear
};