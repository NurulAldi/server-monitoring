// Model untuk Agregat Metrik Harian
// Schema MongoDB untuk menyimpan data aggregat harian metrics server

const mongoose = require('mongoose');

/**
 * DESKRIPSI: Schema untuk agregat metrik harian
 *
 * TUJUAN: Menyimpan data statistik harian untuk analisis trend jangka panjang,
 * dashboard historical, dan reporting. Data ini di-generate dari raw metrics
 * setiap hari pada midnight.
 *
 * STRUKTUR DATA:
 * - Statistik min/max/avg/std untuk setiap parameter
 * - Kondisi dominan dan waktu dalam kondisi tertentu
 * - Event summary (alert, restart, uptime)
 * - Trend indikator untuk analisis pola
 *
 * RETENTION: 1 tahun (365 hari)
 */
const metrikAgregatHarianSchema = new mongoose.Schema({
  // Referensi server
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: [true, 'Server ID wajib diisi'],
    index: true
  },

  // Tanggal agregat (YYYY-MM-DD)
  tanggal: {
    type: Date,
    required: [true, 'Tanggal wajib diisi'],
    index: true
  },

  // Statistik parameter utama
  statistik: {
    cpu: {
      min: { type: Number, min: 0, max: 100 },
      max: { type: Number, min: 0, max: 100 },
      avg: { type: Number, min: 0, max: 100 },
      std: { type: Number, min: 0 }, // Standard deviation
      persentil95: { type: Number, min: 0, max: 100 } // 95th percentile
    },
    memori: {
      min: { type: Number, min: 0, max: 100 },
      max: { type: Number, min: 0, max: 100 },
      avg: { type: Number, min: 0, max: 100 },
      std: { type: Number, min: 0 },
      persentil95: { type: Number, min: 0, max: 100 }
    },
    disk: {
      min: { type: Number, min: 0, max: 100 },
      max: { type: Number, min: 0, max: 100 },
      avg: { type: Number, min: 0, max: 100 },
      std: { type: Number, min: 0 },
      persentil95: { type: Number, min: 0, max: 100 }
    },
    jaringan: {
      minLatensi: { type: Number, min: 0 },
      maxLatensi: { type: Number, min: 0 },
      avgLatensi: { type: Number, min: 0 },
      stdLatensi: { type: Number, min: 0 },
      persentil95Latensi: { type: Number, min: 0 },
      totalPaketHilang: { type: Number, min: 0 },
      avgThroughput: { type: Number, min: 0 }
    },
    sistemOperasi: {
      avgLoad1menit: { type: Number, min: 0 },
      avgLoad5menit: { type: Number, min: 0 },
      avgLoad15menit: { type: Number, min: 0 },
      maxProsesAktif: { type: Number, min: 0 },
      avgProsesAktif: { type: Number, min: 0 },
      totalRestart: { type: Number, min: 0, default: 0 }
    }
  },

  // Kondisi kesehatan harian
  kondisiHarian: {
    kondisiDominan: {
      type: String,
      enum: ['NORMAL', 'WARNING', 'CRITICAL'],
      default: 'NORMAL'
    },
    waktuDalamKondisi: {
      normal: { type: Number, min: 0, default: 0 }, // menit
      warning: { type: Number, min: 0, default: 0 }, // menit
      critical: { type: Number, min: 0, default: 0 } // menit
    },
    jumlahTransisiKondisi: { type: Number, min: 0, default: 0 }
  },

  // Event summary
  eventSummary: {
    jumlahAlert: { type: Number, min: 0, default: 0 },
    jumlahAlertWarning: { type: Number, min: 0, default: 0 },
    jumlahAlertCritical: { type: Number, min: 0, default: 0 },
    jumlahRestart: { type: Number, min: 0, default: 0 },
    uptimePersen: { type: Number, min: 0, max: 100, default: 100 },
    downtimeMenit: { type: Number, min: 0, default: 0 }
  },

  // Trend indikator
  trend: {
    cpu: {
      slope: { type: Number }, // Rate of change per hour
      direction: { type: String, enum: ['increasing', 'decreasing', 'stable'] },
      volatility: { type: Number, min: 0 } // Variance measure
    },
    memori: {
      slope: { type: Number },
      direction: { type: String, enum: ['increasing', 'decreasing', 'stable'] },
      volatility: { type: Number, min: 0 }
    },
    disk: {
      slope: { type: Number },
      direction: { type: String, enum: ['increasing', 'decreasing', 'stable'] },
      volatility: { type: Number, min: 0 }
    },
    jaringan: {
      latensiTrend: { type: String, enum: ['improving', 'degrading', 'stable'] },
      throughputTrend: { type: String, enum: ['increasing', 'decreasing', 'stable'] }
    }
  },

  // AI insights (hasil analisis otomatis)
  aiInsights: {
    anomalyScore: { type: Number, min: 0, max: 100 }, // 0-100, higher = more anomalous
    predictedFailureRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    recommendedActions: [{ type: String }], // Array of recommended actions
    confidence: { type: Number, min: 0, max: 100 } // AI confidence level
  },

  // Metadata agregat
  metadataAgregat: {
    jumlahDataPoint: { type: Number, min: 0 }, // Total raw metrics aggregated
    periodePengumpulan: {
      mulai: { type: Date },
      selesai: { type: Date }
    },
    metodeAgregat: { type: String, default: 'daily_auto' },
    versiAgregator: { type: String, default: '1.0.0' }
  }

}, {
  timestamps: true,
  collection: 'metrik_agregat_harian'
});

