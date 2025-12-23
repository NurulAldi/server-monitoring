// Utilitas untuk penentuan status server
// Logika penentuan status berdasarkan parameter health server

const logger = require('./logger');

/**
 * DESKRIPSI: Konstanta threshold untuk setiap parameter health server
 * SIMPLIFIED: Only CPU, RAM, Disk, Temperature
 */
const THRESHOLDS = {
  cpu: {
    normal: { min: 0, max: 60 },
    warning: { min: 61, max: 80 },
    critical: { min: 81, max: 95 },
    danger: { min: 96, max: 100 }
  },
  memori: {
    normal: { min: 0, max: 70 },
    warning: { min: 71, max: 85 },
    critical: { min: 86, max: 95 },
    danger: { min: 96, max: 100 }
  },
  disk: {
    normal: { min: 0, max: 75 },
    warning: { min: 76, max: 85 },
    critical: { min: 86, max: 95 },
    danger: { min: 96, max: 100 }
  },
  suhu: {
    normal: { min: 0, max: 65 },
    warning: { min: 66, max: 75 },
    critical: { min: 76, max: 85 },
    danger: { min: 86, max: 150 }
  }
};

/**
 * DESKRIPSI: Status levels server (dari terbaik ke terburuk)
 */
const STATUS_LEVELS = {
  HEALTHY: { level: 1, emoji: '🟢', color: '#10B981' },
  WARNING: { level: 2, emoji: '🟡', color: '#F59E0B' },
  CRITICAL: { level: 3, emoji: '🟠', color: '#F97316' },
  DANGER: { level: 4, emoji: '🔴', color: '#EF4444' },
  OFFLINE: { level: 5, emoji: '⚫', color: '#6B7280' },
  MAINTENANCE: { level: 0, emoji: '🔧', color: '#8B5CF6' }
};

/**
 * DESKRIPSI: Weights untuk criticality scoring
 * SIMPLIFIED: Only 4 metrics
 */
const PARAMETER_WEIGHTS = {
  cpu: 4,
  memori: 4,
  disk: 3,
  suhu: 3
};

/**
 * DESKRIPSI: Hysteresis configuration untuk anti-flapping
 */
const HYSTERESIS_CONFIG = {
  upgrade: {
    delay: 0, // Immediate upgrade
    samples: 1 // 1 sample cukup untuk upgrade
  },
  downgrade: {
    HEALTHY: { delay: 20 * 60 * 1000, samples: 3 }, // 20 menit, 3 samples
    WARNING: { delay: 15 * 60 * 1000, samples: 3 }, // 15 menit, 3 samples
    CRITICAL: { delay: 10 * 60 * 1000, samples: 2 }, // 10 menit, 2 samples
    DANGER: { delay: 5 * 60 * 1000, samples: 2 } // 5 menit, 2 samples
  },
  offline: {
    soft: 5 * 60 * 1000, // 5 menit -> WARNING
    hard: 15 * 60 * 1000 // 15 menit -> OFFLINE
  }
};

/**
 * Menentukan status parameter individual
 * @param {string} parameter - Nama parameter (cpu, memori, disk, suhu)
 * @param {number} value - Nilai parameter
 * @returns {string} Status parameter (normal, warning, critical, danger)
 */
function tentukanStatusParameter(parameter, value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'unknown';
  }

  const thresholds = THRESHOLDS[parameter];

  if (!thresholds) {
    logger.warn(`Threshold tidak ditemukan untuk parameter: ${parameter}`);
    return 'unknown';
  }

  // Cek dari yang terburuk ke terbaik untuk prioritas
  if (value >= thresholds.danger.min && value <= thresholds.danger.max) {
    return 'danger';
  }
  if (value >= thresholds.critical.min && value <= thresholds.critical.max) {
    return 'critical';
  }
  if (value >= thresholds.warning.min && value <= thresholds.warning.max) {
    return 'warning';
  }
  if (value >= thresholds.normal.min && value <= thresholds.normal.max) {
    return 'normal';
  }

  // Jika di luar semua range, anggap danger
  return 'danger';
}

/**
 * Menghitung weighted score untuk semua parameter
 * SIMPLIFIED: Only 4 metrics
 * @param {Object} metrics - Object berisi semua parameter health
 * @returns {Object} Weighted score dan breakdown
 */
function hitungWeightedScore(metrics) {
  const breakdown = {
    cpu: { value: metrics.cpu?.persentase || 0, status: 'unknown', weight: PARAMETER_WEIGHTS.cpu },
    memori: { value: metrics.memori?.persentase || 0, status: 'unknown', weight: PARAMETER_WEIGHTS.memori },
    disk: { value: metrics.disk?.persentase || 0, status: 'unknown', weight: PARAMETER_WEIGHTS.disk },
    suhu: { value: metrics.suhu?.celsius || 0, status: 'unknown', weight: PARAMETER_WEIGHTS.suhu }
  };

  // Tentukan status setiap parameter
  breakdown.cpu.status = tentukanStatusParameter('cpu', breakdown.cpu.value);
  breakdown.memori.status = tentukanStatusParameter('memori', breakdown.memori.value);
  breakdown.disk.status = tentukanStatusParameter('disk', breakdown.disk.value);
  breakdown.suhu.status = tentukanStatusParameter('suhu', breakdown.suhu.value);

  // Hitung weighted score
  const statusWeights = { normal: 1, warning: 2, critical: 3, danger: 4, unknown: 2 };
  let totalScore = 0;
  let totalWeight = 0;

  Object.values(breakdown).forEach(param => {
    const weight = statusWeights[param.status] * param.weight;
    totalScore += weight;
    totalWeight += param.weight;
  });

  const averageScore = totalWeight > 0 ? totalScore / totalWeight : 2;

  return {
    score: averageScore,
    breakdown,
    totalScore,
    totalWeight
  };
}

