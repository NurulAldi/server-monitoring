// Layanan Generator Data Dummy untuk Health Server
// Mengimplementasikan mekanisme simulasi data kesehatan server yang realistis

const Metrik = require('../model/Metrik');
const Server = require('../model/Server');
const { logger } = require('../utilitas/logger');
const { THRESHOLD_DEFAULT, INTERVAL_GENERATOR } = require('../utilitas/konstanta');

// Import layanan status server menggunakan lazy loading untuk menghindari circular dependency
let layananStatusServer = null;
function getLayananStatusServer() {
  if (!layananStatusServer) {
    layananStatusServer = require('./layananStatusServer');
  }
  return layananStatusServer;
}

/**
 * DESKRIPSI: State machine untuk kondisi kesehatan server
 *
 * TUJUAN: Mengelola transisi kondisi server secara realistis
 */
class KondisiServer {
  constructor(serverId) {
    this.serverId = serverId;
    this.kondisi = 'NORMAL'; // NORMAL, WARNING, CRITICAL
    this.lastTransition = new Date();
    this.baseline = this.getBaselineAwal();
    this.trend = {
      cpu: 0,
      memori: 0,
      disk: 0.001 // Growth rate 0.1% per jam
    };
    this.spikeActive = false;
    this.spikeEndTime = null;
  }

  getBaselineAwal() {
    return {
      cpu: this.randomBetween(10, 30),
      memori: this.randomBetween(30, 50),
      disk: this.randomBetween(40, 60),
      suhu: this.randomBetween(40, 55)
    };
  }

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  // State machine transisi
  updateKondisi(metrics) {
    const sekarang = new Date();
    const waktuSejakTransisi = (sekarang - this.lastTransition) / (1000 * 60); // dalam menit

    // Hitung skor kesehatan
    const skorKesehatan = this.hitungSkorKesehatan(metrics);

    let kondisiBaru = this.kondisi;

    if (this.kondisi === 'NORMAL') {
      if (skorKesehatan > 70) kondisiBaru = 'WARNING';
    } else if (this.kondisi === 'WARNING') {
      if (skorKesehatan > 85) kondisiBaru = 'CRITICAL';
      else if (skorKesehatan < 40 && waktuSejakTransisi > 10) kondisiBaru = 'NORMAL';
    } else if (this.kondisi === 'CRITICAL') {
      if (skorKesehatan < 60 && waktuSejakTransisi > 15) kondisiBaru = 'WARNING';
      else if (skorKesehatan < 30 && waktuSejakTransisi > 30) kondisiBaru = 'NORMAL';
    }

    if (kondisiBaru !== this.kondisi) {
      this.kondisi = kondisiBaru;
      this.lastTransition = sekarang;
      logger.logSystem('SERVER_CONDITION_CHANGED', {
        serverId: this.serverId,
        from: kondisiBaru === 'NORMAL' ? this.kondisi : kondisiBaru,
        to: kondisiBaru,
        healthScore: skorKesehatan
      });
    }

    return this.kondisi;
  }

  hitungSkorKesehatan(metrics) {
    // Skor berdasarkan threshold breach - SIMPLIFIED to 4 metrics
    let skor = 0;

    if (metrics.cpu > THRESHOLD_DEFAULT.CPU_CRITICAL) skor += 30;
    else if (metrics.cpu > THRESHOLD_DEFAULT.CPU_WARNING) skor += 15;

    if (metrics.memori > THRESHOLD_DEFAULT.MEMORI_CRITICAL) skor += 30;
    else if (metrics.memori > THRESHOLD_DEFAULT.MEMORI_WARNING) skor += 15;

    if (metrics.disk > THRESHOLD_DEFAULT.DISK_CRITICAL) skor += 25;
    else if (metrics.disk > THRESHOLD_DEFAULT.DISK_WARNING) skor += 12;

    if (metrics.suhu > 85) skor += 15; // Critical temperature
    else if (metrics.suhu > 75) skor += 8; // Warning temperature

    return skor;
  }