/**
 * INDEXING STRATEGI
 */
metrikAgregatHarianSchema.index({ serverId: 1, tanggal: -1 }); // Primary query
metrikAgregatHarianSchema.index({ kondisiHarian: 1, tanggal: -1 }); // Condition filtering
metrikAgregatHarianSchema.index({ 'trend.cpu.direction': 1, tanggal: -1 }); // Trend analysis
metrikAgregatHarianSchema.index({ tanggal: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // TTL 1 tahun

/**
 * VIRTUALS
 */
metrikAgregatHarianSchema.virtual('totalMenitHari').get(function() {
  return 24 * 60; // 1440 menit
});

metrikAgregatHarianSchema.virtual('uptimeMenit').get(function() {
  return this.totalMenitHari - this.eventSummary.downtimeMenit;
});

metrikAgregatHarianSchema.virtual('ringkasanKesehatan').get(function() {
  const kondisi = this.kondisiHarian;
  const uptime = this.eventSummary.uptimePersen;

  let status = 'HEALTHY';
  if (kondisi.kondisiDominan === 'CRITICAL' || uptime < 95) status = 'UNHEALTHY';
  else if (kondisi.kondisiDominan === 'WARNING' || uptime < 99) status = 'WARNING';

  return {
    status,
    kondisiDominan: kondisi.kondisiDominan,
    uptimePersen: uptime,
    totalAlert: this.eventSummary.jumlahAlert,
    aiRisk: this.aiInsights?.predictedFailureRisk || 'unknown'
  };
});

/**
 * INSTANCE METHODS
 */
metrikAgregatHarianSchema.methods.hitungSlope = function(values, timestamps) {
  if (values.length < 2) return 0;

  // Simple linear regression untuk slope
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = timestamps[i].getTime(); // Use timestamp as x
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope || 0;
};

metrikAgregatHarianSchema.methods.tentukanDirection = function(slope, threshold = 0.1) {
  if (Math.abs(slope) < threshold) return 'stable';
  return slope > 0 ? 'increasing' : 'decreasing';
};

/**
 * STATIC METHODS
 */
metrikAgregatHarianSchema.statics.generateAgregatHarian = async function(serverId, tanggal) {
  const { Metrik } = require('./Metrik');
  const startDate = new Date(tanggal);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);

  // Ambil semua metrics untuk tanggal tersebut
  const metrics = await Metrik.find({
    serverId,
    timestampPengumpulan: { $gte: startDate, $lte: endDate }
  }).sort({ timestampPengumpulan: 1 });

  if (metrics.length === 0) return null;

  // Hitung statistik
  const stats = this.hitungStatistik(metrics);

  // Hitung kondisi harian
  const kondisiHarian = this.analisisKondisiHarian(metrics);

  // Hitung event summary
  const eventSummary = this.hitungEventSummary(metrics);

  // Hitung trend
  const trend = this.analisisTrend(metrics);

  // Buat dokumen agregat
  const agregat = new this({
    serverId,
    tanggal: startDate,
    statistik: stats,
    kondisiHarian,
    eventSummary,
    trend,
    metadataAgregat: {
      jumlahDataPoint: metrics.length,
      periodePengumpulan: {
        mulai: startDate,
        selesai: endDate
      }
    }
  });

  await agregat.save();
  return agregat;
};

metrikAgregatHarianSchema.statics.hitungStatistik = function(metrics) {
  const extractValues = (field) => metrics.map(m => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return m[parent]?.[child] || 0;
    }
    return m[field] || 0;
  });

  const calculateStats = (values) => {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, std: 0, persentil95: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    // 95th percentile
    const index95 = Math.floor(sorted.length * 0.95);
    const persentil95 = sorted[index95] || max;

    return { min, max, avg, std, persentil95 };
  };

  return {
    cpu: calculateStats(extractValues('cpu.persentase')),
    memori: calculateStats(extractValues('memori.persentase')),
    disk: calculateStats(extractValues('disk.persentase')),
    jaringan: {
      ...calculateStats(extractValues('jaringan.latensiMs')),
      totalPaketHilang: extractValues('jaringan.paketHilangPersen').reduce((a, b) => a + b, 0),
      avgThroughput: extractValues('jaringan.downloadMbps').reduce((a, b) => a + b, 0) / metrics.length
    },
    sistemOperasi: {
      avgLoad1menit: extractValues('sistemOperasi.bebanRataRata.1menit').reduce((a, b) => a + b, 0) / metrics.length,
      avgLoad5menit: extractValues('sistemOperasi.bebanRataRata.5menit').reduce((a, b) => a + b, 0) / metrics.length,
      avgLoad15menit: extractValues('sistemOperasi.bebanRataRata.15menit').reduce((a, b) => a + b, 0) / metrics.length,
      maxProsesAktif: Math.max(...extractValues('sistemOperasi.prosesAktif')),
      avgProsesAktif: extractValues('sistemOperasi.prosesAktif').reduce((a, b) => a + b, 0) / metrics.length,
      totalRestart: metrics.filter(m => m.sistemOperasi.uptimeDetik < 3600).length // Restart dalam 1 jam
    }
  };
};