/**
 * Menentukan status server akhir berdasarkan kombinasi parameter
 * @param {Object} metrics - Object berisi semua parameter health
 * @returns {Object} Status server dan detail analisis
 */
function tentukanStatusServer(metrics) {
  // Cek offline condition
  const timestamp = metrics.timestampPengumpulan || new Date();
  const now = new Date();
  const timeDiff = now - new Date(timestamp);

  if (timeDiff > HYSTERESIS_CONFIG.offline.hard) {
    return {
      status: 'OFFLINE',
      reason: 'Tidak ada data health dalam 15+ menit',
      confidence: 100,
      details: { timeDiff, lastUpdate: timestamp }
    };
  }

  if (timeDiff > HYSTERESIS_CONFIG.offline.soft) {
    return {
      status: 'WARNING',
      reason: 'Tidak ada data health dalam 5-15 menit',
      confidence: 80,
      details: { timeDiff, lastUpdate: timestamp }
    };
  }

  // Hitung weighted score
  const scoreData = hitungWeightedScore(metrics);

  // Analisis kondisi parameter
  const conditions = {
    normal: 0,
    warning: 0,
    critical: 0,
    danger: 0
  };

  Object.values(scoreData.breakdown).forEach(param => {
    if (param.status) {
      conditions[param.status]++;
    } else {
      // Untuk jaringan, hitung kedua sub-parameter
      conditions[param.latensi.status]++;
      conditions[param.throughput.status]++;
    }
  });

  // Logika kombinasi parameter
  let status = 'HEALTHY';
  let reason = '';
  let confidence = 100;

  // DANGER: Ada parameter danger ATAU CPU/Memory critical + 1+ warning
  if (conditions.danger > 0 ||
      (scoreData.breakdown.cpu.status === 'critical' && conditions.warning >= 1) ||
      (scoreData.breakdown.memori.status === 'critical' && conditions.warning >= 1)) {
    status = 'DANGER';
    reason = conditions.danger > 0 ? 'Ada parameter dalam kondisi danger' : 'CPU/Memory critical dengan parameter lain warning';
    confidence = 95;
  }
  // CRITICAL: CPU/Memory critical ATAU 2+ critical ATAU CPU/Memory warning + 1+ critical
  else if (scoreData.breakdown.cpu.status === 'critical' ||
           scoreData.breakdown.memori.status === 'critical' ||
           conditions.critical >= 2 ||
           ((scoreData.breakdown.cpu.status === 'warning' || scoreData.breakdown.memori.status === 'warning') && conditions.critical >= 1)) {
    status = 'CRITICAL';
    if (scoreData.breakdown.cpu.status === 'critical' || scoreData.breakdown.memori.status === 'critical') {
      reason = 'CPU atau Memory dalam kondisi critical';
    } else if (conditions.critical >= 2) {
      reason = `${conditions.critical} parameter dalam kondisi critical`;
    } else {
      reason = 'CPU/Memory warning dengan parameter lain critical';
    }
    confidence = 90;
  }
  // WARNING: 2+ warning ATAU 1 critical (non-CPU/Memory) ATAU CPU/Memory warning
  else if (conditions.warning >= 2 ||
           (conditions.critical >= 1 && scoreData.breakdown.cpu.status !== 'critical' && scoreData.breakdown.memori.status !== 'critical') ||
           scoreData.breakdown.cpu.status === 'warning' ||
           scoreData.breakdown.memori.status === 'warning') {
    status = 'WARNING';
    if (scoreData.breakdown.cpu.status === 'warning' || scoreData.breakdown.memori.status === 'warning') {
      reason = 'CPU atau Memory dalam kondisi warning';
    } else if (conditions.warning >= 2) {
      reason = `${conditions.warning} parameter dalam kondisi warning`;
    } else {
      reason = 'Parameter non-CPU/Memory dalam kondisi critical';
    }
    confidence = 85;
  }
  // HEALTHY: Default case
  else {
    reason = 'Semua parameter dalam kondisi normal';
    confidence = 100;
  }

  return {
    status,
    reason,
    confidence,
    details: {
      score: scoreData.score,
      conditions,
      breakdown: scoreData.breakdown,
      timeDiff,
      lastUpdate: timestamp
    }
  };
}

