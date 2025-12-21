// Model untuk Trend Metrik
// Schema MongoDB untuk menyimpan analisis trend performa server

const mongoose = require('mongoose');

/**
 * DESKRIPSI: Schema untuk menyimpan data trend metrik server
 *
 * TUJUAN: Menyimpan hasil analisis trend untuk mendukung AI predictions,
 * alerting prediktif, dan analisis pola performa jangka pendek.
 *
 * STRUKTUR DATA:
 * - Moving averages untuk smoothing
 * - Slope analysis untuk trend direction
 * - Seasonal patterns
 * - Prediction confidence
 *
 * RETENTION: 7 hari (168 jam)
 */
const metrikTrendSchema = new mongoose.Schema({
  // Referensi server
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: [true, 'Server ID wajib diisi'],
    index: true
  },

  // Periode analisis
  periodeAnalisis: {
    mulai: { type: Date, required: true, index: true },
    selesai: { type: Date, required: true },
    durasiJam: { type: Number, min: 1, max: 168 } // Max 7 hari
  },

  // Moving averages (smoothing)
  movingAverages: {
    cpu: {
      sma4: { type: Number, min: 0, max: 100 }, // Simple moving average 4 jam
      sma12: { type: Number, min: 0, max: 100 }, // SMA 12 jam
      ema4: { type: Number, min: 0, max: 100 },  // Exponential moving average 4 jam
      ema12: { type: Number, min: 0, max: 100 }  // EMA 12 jam
    },
    memori: {
      sma4: { type: Number, min: 0, max: 100 },
      sma12: { type: Number, min: 0, max: 100 },
      ema4: { type: Number, min: 0, max: 100 },
      ema12: { type: Number, min: 0, max: 100 }
    },
    disk: {
      sma4: { type: Number, min: 0, max: 100 },
      sma12: { type: Number, min: 0, max: 100 },
      ema4: { type: Number, min: 0, max: 100 },
      ema12: { type: Number, min: 0, max: 100 }
    },
    jaringan: {
      latensiSma4: { type: Number, min: 0 },
      latensiSma12: { type: Number, min: 0 },
      throughputSma4: { type: Number, min: 0 },
      throughputSma12: { type: Number, min: 0 }
    }
  },

  // Trend analysis
  trendAnalysis: {
    cpu: {
      slopePerJam: { type: Number }, // Rate of change per hour
      direction: { type: String, enum: ['strongly_increasing', 'increasing', 'stable', 'decreasing', 'strongly_decreasing'] },
      acceleration: { type: Number }, // Second derivative (rate of change of slope)
      confidence: { type: Number, min: 0, max: 100 },
      predictedValue1jam: { type: Number, min: 0, max: 100 },
      predictedValue6jam: { type: Number, min: 0, max: 100 },
      predictedValue24jam: { type: Number, min: 0, max: 100 }
    },
    memori: {
      slopePerJam: { type: Number },
      direction: { type: String, enum: ['strongly_increasing', 'increasing', 'stable', 'decreasing', 'strongly_decreasing'] },
      acceleration: { type: Number },
      confidence: { type: Number, min: 0, max: 100 },
      predictedValue1jam: { type: Number, min: 0, max: 100 },
      predictedValue6jam: { type: Number, min: 0, max: 100 },
      predictedValue24jam: { type: Number, min: 0, max: 100 }
    },
    disk: {
      slopePerJam: { type: Number },
      direction: { type: String, enum: ['strongly_increasing', 'increasing', 'stable', 'decreasing', 'strongly_decreasing'] },
      acceleration: { type: Number },
      confidence: { type: Number, min: 0, max: 100 },
      predictedValue1jam: { type: Number, min: 0, max: 100 },
      predictedValue6jam: { type: Number, min: 0, max: 100 },
      predictedValue24jam: { type: Number, min: 0, max: 100 }
    },
    jaringan: {
      latensiSlope: { type: Number },
      latensiDirection: { type: String, enum: ['improving', 'stable', 'degrading'] },
      throughputSlope: { type: Number },
      throughputDirection: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
      predictedLatensi1jam: { type: Number, min: 0 },
      predictedThroughput1jam: { type: Number, min: 0 }
    }
  },

  // Seasonal patterns
  seasonalPatterns: {
    daily: {
      peakHours: [{ type: Number, min: 0, max: 23 }], // Array of peak hours
      lowHours: [{ type: Number, min: 0, max: 23 }],  // Array of low hours
      weekendVsWeekday: {
        weekendHigher: { type: Boolean },
        differencePercent: { type: Number }
      }
    },
    weekly: {
      bestDay: { type: String, enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
      worstDay: { type: String, enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
      weekendPattern: { type: String, enum: ['higher', 'lower', 'similar'] }
    }
  },

  // Anomaly detection
  anomalyDetection: {
    detectedAnomalies: [{
      parameter: { type: String, enum: ['cpu', 'memori', 'disk', 'jaringan'] },
      timestamp: { type: Date },
      value: { type: Number },
      expectedValue: { type: Number },
      deviation: { type: Number }, // Standard deviations from mean
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      description: { type: String }
    }],
    overallAnomalyScore: { type: Number, min: 0, max: 100 },
    isAnomalousPeriod: { type: Boolean, default: false }
  },

  // Prediction confidence
  predictions: {
    failureRisk: {
      level: { type: String, enum: ['very_low', 'low', 'medium', 'high', 'very_high'] },
      confidence: { type: Number, min: 0, max: 100 },
      timeToFailure: { type: Number, min: 0 }, // Hours until predicted failure
      primaryCause: { type: String, enum: ['cpu', 'memori', 'disk', 'jaringan', 'unknown'] }
    },
    recommendations: [{
      type: { type: String, enum: ['immediate', 'short_term', 'long_term'] },
      priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      action: { type: String },
      expectedImpact: { type: String },
      confidence: { type: Number, min: 0, max: 100 }
    }]
  },

  // Metadata
  metadataTrend: {
    jumlahDataPoint: { type: Number, min: 0 },
    metodeAnalisis: { type: String, default: 'time_series_analysis' },
    algoritma: { type: String, default: 'linear_regression' },
    versiAnalyzer: { type: String, default: '1.0.0' },
    computationTimeMs: { type: Number, min: 0 }
  }

}, {
  timestamps: true,
  collection: 'metrik_trend'
});

/**
 * INDEXING STRATEGI
 */
metrikTrendSchema.index({ serverId: 1, 'periodeAnalisis.mulai': -1 }); // Primary query
metrikTrendSchema.index({ 'trendAnalysis.cpu.direction': 1, 'periodeAnalisis.mulai': -1 }); // Trend filtering
metrikTrendSchema.index({ 'anomalyDetection.isAnomalousPeriod': 1, 'periodeAnalisis.mulai': -1 }); // Anomaly queries
metrikTrendSchema.index({ 'predictions.failureRisk.level': 1, 'periodeAnalisis.mulai': -1 }); // Risk assessment
metrikTrendSchema.index({ 'periodeAnalisis.mulai': 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // TTL 7 hari

/**
 * VIRTUALS
 */
metrikTrendSchema.virtual('durasiAnalisisJam').get(function() {
  return (this.periodeAnalisis.selesai - this.periodeAnalisis.mulai) / (1000 * 60 * 60);
});

metrikTrendSchema.virtual('ringkasanPrediksi').get(function() {
  const pred = this.predictions.failureRisk;
  return {
    riskLevel: pred.level,
    confidence: pred.confidence,
    timeToFailure: pred.timeToFailure,
    primaryCause: pred.primaryCause,
    hasRecommendations: this.predictions.recommendations.length > 0
  };
});

/**
 * INSTANCE METHODS
 */
metrikTrendSchema.methods.isHighRisk = function() {
  const risk = this.predictions.failureRisk.level;
  return ['high', 'very_high'].includes(risk);
};

metrikTrendSchema.methods.getTopRecommendations = function(limit = 3) {
  return this.predictions.recommendations
    .sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, limit);
};

/**
 * STATIC METHODS
 */
metrikTrendSchema.statics.analyzeTrend = async function(serverId, hours = 24) {
  const Metrik = require('./Metrik');
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

  // Ambil data metrics untuk periode analisis
  const metrics = await Metrik.find({
    serverId,
    timestampPengumpulan: { $gte: startDate, $lte: endDate }
  }).sort({ timestampPengumpulan: 1 });

  if (metrics.length < 4) { // Minimum 4 data points untuk analisis
    throw new Error('Insufficient data for trend analysis');
  }

  // Hitung moving averages
  const movingAverages = this.calculateMovingAverages(metrics);

  // Analisis trend
  const trendAnalysis = this.analyzeTrends(metrics);

  // Deteksi seasonal patterns
  const seasonalPatterns = this.detectSeasonalPatterns(metrics);

  // Deteksi anomalies
  const anomalyDetection = this.detectAnomalies(metrics, movingAverages);

  // Buat predictions
  const predictions = this.generatePredictions(trendAnalysis, anomalyDetection);

  // Buat dokumen trend
  const trend = new this({
    serverId,
    periodeAnalisis: {
      mulai: startDate,
      selesai: endDate,
      durasiJam: hours
    },
    movingAverages,
    trendAnalysis,
    seasonalPatterns,
    anomalyDetection,
    predictions,
    metadataTrend: {
      jumlahDataPoint: metrics.length,
      computationTimeMs: Date.now() - endDate.getTime()
    }
  });

  await trend.save();
  return trend;
};

metrikTrendSchema.statics.calculateMovingAverages = function(metrics) {
  const calculateSMA = (values, period) => {
    const result = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result.length > 0 ? result[result.length - 1] : values[values.length - 1];
  };

  const calculateEMA = (values, period) => {
    const multiplier = 2 / (period + 1);
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = (values[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  };

  const cpuValues = metrics.map(m => m.cpu.persentase);
  const memoriValues = metrics.map(m => m.memori.persentase);
  const diskValues = metrics.map(m => m.disk.persentase);
  const latensiValues = metrics.map(m => m.jaringan.latensiMs);
  const throughputValues = metrics.map(m => m.jaringan.downloadMbps);

  return {
    cpu: {
      sma4: calculateSMA(cpuValues, Math.min(4, cpuValues.length)),
      sma12: calculateSMA(cpuValues, Math.min(12, cpuValues.length)),
      ema4: calculateEMA(cpuValues, Math.min(4, cpuValues.length)),
      ema12: calculateEMA(cpuValues, Math.min(12, cpuValues.length))
    },
    memori: {
      sma4: calculateSMA(memoriValues, Math.min(4, memoriValues.length)),
      sma12: calculateSMA(memoriValues, Math.min(12, memoriValues.length)),
      ema4: calculateEMA(memoriValues, Math.min(4, memoriValues.length)),
      ema12: calculateEMA(memoriValues, Math.min(12, memoriValues.length))
    },
    disk: {
      sma4: calculateSMA(diskValues, Math.min(4, diskValues.length)),
      sma12: calculateSMA(diskValues, Math.min(12, diskValues.length)),
      ema4: calculateEMA(diskValues, Math.min(4, diskValues.length)),
      ema12: calculateEMA(diskValues, Math.min(12, diskValues.length))
    },
    jaringan: {
      latensiSma4: calculateSMA(latensiValues, Math.min(4, latensiValues.length)),
      latensiSma12: calculateSMA(latensiValues, Math.min(12, latensiValues.length)),
      throughputSma4: calculateSMA(throughputValues, Math.min(4, throughputValues.length)),
      throughputSma12: calculateSMA(throughputValues, Math.min(12, throughputValues.length))
    }
  };
};

metrikTrendSchema.statics.analyzeTrends = function(metrics) {
  const analyzeParameter = (values, timestamps) => {
    if (values.length < 2) {
      return {
        slopePerJam: 0,
        direction: 'stable',
        acceleration: 0,
        confidence: 0,
        predictions: { '1': 0, '6': 0, '24': 0 }
      };
    }

    // Linear regression untuk slope
    const n = values.length;
    const hours = timestamps.map(t => (t - timestamps[0]) / (1000 * 60 * 60));

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    for (let i = 0; i < n; i++) {
      sumX += hours[i];
      sumY += values[i];
      sumXY += hours[i] * values[i];
      sumXX += hours[i] * hours[i];
      sumYY += values[i] * values[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared untuk confidence
    const yMean = sumY / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
      const predicted = slope * hours[i] + intercept;
      ssRes += Math.pow(values[i] - predicted, 2);
      ssTot += Math.pow(values[i] - yMean, 2);
    }
    const rSquared = 1 - (ssRes / ssTot);
    const confidence = Math.min(100, Math.max(0, rSquared * 100));

    // Tentukan direction
    let direction = 'stable';
    if (Math.abs(slope) > 2) direction = slope > 0 ? 'strongly_increasing' : 'strongly_decreasing';
    else if (Math.abs(slope) > 0.5) direction = slope > 0 ? 'increasing' : 'decreasing';

    // Predictions
    const currentValue = values[values.length - 1];
    const predicted1jam = Math.max(0, Math.min(100, currentValue + slope * 1));
    const predicted6jam = Math.max(0, Math.min(100, currentValue + slope * 6));
    const predicted24jam = Math.max(0, Math.min(100, currentValue + slope * 24));

    // Acceleration (second derivative approximation)
    const midIndex = Math.floor(n / 2);
    const firstHalfSlope = this.calculateSlope(values.slice(0, midIndex), hours.slice(0, midIndex));
    const secondHalfSlope = this.calculateSlope(values.slice(midIndex), hours.slice(midIndex));
    const acceleration = (secondHalfSlope - firstHalfSlope) / ((hours[midIndex] + hours[n-1]) / 2);

    return {
      slopePerJam: slope,
      direction,
      acceleration,
      confidence,
      predictedValue1jam: predicted1jam,
      predictedValue6jam: predicted6jam,
      predictedValue24jam: predicted24jam
    };
  };

  const timestamps = metrics.map(m => m.timestampPengumpulan);

  return {
    cpu: analyzeParameter(metrics.map(m => m.cpu.persentase), timestamps),
    memori: analyzeParameter(metrics.map(m => m.memori.persentase), timestamps),
    disk: analyzeParameter(metrics.map(m => m.disk.persentase), timestamps),
    jaringan: {
      latensiSlope: this.calculateSlope(metrics.map(m => m.jaringan.latensiMs), timestamps.map(t => (t - timestamps[0]) / (1000 * 60 * 60))),
      latensiDirection: 'stable', // Simplified
      throughputSlope: this.calculateSlope(metrics.map(m => m.jaringan.downloadMbps), timestamps.map(t => (t - timestamps[0]) / (1000 * 60 * 60))),
      throughputDirection: 'stable', // Simplified
      predictedLatensi1jam: metrics[metrics.length - 1].jaringan.latensiMs,
      predictedThroughput1jam: metrics[metrics.length - 1].jaringan.downloadMbps
    }
  };
};

metrikTrendSchema.statics.calculateSlope = function(values, hours) {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += hours[i];
    sumY += values[i];
    sumXY += hours[i] * values[i];
    sumXX += hours[i] * hours[i];
  }

  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
};

metrikTrendSchema.statics.detectSeasonalPatterns = function(metrics) {
  // Simplified seasonal analysis
  const hourlyUsage = new Array(24).fill(0).map(() => ({ cpu: [], memori: [], disk: [] }));

  metrics.forEach(metric => {
    const hour = metric.timestampPengumpulan.getHours();
    hourlyUsage[hour].cpu.push(metric.cpu.persentase);
    hourlyUsage[hour].memori.push(metric.memori.persentase);
    hourlyUsage[hour].disk.push(metric.disk.persentase);
  });

  // Calculate average per hour
  const hourlyAvg = hourlyUsage.map(hour => ({
    cpu: hour.cpu.length > 0 ? hour.cpu.reduce((a, b) => a + b, 0) / hour.cpu.length : 0,
    memori: hour.memori.length > 0 ? hour.memori.reduce((a, b) => a + b, 0) / hour.memori.length : 0,
    disk: hour.disk.length > 0 ? hour.disk.reduce((a, b) => a + b, 0) / hour.disk.length : 0
  }));

  // Find peak and low hours
  const cpuPeaks = hourlyAvg.map((h, i) => ({ value: h.cpu, hour: i }))
    .sort((a, b) => b.value - a.value).slice(0, 3).map(p => p.hour);

  const cpuLows = hourlyAvg.map((h, i) => ({ value: h.cpu, hour: i }))
    .sort((a, b) => a.value - b.value).slice(0, 3).map(p => p.hour);

  return {
    daily: {
      peakHours: cpuPeaks,
      lowHours: cpuLows,
      weekendVsWeekday: {
        weekendHigher: false, // Simplified
        differencePercent: 0
      }
    },
    weekly: {
      bestDay: 'monday', // Simplified
      worstDay: 'friday', // Simplified
      weekendPattern: 'similar'
    }
  };
};

metrikTrendSchema.statics.detectAnomalies = function(metrics, movingAverages) {
  const anomalies = [];
  let anomalyScore = 0;

  metrics.forEach((metric, index) => {
    const params = [
      { name: 'cpu', value: metric.cpu.persentase, avg: movingAverages.cpu.ema4 },
      { name: 'memori', value: metric.memori.persentase, avg: movingAverages.memori.ema4 },
      { name: 'disk', value: metric.disk.persentase, avg: movingAverages.disk.ema4 }
    ];

    params.forEach(param => {
      const deviation = Math.abs(param.value - param.avg);
      const stdDev = Math.sqrt(metrics.slice(0, index + 1)
        .map(m => {
          if (param.name === 'cpu') return m.cpu.persentase;
          if (param.name === 'memori') return m.memori.persentase;
          if (param.name === 'disk') return m.disk.persentase;
          return 0;
        })
        .reduce((acc, val) => acc + Math.pow(val - param.avg, 2), 0) / (index + 1));

      const zScore = stdDev > 0 ? deviation / stdDev : 0;

      if (zScore > 2) { // 2 standard deviations
        let severity = 'low';
        if (zScore > 3) severity = 'high';
        else if (zScore > 2.5) severity = 'medium';

        anomalies.push({
          parameter: param.name,
          timestamp: metric.timestampPengumpulan,
          value: param.value,
          expectedValue: param.avg,
          deviation: zScore,
          severity,
          description: `${param.name.toUpperCase()} anomaly detected: ${param.value}% (expected: ${param.avg.toFixed(1)}%)`
        });

        anomalyScore += zScore * 10; // Contribute to overall score
      }
    });
  });

  return {
    detectedAnomalies: anomalies,
    overallAnomalyScore: Math.min(100, anomalyScore),
    isAnomalousPeriod: anomalies.length > 0
  };
};

metrikTrendSchema.statics.generatePredictions = function(trendAnalysis, anomalyDetection) {
  // Simplified prediction logic
  const cpuTrend = trendAnalysis.cpu;
  const memoriTrend = trendAnalysis.memori;
  const diskTrend = trendAnalysis.disk;

  // Determine failure risk
  let failureRisk = 'very_low';
  let primaryCause = 'unknown';
  let timeToFailure = 168; // 7 days default
  let confidence = Math.min(cpuTrend.confidence, memoriTrend.confidence, diskTrend.confidence);

  // Check if any parameter will hit critical threshold soon
  const predictions = [
    { param: 'cpu', current: cpuTrend.predictedValue24jam, threshold: 80 },
    { param: 'memori', current: memoriTrend.predictedValue24jam, threshold: 85 },
    { param: 'disk', current: diskTrend.predictedValue24jam, threshold: 90 }
  ];

  const criticalPredictions = predictions.filter(p => p.current >= p.threshold);
  if (criticalPredictions.length > 0) {
    failureRisk = 'high';
    primaryCause = criticalPredictions[0].param;
    timeToFailure = 24; // 24 hours
  } else if (anomalyDetection.overallAnomalyScore > 50) {
    failureRisk = 'medium';
    timeToFailure = 72; // 3 days
  }

  // Generate recommendations
  const recommendations = [];
  if (cpuTrend.direction.includes('increasing') && cpuTrend.predictedValue6jam > 70) {
    recommendations.push({
      type: 'immediate',
      priority: 'high',
      action: 'Monitor CPU usage closely and identify high-consuming processes',
      expectedImpact: 'Prevent CPU overload',
      confidence: cpuTrend.confidence
    });
  }

  if (diskTrend.slopePerJam > 0.5) {
    recommendations.push({
      type: 'short_term',
      priority: 'medium',
      action: 'Clean up disk space and archive old files',
      expectedImpact: 'Slow down disk usage growth',
      confidence: diskTrend.confidence
    });
  }

  return {
    failureRisk: {
      level: failureRisk,
      confidence,
      timeToFailure,
      primaryCause
    },
    recommendations
  };
};

const MetrikTrend = mongoose.model('MetrikTrend', metrikTrendSchema);

module.exports = MetrikTrend;