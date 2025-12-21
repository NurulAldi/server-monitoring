// Model untuk Baseline Metrik
// Schema MongoDB untuk menyimpan baseline performa normal server

const mongoose = require('mongoose');

/**
 * DESKRIPSI: Schema untuk menyimpan baseline performa server
 *
 * TUJUAN: Menyimpan data baseline untuk mendukung anomaly detection,
 * alerting, dan analisis deviasi dari kondisi normal.
 *
 * STRUKTUR DATA:
 * - Statistical baselines (mean, std dev, percentiles)
 * - Time-based baselines (hourly, daily, weekly patterns)
 * - Seasonal adjustments
 * - Confidence intervals
 *
 * RETENTION: 90 hari (untuk historical baseline comparison)
 */
const metrikBaselineSchema = new mongoose.Schema({
  // Referensi server
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: [true, 'Server ID wajib diisi'],
    index: true
  },

  // Periode baseline
  periodeBaseline: {
    mulai: { type: Date, required: true, index: true },
    selesai: { type: Date, required: true },
    jumlahHari: { type: Number, min: 7, max: 90 }, // Minimum 1 minggu
    tipe: { type: String, enum: ['weekly', 'monthly', 'quarterly'], default: 'weekly' }
  },

  // Statistical baselines untuk setiap parameter
  statisticalBaselines: {
    cpu: {
      mean: { type: Number, min: 0, max: 100, required: true },
      median: { type: Number, min: 0, max: 100, required: true },
      stdDev: { type: Number, min: 0, required: true },
      min: { type: Number, min: 0, max: 100, required: true },
      max: { type: Number, min: 0, max: 100, required: true },
      percentiles: {
        p5: { type: Number, min: 0, max: 100 },
        p25: { type: Number, min: 0, max: 100 },
        p75: { type: Number, min: 0, max: 100 },
        p95: { type: Number, min: 0, max: 100 },
        p99: { type: Number, min: 0, max: 100 }
      },
      confidenceInterval: {
        lower95: { type: Number, min: 0, max: 100 },
        upper95: { type: Number, min: 0, max: 100 }
      }
    },
    memori: {
      mean: { type: Number, min: 0, max: 100, required: true },
      median: { type: Number, min: 0, max: 100, required: true },
      stdDev: { type: Number, min: 0, required: true },
      min: { type: Number, min: 0, max: 100, required: true },
      max: { type: Number, min: 0, max: 100, required: true },
      percentiles: {
        p5: { type: Number, min: 0, max: 100 },
        p25: { type: Number, min: 0, max: 100 },
        p75: { type: Number, min: 0, max: 100 },
        p95: { type: Number, min: 0, max: 100 },
        p99: { type: Number, min: 0, max: 100 }
      },
      confidenceInterval: {
        lower95: { type: Number, min: 0, max: 100 },
        upper95: { type: Number, min: 0, max: 100 }
      }
    },
    disk: {
      mean: { type: Number, min: 0, max: 100, required: true },
      median: { type: Number, min: 0, max: 100, required: true },
      stdDev: { type: Number, min: 0, required: true },
      min: { type: Number, min: 0, max: 100, required: true },
      max: { type: Number, min: 0, max: 100, required: true },
      percentiles: {
        p5: { type: Number, min: 0, max: 100 },
        p25: { type: Number, min: 0, max: 100 },
        p75: { type: Number, min: 0, max: 100 },
        p95: { type: Number, min: 0, max: 100 },
        p99: { type: Number, min: 0, max: 100 }
      },
      confidenceInterval: {
        lower95: { type: Number, min: 0, max: 100 },
        upper95: { type: Number, min: 0, max: 100 }
      }
    },
    jaringan: {
      latensi: {
        mean: { type: Number, min: 0, required: true },
        median: { type: Number, min: 0, required: true },
        stdDev: { type: Number, min: 0, required: true },
        percentiles: {
          p5: { type: Number, min: 0 },
          p25: { type: Number, min: 0 },
          p75: { type: Number, min: 0 },
          p95: { type: Number, min: 0 },
          p99: { type: Number, min: 0 }
        }
      },
      throughput: {
        mean: { type: Number, min: 0, required: true },
        median: { type: Number, min: 0, required: true },
        stdDev: { type: Number, min: 0, required: true },
        percentiles: {
          p5: { type: Number, min: 0 },
          p25: { type: Number, min: 0 },
          p75: { type: Number, min: 0 },
          p95: { type: Number, min: 0 },
          p99: { type: Number, min: 0 }
        }
      }
    }
  },

  // Time-based baselines (hourly patterns)
  timeBasedBaselines: {
    hourly: [{
      hour: { type: Number, min: 0, max: 23 },
      cpu: {
        mean: { type: Number, min: 0, max: 100 },
        stdDev: { type: Number, min: 0 }
      },
      memori: {
        mean: { type: Number, min: 0, max: 100 },
        stdDev: { type: Number, min: 0 }
      },
      disk: {
        mean: { type: Number, min: 0, max: 100 },
        stdDev: { type: Number, min: 0 }
      },
      jaringan: {
        latensiMean: { type: Number, min: 0 },
        throughputMean: { type: Number, min: 0 }
      }
    }],
    daily: {
      weekday: {
        cpu: { mean: { type: Number, min: 0, max: 100 }, stdDev: { type: Number, min: 0 } },
        memori: { mean: { type: Number, min: 0, max: 100 }, stdDev: { type: Number, min: 0 } },
        disk: { mean: { type: Number, min: 0, max: 100 }, stdDev: { type: Number, min: 0 } }
      },
      weekend: {
        cpu: { mean: { type: Number, min: 0, max: 100 }, stdDev: { type: Number, min: 0 } },
        memori: { mean: { type: Number, min: 0, max: 100 }, stdDev: { type: Number, min: 0 } },
        disk: { mean: { type: Number, min: 0, max: 100 }, stdDev: { type: Number, min: 0 } }
      }
    }
  },

  // Seasonal adjustments
  seasonalAdjustments: {
    monthly: {
      january: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      february: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      march: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      april: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      may: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      june: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      july: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      august: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      september: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      october: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      november: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      december: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } }
    },
    weekly: {
      monday: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      tuesday: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      wednesday: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      thursday: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      friday: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      saturday: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } },
      sunday: { adjustment: { type: Number }, confidence: { type: Number, min: 0, max: 100 } }
    }
  },

  // Anomaly thresholds
  anomalyThresholds: {
    cpu: {
      warning: { type: Number, min: 0, max: 100, default: 75 },
      critical: { type: Number, min: 0, max: 100, default: 90 },
      stdDevMultiplier: { type: Number, min: 1, max: 5, default: 2 }
    },
    memori: {
      warning: { type: Number, min: 0, max: 100, default: 80 },
      critical: { type: Number, min: 0, max: 100, default: 95 },
      stdDevMultiplier: { type: Number, min: 1, max: 5, default: 2 }
    },
    disk: {
      warning: { type: Number, min: 0, max: 100, default: 85 },
      critical: { type: Number, min: 0, max: 100, default: 95 },
      stdDevMultiplier: { type: Number, min: 1, max: 5, default: 2 }
    },
    jaringan: {
      latensiWarning: { type: Number, min: 0, default: 100 }, // ms
      latensiCritical: { type: Number, min: 0, default: 500 }, // ms
      throughputWarning: { type: Number, min: 0, default: 10 }, // Mbps
      throughputCritical: { type: Number, min: 0, default: 1 } // Mbps
    }
  },

  // Metadata
  metadataBaseline: {
    jumlahDataPoint: { type: Number, min: 0, required: true },
    metodePerhitungan: { type: String, default: 'robust_statistics' },
    algoritma: { type: String, default: 'percentile_based' },
    versiCalculator: { type: String, default: '1.0.0' },
    computationTimeMs: { type: Number, min: 0 },
    dataQuality: {
      completeness: { type: Number, min: 0, max: 100 }, // % data yang tersedia
      consistency: { type: Number, min: 0, max: 100 }, // % data yang konsisten
      accuracy: { type: Number, min: 0, max: 100 } // % data yang akurat
    }
  }

}, {
  timestamps: true,
  collection: 'metrik_baseline'
});

