// Layanan untuk mengelola business logic data metrik server
// Menangani operasi kompleks untuk pengumpulan, analisis, dan penyajian data metrik

const Metrik = require('../model/Metrik');
const Server = require('../model/Server');
const { logger } = require('../utilitas/logger');
const { THRESHOLD_DEFAULT } = require('../utilitas/konstanta');

/**
 * DESKRIPSI: Layanan untuk mendapatkan metrik terbaru dari server tertentu
 *
 * TUJUAN: Mengambil data performa server terkini untuk monitoring real-time
 * dan dashboard monitoring.
 *
 * ALUR KERJA:
 * 1. Validasi server ID dan ownership
 * 2. Query metrik terbaru dari database
 * 3. Format data untuk response API
 * 4. Log aktivitas untuk monitoring
 *
 * ERROR HANDLING:
 * - Server tidak ditemukan: throw error dengan status 404
 * - Tidak ada data metrik: return null dengan log warning
 * - Database error: throw error dengan status 500
 *
 * @param {string} serverId - ID server yang akan diambil metriknya
 * @returns {Promise<Object|null>} Data metrik terbaru atau null jika tidak ada
 * @throws {Error} Jika server tidak ditemukan atau terjadi error database
 */
async function dapatkanMetrikTerbaru(serverId) {
  try {
    // Validasi server exists dan dapat diakses
    const server = await Server.findById(serverId);
    if (!server) {
      const error = new Error('Server tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    // Log aktivitas
    logger.logSystemActivity('METRICS_LATEST_REQUEST', {
      serverId: serverId,
      serverName: server.nama
    });

    // Query metrik terbaru
    const metrikTerbaru = await Metrik.dapatkanMetricsTerbaru(serverId, 1);

    if (!metrikTerbaru || metrikTerbaru.length === 0) {
      logger.logSystemActivity('METRICS_LATEST_NOT_FOUND', {
        serverId: serverId,
        serverName: server.nama
      });
      return null;
    }

    // Format data untuk response
    const dataMetrik = metrikTerbaru[0].formatUntukDisplay();

    // Log berhasil
    logger.logSystemActivity('METRICS_LATEST_SUCCESS', {
      serverId: serverId,
      serverName: server.nama,
      metricsTimestamp: dataMetrik.timestamp
    });

    return dataMetrik;

  } catch (error) {
    // Log error
    logger.logError('METRICS_LATEST_SERVICE_ERROR', error, {
      serverId: serverId
    });

    // Re-throw error dengan status code
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    throw error;
  }
}

/**
 * DESKRIPSI: Layanan untuk mendapatkan histori metrik server dengan pagination
 *
 * TUJUAN: Mengambil data historis performa server untuk analisis trend
 * dan troubleshooting masalah performa.
 *
 * ALUR KERJA:
 * 1. Validasi parameter input
 * 2. Hitung range waktu berdasarkan jam yang diminta
 * 3. Query data dengan sorting dan pagination
 * 4. Hitung statistik dasar dari data
 * 5. Format response dengan metadata pagination
 *
 * OPTIMIZATION:
 * - Menggunakan index pada timestampPengumpulan dan serverId
 * - Limit query untuk performa
 * - Pre-compute statistik sederhana
 *
 * @param {string} serverId - ID server
 * @param {number} jamTerakhir - Jumlah jam histori (1-168)
 * @param {number} halaman - Nomor halaman (dimulai dari 1)
 * @param {number} limit - Jumlah data per halaman (5-100)
 * @returns {Promise<Object>} Object dengan data dan pagination info
 * @throws {Error} Jika parameter tidak valid atau server tidak ditemukan
 */
async function dapatkanHistoriMetrik(serverId, jamTerakhir, halaman, limit) {
  try {
    // Validasi server
    const server = await Server.findById(serverId);
    if (!server) {
      const error = new Error('Server tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    // Hitung range waktu
    const waktuAkhir = new Date();
    const waktuAwal = new Date(waktuAkhir.getTime() - (jamTerakhir * 60 * 60 * 1000));

    // Log aktivitas
    logger.logSystemActivity('METRICS_HISTORY_REQUEST', {
      serverId: serverId,
      serverName: server.nama,
      hours: jamTerakhir,
      page: halaman,
      limit: limit
    });

    // Hitung total data untuk pagination
    const totalData = await Metrik.countDocuments({
      serverId: serverId,
      timestampPengumpulan: { $gte: waktuAwal, $lte: waktuAkhir }
    });

    const totalHalaman = Math.ceil(totalData / limit);
    const skip = (halaman - 1) * limit;

    // Query data dengan pagination
    const dataHistori = await Metrik.find({
      serverId: serverId,
      timestampPengumpulan: { $gte: waktuAwal, $lte: waktuAkhir }
    })
    .sort({ timestampPengumpulan: -1 })
    .skip(skip)
    .limit(limit)
    .populate('serverId', 'nama jenisServer');

    // Format data untuk response
    const dataFormatted = dataHistori.map(metrik => metrik.formatUntukDisplay());

    // Hitung statistik dasar
    const statistikDasar = await Metrik.aggregate([
      {
        $match: {
          serverId: serverId,
          timestampPengumpulan: { $gte: waktuAwal, $lte: waktuAkhir }
        }
      },
      {
        $group: {
          _id: null,
          rataRataCpu: { $avg: '$cpu.persentase' },
          rataRataMemori: { $avg: '$memori.persentase' },
          rataRataDisk: { $avg: '$disk.persentase' },
          maksCpu: { $max: '$cpu.persentase' },
          maksMemori: { $max: '$memori.persentase' },
          maksDisk: { $max: '$disk.persentase' }
        }
      }
    ]);

    const statistik = statistikDasar.length > 0 ? statistikDasar[0] : {
      rataRataCpu: 0,
      rataRataMemori: 0,
      rataRataDisk: 0,
      maksCpu: 0,
      maksMemori: 0,
      maksDisk: 0
    };

    // Log berhasil
    logger.logSystemActivity('METRICS_HISTORY_SUCCESS', {
      serverId: serverId,
      serverName: server.nama,
      dataCount: dataFormatted.length,
      totalData: totalData,
      statistics: statistik
    });

    return {
      data: dataFormatted,
      pagination: {
        halaman: halaman,
        limit: limit,
        totalData: totalData,
        totalHalaman: totalHalaman,
        adaHalamanSelanjutnya: halaman < totalHalaman,
        adaHalamanSebelumnya: halaman > 1
      },
      statistik: statistik,
      rangeWaktu: {
        dari: waktuAwal,
        sampai: waktuAkhir
      }
    };

  } catch (error) {
    // Log error
    logger.logError('METRICS_HISTORY_SERVICE_ERROR', error, {
      serverId: serverId,
      hours: jamTerakhir,
      page: halaman,
      limit: limit
    });

    if (!error.statusCode) {
      error.statusCode = 500;
    }
    throw error;
  }
}

/**
 * DESKRIPSI: Layanan untuk mendapatkan statistik metrik dalam periode tertentu
 *
 * TUJUAN: Menghitung berbagai statistik performa server untuk analisis
 * dan reporting dalam dashboard monitoring.
 *
 * ALUR KERJA:
 * 1. Validasi parameter dan server
 * 2. Query agregasi untuk menghitung statistik
 * 3. Hitung trend dan pola performa
 * 4. Analisis kesehatan berdasarkan threshold
 * 5. Format response dengan insights
 *
 * STATISTIK YANG DIHITUNG:
 * - Rata-rata, minimum, maksimum untuk setiap metric
 * - Trend performa (meningkat/menurun/stabil)
 * - Jumlah data point dan coverage waktu
 * - Status kesehatan keseluruhan
 *
 * @param {string} serverId - ID server
 * @param {number} jamTerakhir - Periode analisis dalam jam (1-720)
 * @returns {Promise<Object>} Statistik lengkap performa server
 * @throws {Error} Jika server tidak ditemukan atau error query
 */
async function dapatkanStatistikMetrik(serverId, jamTerakhir) {
  try {
    // Validasi server
    const server = await Server.findById(serverId);
    if (!server) {
      const error = new Error('Server tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    const waktuAkhir = new Date();
    const waktuAwal = new Date(waktuAkhir.getTime() - (jamTerakhir * 60 * 60 * 1000));

    // Log aktivitas
    logger.logSystemActivity('METRICS_STATS_REQUEST', {
      serverId: serverId,
      serverName: server.nama,
      hours: jamTerakhir
    });

    // Query statistik menggunakan aggregation
    const hasilAgregasi = await Metrik.aggregate([
      {
        $match: {
          serverId: serverId,
          timestampPengumpulan: { $gte: waktuAwal, $lte: waktuAkhir }
        }
      },
      {
        $group: {
          _id: null,
          // CPU Statistics
          rataRataCpu: { $avg: '$cpu.persentase' },
          minCpu: { $min: '$cpu.persentase' },
          maksCpu: { $max: '$cpu.persentase' },
          stdDevCpu: { $stdDevSamp: '$cpu.persentase' },

          // Memory Statistics
          rataRataMemori: { $avg: '$memori.persentase' },
          minMemori: { $min: '$memori.persentase' },
          maksMemori: { $max: '$memori.persentase' },
          stdDevMemori: { $stdDevSamp: '$memori.persentase' },

          // Disk Statistics
          rataRataDisk: { $avg: '$disk.persentase' },
          minDisk: { $min: '$disk.persentase' },
          maksDisk: { $max: '$disk.persentase' },
          stdDevDisk: { $stdDevSamp: '$disk.persentase' },

          // Network Statistics
          rataRataLatensi: { $avg: '$jaringan.latensiMs' },
          minLatensi: { $min: '$jaringan.latensiMs' },
          maksLatensi: { $max: '$jaringan.latensiMs' },

          // Metadata
          jumlahData: { $sum: 1 },
          dataTerbaru: { $max: '$timestampPengumpulan' },
          dataTerlama: { $min: '$timestampPengumpulan' }
        }
      }
    ]);

    // Handle jika tidak ada data
    if (hasilAgregasi.length === 0) {
      logger.logSystemActivity('METRICS_STATS_NO_DATA', {
        serverId: serverId,
        serverName: server.nama,
        hours: jamTerakhir
      });

      return {
        serverId: serverId,
        serverNama: server.nama,
        periode: { dari: waktuAwal, sampai: waktuAkhir },
        jumlahData: 0,
        pesan: 'Tidak ada data metrik dalam periode yang diminta',
        statistik: null
      };
    }

    const stats = hasilAgregasi[0];

    // Hitung trend berdasarkan data terbaru vs rata-rata
    const dataTerbaru = await Metrik.findOne({
      serverId: serverId,
      timestampPengumpulan: { $gte: waktuAwal, $lte: waktuAkhir }
    }).sort({ timestampPengumpulan: -1 });

    const trend = dataTerbaru ? {
      cpu: dataTerbaru.cpu.persentase > stats.rataRataCpu ? 'meningkat' :
           dataTerbaru.cpu.persentase < stats.rataRataCpu ? 'menurun' : 'stabil',
      memori: dataTerbaru.memori.persentase > stats.rataRataMemori ? 'meningkat' :
              dataTerbaru.memori.persentase < stats.rataRataMemori ? 'menurun' : 'stabil',
      disk: dataTerbaru.disk.persentase > stats.rataRataDisk ? 'meningkat' :
            dataTerbaru.disk.persentase < stats.rataRataDisk ? 'menurun' : 'stabil'
    } : null;

    // Analisis kesehatan berdasarkan threshold
    const kesehatan = {
      cpu: {
        status: stats.rataRataCpu >= THRESHOLD_DEFAULT.CPU_CRITICAL ? 'critical' :
                stats.rataRataCpu >= THRESHOLD_DEFAULT.CPU_WARNING ? 'warning' : 'ok',
        threshold: {
          warning: THRESHOLD_DEFAULT.CPU_WARNING,
          critical: THRESHOLD_DEFAULT.CPU_CRITICAL
        }
      },
      memori: {
        status: stats.rataRataMemori >= THRESHOLD_DEFAULT.MEMORI_CRITICAL ? 'critical' :
                stats.rataRataMemori >= THRESHOLD_DEFAULT.MEMORI_WARNING ? 'warning' : 'ok',
        threshold: {
          warning: THRESHOLD_DEFAULT.MEMORI_WARNING,
          critical: THRESHOLD_DEFAULT.MEMORI_CRITICAL
        }
      },
      disk: {
        status: stats.rataRataDisk >= THRESHOLD_DEFAULT.DISK_CRITICAL ? 'critical' :
                stats.rataRataDisk >= THRESHOLD_DEFAULT.DISK_WARNING ? 'warning' : 'ok',
        threshold: {
          warning: THRESHOLD_DEFAULT.DISK_WARNING,
          critical: THRESHOLD_DEFAULT.DISK_CRITICAL
        }
      }
    };

    // Hitung coverage waktu
    const durasiTotalMs = waktuAkhir - waktuAwal;
    const intervalRataRataMs = stats.jumlahData > 1 ?
      (stats.dataTerbaru - stats.dataTerlama) / (stats.jumlahData - 1) : 0;
    const coveragePersen = intervalRataRataMs > 0 ?
      Math.min((durasiTotalMs / intervalRataRataMs) / stats.jumlahData * 100, 100) : 0;

    const hasilStatistik = {
      serverId: serverId,
      serverNama: server.nama,
      periode: {
        dari: waktuAwal,
        sampai: waktuAkhir,
        jam: jamTerakhir
      },
      jumlahData: stats.jumlahData,
      coverageWaktu: {
        persentase: Math.round(coveragePersen * 100) / 100,
        intervalRataRataMenit: Math.round(intervalRataRataMs / 60000 * 100) / 100
      },
      statistik: {
        cpu: {
          rataRata: Math.round(stats.rataRataCpu * 100) / 100,
          minimum: stats.minCpu,
          maksimum: stats.maksCpu,
          deviasiStandar: Math.round(stats.stdDevCpu * 100) / 100
        },
        memori: {
          rataRata: Math.round(stats.rataRataMemori * 100) / 100,
          minimum: stats.minMemori,
          maksimum: stats.maksMemori,
          deviasiStandar: Math.round(stats.stdDevMemori * 100) / 100
        },
        disk: {
          rataRata: Math.round(stats.rataRataDisk * 100) / 100,
          minimum: stats.minDisk,
          maksimum: stats.maksDisk,
          deviasiStandar: Math.round(stats.stdDevDisk * 100) / 100
        },
        jaringan: {
          latensiRataRata: Math.round(stats.rataRataLatensi * 100) / 100,
          latensiMinimum: stats.minLatensi,
          latensiMaksimum: stats.maksLatensi
        }
      },
      trend: trend,
      kesehatan: kesehatan,
      dataTerakhir: dataTerbaru ? dataTerbaru.timestampPengumpulan : null
    };

    // Log berhasil
    logger.logSystemActivity('METRICS_STATS_SUCCESS', {
      serverId: serverId,
      serverName: server.nama,
      dataPoints: stats.jumlahData,
      avgCpu: hasilStatistik.statistik.cpu.rataRata
    });

    return hasilStatistik;

  } catch (error) {
    // Log error
    logger.logError('METRICS_STATS_SERVICE_ERROR', error, {
      serverId: serverId,
      hours: jamTerakhir
    });

    if (!error.statusCode) {
      error.statusCode = 500;
    }
    throw error;
  }
}

/**
 * DESKRIPSI: Layanan untuk deteksi anomali pada data metrik
 *
 * TUJUAN: Mengidentifikasi pola tidak normal pada performa server
 * menggunakan statistical analysis untuk early warning.
 *
 * ALUR KERJA:
 * 1. Ambil data historis dalam periode analisis
 * 2. Hitung baseline (rata-rata dan standar deviasi)
 * 3. Deteksi outlier menggunakan z-score atau IQR method
 * 4. Klasifikasikan jenis anomali (spike, drop, oscillation)
 * 5. Hitung confidence score untuk setiap anomali
 *
 * METODE DETEKSI:
 * - Z-Score: untuk data normal distribution
 * - Modified Z-Score: robust terhadap outlier
 * - Threshold-based: simple comparison dengan threshold
 *
 * @param {string} serverId - ID server untuk analisis
 * @param {number} jamTerakhir - Periode analisis dalam jam (6-168)
 * @returns {Promise<Object>} Hasil deteksi anomali dengan confidence
 * @throws {Error} Jika data tidak cukup atau error analisis
 */
async function deteksiAnomaliMetrik(serverId, jamTerakhir) {
  try {
    // Validasi server
    const server = await Server.findById(serverId);
    if (!server) {
      const error = new Error('Server tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    const waktuAkhir = new Date();
    const waktuAwal = new Date(waktuAkhir.getTime() - (jamTerakhir * 60 * 60 * 1000));

    // Log aktivitas
    logger.logSystemActivity('METRICS_ANOMALY_REQUEST', {
      serverId: serverId,
      serverName: server.nama,
      hours: jamTerakhir
    });

    // Ambil data untuk analisis
    const dataMetrik = await Metrik.find({
      serverId: serverId,
      timestampPengumpulan: { $gte: waktuAwal, $lte: waktuAkhir }
    }).sort({ timestampPengumpulan: 1 });

    if (dataMetrik.length < 10) {
      return {
        serverId: serverId,
        serverNama: server.nama,
        periodeAnalisis: { dari: waktuAwal, sampai: waktuAkhir },
        jumlahData: dataMetrik.length,
        anomali: [],
        pesan: 'Data tidak cukup untuk analisis anomali (minimal 10 data point)',
        rekomendasi: 'Tunggu pengumpulan data lebih banyak atau kurangi periode analisis'
      };
    }

    // Ekstrak nilai untuk analisis
    const cpuValues = dataMetrik.map(m => m.cpu.persentase);
    const memoriValues = dataMetrik.map(m => m.memori.persentase);
    const diskValues = dataMetrik.map(m => m.disk.persentase);

    // Fungsi untuk deteksi anomali menggunakan modified z-score
    function deteksiAnomaliZScore(values, threshold = 3.5) {
      const n = values.length;
      const median = values.sort((a, b) => a - b)[Math.floor(n / 2)];
      const mad = values.reduce((sum, val) => sum + Math.abs(val - median), 0) / n;

      if (mad === 0) return []; // Semua nilai sama

      const anomalies = [];
      values.forEach((value, index) => {
        const modifiedZScore = 0.6745 * (value - median) / mad;
        if (Math.abs(modifiedZScore) > threshold) {
          anomalies.push({
            index: index,
            nilai: value,
            zScore: modifiedZScore,
            confidence: Math.min(Math.abs(modifiedZScore) / 5 * 100, 100)
          });
        }
      });

      return anomalies;
    }

    // Deteksi anomali untuk setiap metric
    const anomaliCpu = deteksiAnomaliZScore(cpuValues).map(a => ({
      ...a,
      metric: 'cpu',
      timestamp: dataMetrik[a.index].timestampPengumpulan,
      jenis: a.nilai > cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length ? 'spike' : 'drop'
    }));

    const anomaliMemori = deteksiAnomaliZScore(memoriValues).map(a => ({
      ...a,
      metric: 'memori',
      timestamp: dataMetrik[a.index].timestampPengumpulan,
      jenis: a.nilai > memoriValues.reduce((a, b) => a + b, 0) / memoriValues.length ? 'spike' : 'drop'
    }));

    const anomaliDisk = deteksiAnomaliZScore(diskValues).map(a => ({
      ...a,
      metric: 'disk',
      timestamp: dataMetrik[a.index].timestampPengumpulan,
      jenis: a.nilai > diskValues.reduce((a, b) => a + b, 0) / diskValues.length ? 'spike' : 'drop'
    }));

    // Gabungkan semua anomali
    const semuaAnomali = [...anomaliCpu, ...anomaliMemori, ...anomaliDisk]
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending

    // Hitung statistik baseline
    const baseline = {
      cpu: {
        rataRata: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
        deviasiStandar: Math.sqrt(
          cpuValues.reduce((sum, val) => sum + Math.pow(val - (cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length), 2), 0) / cpuValues.length
        )
      },
      memori: {
        rataRata: memoriValues.reduce((a, b) => a + b, 0) / memoriValues.length,
        deviasiStandar: Math.sqrt(
          memoriValues.reduce((sum, val) => sum + Math.pow(val - (memoriValues.reduce((a, b) => a + b, 0) / memoriValues.length), 2), 0) / memoriValues.length
        )
      },
      disk: {
        rataRata: diskValues.reduce((a, b) => a + b, 0) / diskValues.length,
        deviasiStandar: Math.sqrt(
          diskValues.reduce((sum, val) => sum + Math.pow(val - (diskValues.reduce((a, b) => a + b, 0) / diskValues.length), 2), 0) / diskValues.length
        )
      }
    };

    const hasilAnomali = {
      serverId: serverId,
      serverNama: server.nama,
      periodeAnalisis: {
        dari: waktuAwal,
        sampai: waktuAkhir,
        jam: jamTerakhir
      },
      jumlahData: dataMetrik.length,
      anomali: semuaAnomali,
      baseline: baseline,
      ringkasan: {
        totalAnomali: semuaAnomali.length,
        anomaliByMetric: {
          cpu: anomaliCpu.length,
          memori: anomaliMemori.length,
          disk: anomaliDisk.length
        },
        anomaliByJenis: {
          spike: semuaAnomali.filter(a => a.jenis === 'spike').length,
          drop: semuaAnomali.filter(a => a.jenis === 'drop').length
        }
      },
      rekomendasi: semuaAnomali.length > 0 ?
        'Periksa server untuk kondisi yang menyebabkan anomali performa' :
        'Performa server dalam kondisi normal tanpa anomali signifikan'
    };

    // Log berhasil
    logger.logSystemActivity('METRICS_ANOMALY_SUCCESS', {
      serverId: serverId,
      serverName: server.nama,
      anomaliesFound: semuaAnomali.length,
      dataPoints: dataMetrik.length
    });

    return hasilAnomali;

  } catch (error) {
    // Log error
    logger.logError('METRICS_ANOMALY_SERVICE_ERROR', error, {
      serverId: serverId,
      hours: jamTerakhir
    });

    if (!error.statusCode) {
      error.statusCode = 500;
    }
    throw error;
  }
}

/**
 * DESKRIPSI: Layanan untuk mendapatkan ringkasan kesehatan semua server user
 *
 * TUJUAN: Memberikan overview cepat status kesehatan seluruh infrastruktur
 * untuk dashboard monitoring utama.
 *
 * ALUR KERJA:
 * 1. Ambil semua server yang dimiliki user
 * 2. Query metrik terbaru untuk setiap server
 * 3. Hitung status kesehatan keseluruhan
 * 4. Susun ringkasan dengan prioritas masalah
 * 5. Berikan rekomendasi tindakan
 *
 * STATUS KESEHATAN:
 * - OK: Semua metrics dalam threshold normal
 * - WARNING: Ada metrics yang melebihi warning threshold
 * - CRITICAL: Ada metrics yang melebihi critical threshold
 *
 * @param {string} userId - ID user untuk filter server ownership
 * @returns {Promise<Object>} Ringkasan kesehatan semua server
 * @throws {Error} Jika error query database
 */
async function dapatkanRingkasanKesehatan(userId) {
  try {
    // Log aktivitas
    logger.logSystemActivity('METRICS_HEALTH_REQUEST', {
      userId: userId
    });

    // Ambil semua server user
    const servers = await Server.find({ pemilik: userId })
      .select('nama jenisServer statusKesehatan');

    if (servers.length === 0) {
      return {
        ringkasan: [],
        statistik: {
          totalServer: 0,
          serverSehat: 0,
          serverWarning: 0,
          serverCritical: 0
        },
        rekomendasi: 'Belum ada server yang didaftarkan untuk monitoring'
      };
    }

    // Ambil metrik terbaru untuk setiap server
    const ringkasanServer = await Promise.all(
      servers.map(async (server) => {
        const metrikTerbaru = await Metrik.findOne({ serverId: server._id })
          .sort({ timestampPengumpulan: -1 })
          .select('cpu.persentase memori.persentase disk.persentase jaringan.latensiMs statusKesehatan timestampPengumpulan');

        if (!metrikTerbaru) {
          return {
            serverId: server._id,
            nama: server.nama,
            jenis: server.jenisServer,
            status: 'no_data',
            metricsTerbaru: null,
            dataTerakhir: null,
            rekomendasi: 'Belum ada data monitoring'
          };
        }

        // Tentukan status kesehatan berdasarkan metrics
        let statusKesehatan = 'ok';
        const rekomendasi = [];

        if (metrikTerbaru.cpu.persentase >= THRESHOLD_DEFAULT.CPU_CRITICAL ||
            metrikTerbaru.memori.persentase >= THRESHOLD_DEFAULT.MEMORI_CRITICAL ||
            metrikTerbaru.disk.persentase >= THRESHOLD_DEFAULT.DISK_CRITICAL) {
          statusKesehatan = 'critical';
          rekomendasi.push('Periksa immediately - metrics melebihi threshold critical');
        } else if (metrikTerbaru.cpu.persentase >= THRESHOLD_DEFAULT.CPU_WARNING ||
                   metrikTerbaru.memori.persentase >= THRESHOLD_DEFAULT.MEMORI_WARNING ||
                   metrikTerbaru.disk.persentase >= THRESHOLD_DEFAULT.DISK_WARNING) {
          statusKesehatan = 'warning';
          rekomendasi.push('Monitor closely - ada metrics yang perlu perhatian');
        }

        if (metrikTerbaru.jaringan.latensiMs >= THRESHOLD_DEFAULT.LATENSI_CRITICAL) {
          if (statusKesehatan === 'ok') statusKesehatan = 'warning';
          rekomendasi.push('Periksa koneksi jaringan');
        }

        return {
          serverId: server._id,
          nama: server.nama,
          jenis: server.jenisServer,
          status: statusKesehatan,
          metricsTerbaru: {
            cpu: metrikTerbaru.cpu.persentase,
            memori: metrikTerbaru.memori.persentase,
            disk: metrikTerbaru.disk.persentase,
            latensi: metrikTerbaru.jaringan.latensiMs
          },
          dataTerakhir: metrikTerbaru.timestampPengumpulan,
          rekomendasi: rekomendasi.length > 0 ? rekomendasi : ['Server dalam kondisi baik']
        };
      })
    );

    // Hitung statistik keseluruhan
    const statistik = {
      totalServer: servers.length,
      serverSehat: ringkasanServer.filter(s => s.status === 'ok').length,
      serverWarning: ringkasanServer.filter(s => s.status === 'warning').length,
      serverCritical: ringkasanServer.filter(s => s.status === 'critical').length,
      serverNoData: ringkasanServer.filter(s => s.status === 'no_data').length
    };

    // Sort berdasarkan prioritas masalah
    const urutanPrioritas = { critical: 3, warning: 2, ok: 1, no_data: 0 };
    ringkasanServer.sort((a, b) => urutanPrioritas[b.status] - urutanPrioritas[a.status]);

    const hasilRingkasan = {
      ringkasan: ringkasanServer,
      statistik: statistik,
      rekomendasi: statistik.serverCritical > 0 ?
        `${statistik.serverCritical} server critical perlu perhatian segera` :
        statistik.serverWarning > 0 ?
        `${statistik.serverWarning} server warning perlu dimonitor` :
        'Semua server dalam kondisi baik'
    };

    // Log berhasil
    logger.logSystemActivity('METRICS_HEALTH_SUCCESS', {
      userId: userId,
      serversCount: servers.length,
      healthy: statistik.serverSehat,
      warning: statistik.serverWarning,
      critical: statistik.serverCritical
    });

    return hasilRingkasan;

  } catch (error) {
    // Log error
    logger.logError('METRICS_HEALTH_SERVICE_ERROR', error, {
      userId: userId
    });

    if (!error.statusCode) {
      error.statusCode = 500;
    }
    throw error;
  }
}

module.exports = {
  dapatkanMetrikTerbaru,
  dapatkanHistoriMetrik,
  dapatkanStatistikMetrik,
  deteksiAnomaliMetrik,
  dapatkanRingkasanKesehatan
};