metrikAgregatHarianSchema.statics.analisisKondisiHarian = function(metrics) {
  const kondisiCount = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
  let transisiCount = 0;
  let kondisiSebelumnya = null;

  metrics.forEach(metric => {
    const kondisi = metric.kondisiTerdeteksi;
    kondisiCount[kondisi] = (kondisiCount[kondisi] || 0) + 1;

    if (kondisiSebelumnya && kondisiSebelumnya !== kondisi) {
      transisiCount++;
    }
    kondisiSebelumnya = kondisi;
  });

  // Hitung waktu dalam menit (asumsikan interval 1 menit)
  const totalMetrics = metrics.length;
  const menitPerMetric = 1; // 1 menit per metric

  const kondisiDominan = Object.keys(kondisiCount).reduce((a, b) =>
    kondisiCount[a] > kondisiCount[b] ? a : b
  );

  return {
    kondisiDominan,
    waktuDalamKondisi: {
      normal: kondisiCount.NORMAL * menitPerMetric,
      warning: kondisiCount.WARNING * menitPerMetric,
      critical: kondisiCount.CRITICAL * menitPerMetric
    },
    jumlahTransisiKondisi: transisiCount
  };
};

metrikAgregatHarianSchema.statics.hitungEventSummary = function(metrics) {
  const alerts = metrics.filter(m => m.statusKesehatan !== 'OK');
  const restarts = metrics.filter(m => m.sistemOperasi.uptimeDetik < 3600);

  // Hitung downtime (asumsikan interval 1 menit)
  const downtimeMenit = restarts.length; // Setiap restart = 1 menit downtime
  const totalMenit = metrics.length;
  const uptimePersen = ((totalMenit - downtimeMenit) / totalMenit) * 100;

  return {
    jumlahAlert: alerts.length,
    jumlahAlertWarning: alerts.filter(a => a.statusKesehatan === 'Warning').length,
    jumlahAlertCritical: alerts.filter(a => a.statusKesehatan === 'Critical').length,
    jumlahRestart: restarts.length,
    uptimePersen: Math.max(0, Math.min(100, uptimePersen)),
    downtimeMenit
  };
};

metrikAgregatHarianSchema.statics.analisisTrend = function(metrics) {
  if (metrics.length < 2) {
    return {
      cpu: { slope: 0, direction: 'stable', volatility: 0 },
      memori: { slope: 0, direction: 'stable', volatility: 0 },
      disk: { slope: 0, direction: 'stable', volatility: 0 },
      jaringan: { latensiTrend: 'stable', throughputTrend: 'stable' }
    };
  }

  const timestamps = metrics.map(m => m.timestampPengumpulan);

  const cpuValues = metrics.map(m => m.cpu.persentase);
  const memoriValues = metrics.map(m => m.memori.persentase);
  const diskValues = metrics.map(m => m.disk.persentase);
  const latensiValues = metrics.map(m => m.jaringan.latensiMs);
  const throughputValues = metrics.map(m => m.jaringan.downloadMbps);

  return {
    cpu: {
      slope: this.prototype.hitungSlope(cpuValues, timestamps),
      direction: this.prototype.tentukanDirection(this.prototype.hitungSlope(cpuValues, timestamps)),
      volatility: this.hitungVolatility(cpuValues)
    },
    memori: {
      slope: this.prototype.hitungSlope(memoriValues, timestamps),
      direction: this.prototype.tentukanDirection(this.prototype.hitungSlope(memoriValues, timestamps)),
      volatility: this.hitungVolatility(memoriValues)
    },
    disk: {
      slope: this.prototype.hitungSlope(diskValues, timestamps),
      direction: this.prototype.tentukanDirection(this.prototype.hitungSlope(diskValues, timestamps)),
      volatility: this.hitungVolatility(diskValues)
    },
    jaringan: {
      latensiTrend: this.prototype.tentukanDirection(this.prototype.hitungSlope(latensiValues, timestamps)) === 'increasing' ? 'degrading' : 'improving',
      throughputTrend: this.prototype.tentukanDirection(this.prototype.hitungSlope(throughputValues, timestamps))
    }
  };
};

metrikAgregatHarianSchema.statics.hitungVolatility = function(values) {
  if (values.length < 2) return 0;

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const MetrikAgregatHarian = mongoose.model('MetrikAgregatHarian', metrikAgregatHarianSchema);

module.exports = MetrikAgregatHarian;