  // Update trend berdasarkan kondisi
  updateTrend() {
    const jam = new Date().getHours();
    const hari = new Date().getDay();

    // Seasonal adjustment
    const seasonalFactor = this.getSeasonalFactor(jam, hari);

    // Update trend berdasarkan kondisi - SIMPLIFIED
    if (this.kondisi === 'NORMAL') {
      this.trend.cpu = this.randomBetween(-0.5, 0.5) * seasonalFactor;
      this.trend.memori = this.randomBetween(-0.3, 0.3) * seasonalFactor;
    } else if (this.kondisi === 'WARNING') {
      this.trend.cpu = this.randomBetween(0.5, 1.5) * seasonalFactor;
      this.trend.memori = this.randomBetween(0.3, 1.0) * seasonalFactor;
    } else if (this.kondisi === 'CRITICAL') {
      this.trend.cpu = this.randomBetween(1.0, 3.0) * seasonalFactor;
      this.trend.memori = this.randomBetween(0.8, 2.0) * seasonalFactor;
    }
  }

  getSeasonalFactor(jam, hari) {
    // Peak hours: 8-18, weekdays
    if (hari >= 1 && hari <= 5 && jam >= 8 && jam <= 18) {
      return 1.5; // 50% lebih tinggi saat jam kerja
    }
    return 1.0;
  }

  // Generate spike event
  checkSpikeEvent() {
    if (!this.spikeActive && Math.random() < 0.05) { // 5% chance per interval
      this.spikeActive = true;
      this.spikeEndTime = new Date(Date.now() + this.randomBetween(3, 15) * 60 * 1000); // 3-15 menit
      return true;
    }

    if (this.spikeActive && new Date() > this.spikeEndTime) {
      this.spikeActive = false;
      this.spikeEndTime = null;
    }

    return this.spikeActive;
  }
}

/**
 * DESKRIPSI: Generator data metrik server
 *
 * TUJUAN: Menghasilkan data simulasi kesehatan server yang realistis
 */
class GeneratorDataMetrik {
  constructor() {
    this.serverStates = new Map(); // serverId -> KondisiServer
    this.lastGenerated = new Map(); // serverId -> timestamp
    this.baselineHistory = new Map(); // serverId -> array of recent baselines
  }