/**
 * INDEXING STRATEGI
 */
metrikBaselineSchema.index({ serverId: 1, 'periodeBaseline.mulai': -1 }); // Primary query
metrikBaselineSchema.index({ 'periodeBaseline.tipe': 1, 'periodeBaseline.mulai': -1 }); // Type filtering
metrikBaselineSchema.index({ 'periodeBaseline.mulai': 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL 90 hari

/**
 * VIRTUALS
 */
metrikBaselineSchema.virtual('isValid').get(function() {
  const quality = this.metadataBaseline.dataQuality;
  return quality.completeness >= 80 && quality.consistency >= 80 && quality.accuracy >= 80;
});

metrikBaselineSchema.virtual('confidenceScore').get(function() {
  const quality = this.metadataBaseline.dataQuality;
  return (quality.completeness + quality.consistency + quality.accuracy) / 3;
});

/**
 * INSTANCE METHODS
 */
metrikBaselineSchema.methods.isAnomaly = function(parameter, value) {
  const baseline = this.statisticalBaselines[parameter];
  if (!baseline) return false;

  const thresholds = this.anomalyThresholds[parameter];
  if (!thresholds) return false;

  // Check against statistical thresholds
  const stdDevThreshold = baseline.mean + (thresholds.stdDevMultiplier * baseline.stdDev);
  const percentileThreshold = baseline.percentiles.p95;

  return value > Math.max(stdDevThreshold, percentileThreshold);
};

metrikBaselineSchema.methods.getExpectedRange = function(parameter, confidence = 95) {
  const baseline = this.statisticalBaselines[parameter];
  if (!baseline) return null;

  if (confidence === 95) {
    return {
      lower: baseline.confidenceInterval.lower95,
      upper: baseline.confidenceInterval.upper95,
      mean: baseline.mean,
      median: baseline.median
    };
  }

  // For other confidence levels, calculate based on percentiles
  return {
    lower: baseline.percentiles.p5,
    upper: baseline.percentiles.p95,
    mean: baseline.mean,
    median: baseline.median
  };
};

metrikBaselineSchema.methods.getSeasonalAdjustment = function(date) {
  const month = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const day = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  const monthlyAdj = this.seasonalAdjustments.monthly[month];
  const weeklyAdj = this.seasonalAdjustments.weekly[day];

  return {
    monthly: monthlyAdj ? monthlyAdj.adjustment : 0,
    weekly: weeklyAdj ? weeklyAdj.adjustment : 0,
    combined: (monthlyAdj ? monthlyAdj.adjustment : 0) + (weeklyAdj ? weeklyAdj.adjustment : 0)
  };
};

/**
 * STATIC METHODS
 */
metrikBaselineSchema.statics.calculateBaseline = async function(serverId, days = 30, type = 'weekly') {
  const Metrik = require('./Metrik');
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  // Ambil data metrics untuk periode baseline
  const metrics = await Metrik.find({
    serverId,
    timestampPengumpulan: { $gte: startDate, $lte: endDate }
  }).sort({ timestampPengumpulan: 1 });

  if (metrics.length < 100) { // Minimum 100 data points untuk baseline yang reliable
    throw new Error('Insufficient data for baseline calculation');
  }

  // Hitung statistical baselines
  const statisticalBaselines = this.calculateStatisticalBaselines(metrics);

  // Hitung time-based baselines
  const timeBasedBaselines = this.calculateTimeBasedBaselines(metrics);

  // Hitung seasonal adjustments
  const seasonalAdjustments = this.calculateSeasonalAdjustments(metrics);

  // Hitung data quality
  const dataQuality = this.assessDataQuality(metrics);

  // Buat dokumen baseline
  const baseline = new this({
    serverId,
    periodeBaseline: {
      mulai: startDate,
      selesai: endDate,
      jumlahHari: days,
      tipe: type
    },
    statisticalBaselines,
    timeBasedBaselines,
    seasonalAdjustments,
    metadataBaseline: {
      jumlahDataPoint: metrics.length,
      computationTimeMs: Date.now() - endDate.getTime(),
      dataQuality
    }
  });

  await baseline.save();
  return baseline;
};

metrikBaselineSchema.statics.calculateStatisticalBaselines = function(metrics) {
  const calculateStats = (values) => {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    // Mean
    const mean = values.reduce((a, b) => a + b, 0) / n;

    // Median
    const median = n % 2 === 0
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2
      : sorted[Math.floor(n/2)];

    // Standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Percentiles
    const getPercentile = (p) => {
      const index = (p / 100) * (n - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index % 1;

      if (upper >= n) return sorted[n - 1];
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    // Confidence interval (95%)
    const zScore = 1.96; // 95% confidence
    const margin = zScore * (stdDev / Math.sqrt(n));
    const lower95 = Math.max(0, mean - margin);
    const upper95 = Math.min(100, mean + margin);

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[n - 1],
      percentiles: {
        p5: getPercentile(5),
        p25: getPercentile(25),
        p75: getPercentile(75),
        p95: getPercentile(95),
        p99: getPercentile(99)
      },
      confidenceInterval: {
        lower95,
        upper95
      }
    };
  };

  const cpuValues = metrics.map(m => m.cpu.persentase);
  const memoriValues = metrics.map(m => m.memori.persentase);
  const diskValues = metrics.map(m => m.disk.persentase);
  const latensiValues = metrics.map(m => m.jaringan.latensiMs);
  const throughputValues = metrics.map(m => m.jaringan.downloadMbps);

  return {
    cpu: calculateStats(cpuValues),
    memori: calculateStats(memoriValues),
    disk: calculateStats(diskValues),
    jaringan: {
      latensi: calculateStats(latensiValues),
      throughput: calculateStats(throughputValues)
    }
  };
};

metrikBaselineSchema.statics.calculateTimeBasedBaselines = function(metrics) {
  // Hourly baselines
  const hourlyData = new Array(24).fill().map(() => ({
    cpu: [], memori: [], disk: [], latensi: [], throughput: []
  }));

  metrics.forEach(metric => {
    const hour = metric.timestampPengumpulan.getHours();
    hourlyData[hour].cpu.push(metric.cpu.persentase);
    hourlyData[hour].memori.push(metric.memori.persentase);
    hourlyData[hour].disk.push(metric.disk.persentase);
    hourlyData[hour].latensi.push(metric.jaringan.latensiMs);
    hourlyData[hour].throughput.push(metric.jaringan.downloadMbps);
  });

  const hourly = hourlyData.map((hourData, hour) => ({
    hour,
    cpu: {
      mean: hourData.cpu.length > 0 ? hourData.cpu.reduce((a, b) => a + b, 0) / hourData.cpu.length : 0,
      stdDev: hourData.cpu.length > 1 ? Math.sqrt(hourData.cpu.reduce((acc, val) => {
        const mean = hourData.cpu.reduce((a, b) => a + b, 0) / hourData.cpu.length;
        return acc + Math.pow(val - mean, 2);
      }, 0) / hourData.cpu.length) : 0
    },
    memori: {
      mean: hourData.memori.length > 0 ? hourData.memori.reduce((a, b) => a + b, 0) / hourData.memori.length : 0,
      stdDev: hourData.memori.length > 1 ? Math.sqrt(hourData.memori.reduce((acc, val) => {
        const mean = hourData.memori.reduce((a, b) => a + b, 0) / hourData.memori.length;
        return acc + Math.pow(val - mean, 2);
      }, 0) / hourData.memori.length) : 0
    },
    disk: {
      mean: hourData.disk.length > 0 ? hourData.disk.reduce((a, b) => a + b, 0) / hourData.disk.length : 0,
      stdDev: hourData.disk.length > 1 ? Math.sqrt(hourData.disk.reduce((acc, val) => {
        const mean = hourData.disk.reduce((a, b) => a + b, 0) / hourData.disk.length;
        return acc + Math.pow(val - mean, 2);
      }, 0) / hourData.disk.length) : 0
    },
    jaringan: {
      latensiMean: hourData.latensi.length > 0 ? hourData.latensi.reduce((a, b) => a + b, 0) / hourData.latensi.length : 0,
      throughputMean: hourData.throughput.length > 0 ? hourData.throughput.reduce((a, b) => a + b, 0) / hourData.throughput.length : 0
    }
  }));

  // Daily baselines (weekday vs weekend)
  const weekdayData = { cpu: [], memori: [], disk: [] };
  const weekendData = { cpu: [], memori: [], disk: [] };

  metrics.forEach(metric => {
    const day = metric.timestampPengumpulan.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;

    const target = isWeekend ? weekendData : weekdayData;
    target.cpu.push(metric.cpu.persentase);
    target.memori.push(metric.memori.persentase);
    target.disk.push(metric.disk.persentase);
  });

  const calculateDailyStats = (data) => ({
    mean: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
    stdDev: data.length > 1 ? Math.sqrt(data.reduce((acc, val) => {
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      return acc + Math.pow(val - mean, 2);
    }, 0) / data.length) : 0
  });

  const daily = {
    weekday: {
      cpu: calculateDailyStats(weekdayData.cpu),
      memori: calculateDailyStats(weekdayData.memori),
      disk: calculateDailyStats(weekdayData.disk)
    },
    weekend: {
      cpu: calculateDailyStats(weekendData.cpu),
      memori: calculateDailyStats(weekendData.memori),
      disk: calculateDailyStats(weekendData.disk)
    }
  };

  return { hourly, daily };
};

metrikBaselineSchema.statics.calculateSeasonalAdjustments = function(metrics) {
  // Simplified seasonal analysis
  const monthlyData = new Array(12).fill().map(() => ({ cpu: [], memori: [], disk: [] }));
  const weeklyData = new Array(7).fill().map(() => ({ cpu: [], memori: [], disk: [] }));

  metrics.forEach(metric => {
    const month = metric.timestampPengumpulan.getMonth(); // 0-11
    const day = metric.timestampPengumpulan.getDay(); // 0-6

    monthlyData[month].cpu.push(metric.cpu.persentase);
    monthlyData[month].memori.push(metric.memori.persentase);
    monthlyData[month].disk.push(metric.disk.persentase);

    weeklyData[day].cpu.push(metric.cpu.persentase);
    weeklyData[day].memori.push(metric.memori.persentase);
    weeklyData[day].disk.push(metric.disk.persentase);
  });

  // Calculate overall mean
  const overallCpu = metrics.map(m => m.cpu.persentase);
  const overallMean = overallCpu.reduce((a, b) => a + b, 0) / overallCpu.length;

  // Monthly adjustments
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                     'july', 'august', 'september', 'october', 'november', 'december'];

  const monthly = {};
  monthNames.forEach((month, index) => {
    const data = monthlyData[index];
    const mean = data.cpu.length > 0 ? data.cpu.reduce((a, b) => a + b, 0) / data.cpu.length : overallMean;
    monthly[month] = {
      adjustment: mean - overallMean,
      confidence: data.cpu.length > 10 ? 90 : Math.max(50, (data.cpu.length / 10) * 90)
    };
  });

  // Weekly adjustments
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const weekly = {};
  dayNames.forEach((day, index) => {
    const data = weeklyData[index];
    const mean = data.cpu.length > 0 ? data.cpu.reduce((a, b) => a + b, 0) / data.cpu.length : overallMean;
    weekly[day] = {
      adjustment: mean - overallMean,
      confidence: data.cpu.length > 10 ? 90 : Math.max(50, (data.cpu.length / 10) * 90)
    };
  });

  return { monthly, weekly };
};

metrikBaselineSchema.statics.assessDataQuality = function(metrics) {
  const totalPoints = metrics.length;
  let completePoints = 0;
  let consistentPoints = 0;
  let accuratePoints = 0;

  metrics.forEach(metric => {
    // Completeness check
    if (metric.cpu && metric.memori && metric.disk && metric.jaringan) {
      completePoints++;
    }

    // Consistency check (values within reasonable ranges)
    const isConsistent = (
      metric.cpu.persentase >= 0 && metric.cpu.persentase <= 100 &&
      metric.memori.persentase >= 0 && metric.memori.persentase <= 100 &&
      metric.disk.persentase >= 0 && metric.disk.persentase <= 100 &&
      metric.jaringan.latensiMs >= 0 &&
      metric.jaringan.downloadMbps >= 0
    );

    if (isConsistent) {
      consistentPoints++;
    }

    // Accuracy check (no extreme outliers)
    const isAccurate = (
      metric.cpu.persentase < 200 && // Allow some buffer for measurement errors
      metric.memori.persentase < 200 &&
      metric.disk.persentase < 200 &&
      metric.jaringan.latensiMs < 10000 && // 10 seconds max
      metric.jaringan.downloadMbps < 10000 // 10 Gbps max
    );

    if (isAccurate) {
      accuratePoints++;
    }
  });

  return {
    completeness: (completePoints / totalPoints) * 100,
    consistency: (consistentPoints / totalPoints) * 100,
    accuracy: (accuratePoints / totalPoints) * 100
  };
};

const MetrikBaseline = mongoose.model('MetrikBaseline', metrikBaselineSchema);

module.exports = MetrikBaseline;