/**
 * Mengecek apakah status perlu diubah berdasarkan hysteresis
 * @param {string} currentStatus - Status saat ini
 * @param {string} newStatus - Status baru yang dihitung
 * @param {Array} recentStatuses - Array status terbaru untuk analisis trend
 * @param {Date} lastStatusChange - Waktu terakhir status berubah
 * @returns {Object} Keputusan apakah status berubah dan status baru
 */
function evaluasiHysteresis(currentStatus, newStatus, recentStatuses = [], lastStatusChange = new Date()) {
  const now = new Date();
  const timeSinceLastChange = now - new Date(lastStatusChange);

  // Jika status sama, tidak perlu perubahan
  if (currentStatus === newStatus) {
    return { shouldChange: false, newStatus: currentStatus, reason: 'Status stabil' };
  }

  const currentLevel = STATUS_LEVELS[currentStatus]?.level || 0;
  const newLevel = STATUS_LEVELS[newStatus]?.level || 0;

  // Upgrade status (memburuk) - immediate
  if (newLevel > currentLevel) {
    return {
      shouldChange: true,
      newStatus,
      reason: 'Status upgrade (immediate)',
      confidence: 100
    };
  }

  // Downgrade status (membaik) - dengan hysteresis
  if (newLevel < currentLevel) {
    const config = HYSTERESIS_CONFIG.downgrade[currentStatus];
    if (!config) {
      return { shouldChange: false, newStatus: currentStatus, reason: 'Konfigurasi hysteresis tidak ditemukan' };
    }

    // Cek time delay
    if (timeSinceLastChange < config.delay) {
      return {
        shouldChange: false,
        newStatus: currentStatus,
        reason: `Belum mencapai delay minimum (${config.delay / (60 * 1000)} menit)`
      };
    }

    // Cek konsistensi samples
    const recentCount = recentStatuses.filter(s => s === newStatus).length;
    if (recentCount < config.samples) {
      return {
        shouldChange: false,
        newStatus: currentStatus,
        reason: `Belum cukup samples konsisten (${recentCount}/${config.samples})`
      };
    }

    return {
      shouldChange: true,
      newStatus,
      reason: `Status downgrade setelah ${config.samples} samples konsisten`,
      confidence: 80
    };
  }

  // Status sama level tapi berbeda jenis (tidak seharusnya terjadi)
  return { shouldChange: false, newStatus: currentStatus, reason: 'Status sama level' };
}

/**
 * Mendapatkan rekomendasi berdasarkan status server
 * @param {string} status - Status server
 * @param {Object} details - Detail analisis status
 * @returns {Array} Array rekomendasi tindakan
 */
function dapatkanRekomendasi(status, details) {
  const rekomendasi = [];

  switch (status) {
    case 'HEALTHY':
      rekomendasi.push({
        priority: 'low',
        action: 'Monitor terus performa server',
        type: 'monitoring'
      });
      break;

    case 'WARNING':
      rekomendasi.push({
        priority: 'medium',
        action: 'Periksa parameter yang dalam kondisi warning',
        type: 'investigation'
      });

      if (details.breakdown.cpu.status === 'warning') {
        rekomendasi.push({
          priority: 'medium',
          action: 'Identifikasi proses yang menggunakan CPU tinggi',
          type: 'optimization'
        });
      }

      if (details.breakdown.memori.status === 'warning') {
        rekomendasi.push({
          priority: 'medium',
          action: 'Periksa memory leaks dan optimalkan penggunaan memory',
          type: 'optimization'
        });
      }
      break;

    case 'CRITICAL':
      rekomendasi.push({
        priority: 'high',
        action: 'Segera periksa parameter critical',
        type: 'immediate_action'
      });

      if (details.breakdown.cpu.status === 'critical') {
        rekomendasi.push({
          priority: 'high',
          action: 'Restart layanan yang menggunakan CPU berlebih',
          type: 'immediate_action'
        });
      }

      if (details.breakdown.memori.status === 'critical') {
        rekomendasi.push({
          priority: 'high',
          action: 'Restart aplikasi atau lakukan garbage collection',
          type: 'immediate_action'
        });
      }
      break;

    case 'DANGER':
      rekomendasi.push({
        priority: 'critical',
        action: 'Server dalam kondisi bahaya - siapkan failover',
        type: 'emergency'
      });

      rekomendasi.push({
        priority: 'critical',
        action: 'Evaluasi untuk restart server atau migrasi load',
        type: 'emergency'
      });
      break;

    case 'OFFLINE':
      rekomendasi.push({
        priority: 'critical',
        action: 'Periksa konektivitas dan status server',
        type: 'emergency'
      });

      rekomendasi.push({
        priority: 'critical',
        action: 'Aktifkan backup server jika tersedia',
        type: 'emergency'
      });
      break;
  }

  return rekomendasi;
}

module.exports = {
  THRESHOLDS,
  STATUS_LEVELS,
  PARAMETER_WEIGHTS,
  HYSTERESIS_CONFIG,
  tentukanStatusParameter,
  hitungWeightedScore,
  tentukanStatusServer,
  evaluasiHysteresis,
  dapatkanRekomendasi
};