  /**
   * Generate data metrik untuk server tertentu
   */
  async generateDataMetrik(serverId) {
    try {
      // Dapatkan info server
      const server = await Server.findById(serverId);
      if (!server) {
        throw new Error(`Server dengan ID ${serverId} tidak ditemukan`);
      }

      // Inisialisasi state server jika belum ada
      if (!this.serverStates.has(serverId)) {
        this.serverStates.set(serverId, new KondisiServer(serverId));
        this.baselineHistory.set(serverId, []);
      }

      const kondisiServer = this.serverStates.get(serverId);

      // Update trend dan cek spike
      kondisiServer.updateTrend();
      const spikeActive = kondisiServer.checkSpikeEvent();

      // Generate metrics berdasarkan kondisi
      const metrics = this.generateMetrics(kondisiServer, spikeActive);

      // Update kondisi berdasarkan metrics yang dihasilkan
      const kondisiBaru = kondisiServer.updateKondisi(metrics);

      // Tentukan status kesehatan
      let statusKesehatan = 'OK';
      if (kondisiBaru === 'WARNING') statusKesehatan = 'Warning';
      else if (kondisiBaru === 'CRITICAL') statusKesehatan = 'Critical';

      // Buat objek metrik - SIMPLIFIED to 4 core metrics
      const dataMetrik = {
        serverId: serverId,
        timestampPengumpulan: new Date(),

        // CPU
        cpu: {
          persentase: Math.min(100, Math.max(0, metrics.cpu))
        },

        // Memory (RAM)
        memori: {
          persentase: Math.min(100, Math.max(0, metrics.memori)),
          digunakan: Math.round((metrics.memori / 100) * (server.spesifikasi?.memori?.kapasitas || 8192)),
          total: server.spesifikasi?.memori?.kapasitas || 8192
        },

        // Disk
        disk: {
          persentase: Math.min(100, Math.max(0, metrics.disk)),
          digunakan: Math.round((metrics.disk / 100) * (server.spesifikasi?.disk?.kapasitas || 512000)),
          total: server.spesifikasi?.disk?.kapasitas || 512000
        },

        // Temperature
        suhu: {
          celsius: Math.min(100, Math.max(20, metrics.suhu))
        },

        // Status kesehatan
        statusKesehatan: statusKesehatan,

        // Metadata
        metadataPengumpulan: {
          durasiResponseMs: this.randomBetween(50, 200),
          metodePengumpulan: 'agent',
          versiAgent: '2.0.0',
          zonaWaktu: 'Asia/Jakarta'
        }
      };

      // Simpan ke database
      const metrikBaru = new Metrik(dataMetrik);
      await metrikBaru.save();

      // TRIGGER ALERT EVALUATION - Evaluasi kondisi alert setelah metrics tersimpan
      try {
        const layananAlert = require('./layananAlert');
        await layananAlert.evaluasiKondisiAlert(serverId, dataMetrik);
        logger.debug(`Alert evaluation triggered untuk server ${serverId} setelah data generation`);
      } catch (alertError) {
        logger.error(`Failed to trigger alert evaluation untuk server ${serverId}:`, alertError);
        // Don't fail the entire operation if alert evaluation fails
      }

      // TRIGGER STATUS EVALUATION - Langkah 3: Evaluasi status server setelah data tersimpan
      try {
        const statusService = getLayananStatusServer();
        await statusService.updateStatusServer(serverId);
        logger.debug(`Status evaluation triggered untuk server ${serverId} setelah data generation`);
      } catch (statusError) {
        logger.error(`Failed to trigger status evaluation untuk server ${serverId}:`, statusError);
        // Don't fail the entire operation if status evaluation fails
      }

      // Update history untuk baseline
      this.updateBaselineHistory(serverId, metrics);

      // Log aktivitas
      logger.logSystem('METRICS_GENERATED', {
        serverId: serverId,
        serverName: server.nama,
        condition: kondisiBaru,
        healthStatus: statusKesehatan,
        cpu: metrics.cpu,
        memory: metrics.memori,
        disk: metrics.disk,
        temperature: metrics.suhu
      });

      return {
        success: true,
        metrikId: metrikBaru._id,
        kondisi: kondisiBaru,
        statusKesehatan: statusKesehatan,
        data: dataMetrik
      };

    } catch (error) {
      logger.logError('METRICS_GENERATION_FAILED', error, { serverId });
      throw error;
    }
  }

  /**
   * Generate nilai metrics berdasarkan kondisi server
   * SIMPLIFIED: Only CPU, RAM, Disk, Temperature
   */
  generateMetrics(kondisiServer, spikeActive) {
    const baseline = kondisiServer.baseline;
    const kondisi = kondisiServer.kondisi;

    // Base values berdasarkan kondisi
    let cpuBase, memoriBase, diskBase, suhuBase;

    if (kondisi === 'NORMAL') {
      cpuBase = this.randomBetween(10, 50);
      memoriBase = this.randomBetween(30, 60);
      diskBase = baseline.disk + kondisiServer.trend.disk; // Gradual growth
      suhuBase = this.randomBetween(40, 60); // Normal temperature range
    } else if (kondisi === 'WARNING') {
      cpuBase = this.randomBetween(60, 80);
      memoriBase = this.randomBetween(70, 85);
      diskBase = this.randomBetween(80, 90);
      suhuBase = this.randomBetween(65, 75); // Elevated temperature
    } else if (kondisi === 'CRITICAL') {
      cpuBase = this.randomBetween(85, 100);
      memoriBase = this.randomBetween(90, 100);
      diskBase = this.randomBetween(95, 100);
      suhuBase = this.randomBetween(80, 95); // High temperature
    }

    // Apply trend
    cpuBase += kondisiServer.trend.cpu;
    memoriBase += kondisiServer.trend.memori;

    // Apply spike jika aktif
    if (spikeActive) {
      const spikeMultiplier = this.randomBetween(1.2, 1.5);
      cpuBase *= spikeMultiplier;
      memoriBase *= spikeMultiplier;
      suhuBase *= 1.1; // Temperature increases with spike
    }

    // Add random noise (±5-10%)
    const noise = 0.05;
    cpuBase += cpuBase * (Math.random() - 0.5) * noise * 2;
    memoriBase += memoriBase * (Math.random() - 0.5) * noise * 2;
    suhuBase += suhuBase * (Math.random() - 0.5) * noise * 2;

    // Apply correlation (CPU dan Memory biasanya berhubungan)
    if (cpuBase > 70) {
      memoriBase = Math.min(100, memoriBase + this.randomBetween(5, 15));
      suhuBase += this.randomBetween(5, 10); // High CPU increases temperature
    }

    // Seasonal adjustment
    const jam = new Date().getHours();
    if (jam >= 8 && jam <= 18) { // Business hours
      cpuBase *= 1.2;
      memoriBase *= 1.1;
    }

    return {
      cpu: Math.min(100, Math.max(0, cpuBase)),
      memori: Math.min(100, Math.max(0, memoriBase)),
      disk: Math.min(100, Math.max(0, diskBase)),
      suhu: Math.min(100, Math.max(20, suhuBase)) // Temperature in Celsius
    };
  }

  /**
   * Update baseline history untuk analisis trend
   */
  updateBaselineHistory(serverId, metrics) {
    const history = this.baselineHistory.get(serverId) || [];
    history.push({
      timestamp: new Date(),
      metrics: { ...metrics }
    });

    // Keep only last 24 hours (assuming 1 sample per minute = 1440 samples)
    if (history.length > 1440) {
      history.shift();
    }

    this.baselineHistory.set(serverId, history);
  }

  /**
   * Get baseline moving average - SIMPLIFIED to 4 metrics
   */
  getBaselineMovingAverage(serverId, hours = 24) {
    const history = this.baselineHistory.get(serverId) || [];
    if (history.length === 0) return null;

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentHistory = history.filter(h => h.timestamp > cutoff);

    if (recentHistory.length === 0) return null;

    const sum = recentHistory.reduce((acc, h) => ({
      cpu: acc.cpu + h.metrics.cpu,
      memori: acc.memori + h.metrics.memori,
      disk: acc.disk + h.metrics.disk,
      suhu: acc.suhu + h.metrics.suhu
    }), { cpu: 0, memori: 0, disk: 0, suhu: 0 });

    return {
      cpu: sum.cpu / recentHistory.length,
      memori: sum.memori / recentHistory.length,
      disk: sum.disk / recentHistory.length,
      suhu: sum.suhu / recentHistory.length
    };
  }

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }
}

// Export instance singleton
const generatorDataMetrik = new GeneratorDataMetrik();

module.exports = {
  GeneratorDataMetrik,
  generatorDataMetrik,

  /**
   * Generate data metrik untuk satu server
   */
  async generateDataMetrikServer(serverId) {
    return await generatorDataMetrik.generateDataMetrik(serverId);
  },

  /**
   * Generate data metrik untuk semua server aktif
   */
  async generateDataSemuaServer() {
    try {
      const servers = await Server.find({ statusAktif: true });
      const results = [];

      for (const server of servers) {
        try {
          const result = await generatorDataMetrik.generateDataMetrik(server._id);
          results.push(result);
        } catch (error) {
          logger.logError('BATCH_METRICS_GENERATION_FAILED', error, {
            serverId: server._id,
            serverName: server.nama
          });
        }
      }

      logger.logSystem('BATCH_METRICS_GENERATION_COMPLETED', {
        totalServers: servers.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      });

      return {
        success: true,
        totalServers: servers.length,
        results: results
      };

    } catch (error) {
      logger.logError('BATCH_METRICS_GENERATION_FAILED', error);
      throw error;
    }
  },

  /**
   * Reset state server (untuk testing)
   */
  resetServerState(serverId) {
    generatorDataMetrik.serverStates.delete(serverId);
    generatorDataMetrik.lastGenerated.delete(serverId);
    generatorDataMetrik.baselineHistory.delete(serverId);
  },

  /**
   * Force kondisi server (untuk testing)
   */
  forceServerCondition(serverId, condition) {
    if (generatorDataMetrik.serverStates.has(serverId)) {
      const state = generatorDataMetrik.serverStates.get(serverId);
      state.kondisi = condition.toUpperCase();
      state.lastTransition = new Date();
    }
  }
};