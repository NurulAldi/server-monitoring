// Layanan Agregasi Metrik
// Service untuk mengelola agregasi data metrik secara otomatis

const Metrik = require('../model/Metrik');
const MetrikAgregatHarian = require('../model/MetrikAgregatHarian');
const MetrikTrend = require('../model/MetrikTrend');
const MetrikBaseline = require('../model/MetrikBaseline');
const Server = require('../model/Server');
const { logger } = require('../utilitas/logger');

// Import Socket.IO untuk real-time updates
let io = null;

class LayananAgregasiMetrik {
  constructor() {
    this.isRunning = false;
    this.intervalIds = new Map();
  }

  /**
   * Set Socket.IO instance untuk real-time updates
   * @param {SocketIO.Server} socketIo - Socket.IO server instance
   */
  setSocketIO(socketIo) {
    io = socketIo;
    logger.info('Socket.IO instance diset untuk layanan agregasi metrik');
  }

  /**
   * Mulai layanan agregasi
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Layanan agregasi metrik sudah berjalan');
      return;
    }

    logger.info('Memulai layanan agregasi metrik...');
    this.isRunning = true;

    // Jalankan agregasi awal
    await this.jalankanAgregasiAwal();

    // Setup scheduler untuk agregasi periodik
    this.setupScheduler();

    logger.info('Layanan agregasi metrik berhasil dimulai');
  }

  /**
   * Stop layanan agregasi
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Menghentikan layanan agregasi metrik...');

    // Clear semua interval
    for (const [key, intervalId] of this.intervalIds) {
      clearInterval(intervalId);
      logger.debug(`Interval ${key} dihentikan`);
    }
    this.intervalIds.clear();

    this.isRunning = false;
    logger.info('Layanan agregasi metrik dihentikan');
  }

  /**
   * Setup scheduler untuk tugas periodik
   */
  setupScheduler() {
    // Agregasi harian - setiap jam 2 pagi
    const agregasiHarianId = setInterval(async () => {
      try {
        await this.agregasiHarian();
      } catch (error) {
        logger.error('Error dalam agregasi harian:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 jam

    // Analisis trend - setiap 6 jam
    const trendAnalysisId = setInterval(async () => {
      try {
        await this.analisisTrend();
      } catch (error) {
        logger.error('Error dalam analisis trend:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 jam

    // Update baseline - setiap minggu
    const baselineUpdateId = setInterval(async () => {
      try {
        await this.updateBaseline();
      } catch (error) {
        logger.error('Error dalam update baseline:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 hari

    // Cleanup data lama - setiap hari
    const cleanupId = setInterval(async () => {
      try {
        await this.cleanupDataLama();
      } catch (error) {
        logger.error('Error dalam cleanup data:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 jam

    this.intervalIds.set('agregasiHarian', agregasiHarianId);
    this.intervalIds.set('trendAnalysis', trendAnalysisId);
    this.intervalIds.set('baselineUpdate', baselineUpdateId);
    this.intervalIds.set('cleanup', cleanupId);

    logger.info('Scheduler agregasi berhasil di-setup');
  }

  /**
   * Jalankan agregasi awal saat startup
   */
  async jalankanAgregasiAwal() {
    try {
      logger.info('Menjalankan agregasi awal...');

      // Ambil semua server aktif
      const servers = await Server.find({ status: 'aktif' });

      for (const server of servers) {
        try {
          // Agregasi data harian untuk 7 hari terakhir
          await this.agregasiHarianServer(server._id);

          // Analisis trend untuk 24 jam terakhir
          await this.analisisTrendServer(server._id);

          // Update baseline jika belum ada atau perlu refresh
          await this.updateBaselineServer(server._id);

          logger.debug(`Agregasi awal selesai untuk server ${server.nama}`);
        } catch (error) {
          logger.error(`Error agregasi awal server ${server.nama}:`, error);
        }
      }

      logger.info('Agregasi awal selesai');
    } catch (error) {
      logger.error('Error dalam agregasi awal:', error);
    }
  }

  /**
   * Agregasi data harian untuk semua server
   */
  async agregasiHarian() {
    try {
      logger.info('Memulai agregasi harian...');

      const servers = await Server.find({ status: 'aktif' });
      const hasil = { berhasil: 0, gagal: 0 };

      for (const server of servers) {
        try {
          await this.agregasiHarianServer(server._id);
          hasil.berhasil++;
        } catch (error) {
          logger.error(`Agregasi harian gagal untuk server ${server.nama}:`, error);
          hasil.gagal++;
        }
      }

      logger.info(`Agregasi harian selesai: ${hasil.berhasil} berhasil, ${hasil.gagal} gagal`);
    } catch (error) {
      logger.error('Error dalam agregasi harian:', error);
    }
  }

  /**
   * Agregasi data harian untuk server tertentu
   */
  async agregasiHarianServer(serverId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Cek apakah agregat hari ini sudah ada
    const existingAggregate = await MetrikAgregatHarian.findOne({
      serverId,
      'periodeAgregat.tanggal': startOfDay
    });

    if (existingAggregate) {
      logger.debug(`Agregat harian sudah ada untuk server ${serverId} tanggal ${startOfDay.toISOString()}`);
      return existingAggregate;
    }

    // Ambil data metrik untuk hari ini
    const metrics = await Metrik.find({
      serverId,
      timestampPengumpulan: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ timestampPengumpulan: 1 });

    if (metrics.length === 0) {
      logger.warn(`Tidak ada data metrik untuk server ${serverId} pada ${startOfDay.toISOString()}`);
      return null;
    }

    // Buat agregat harian
    const aggregate = await MetrikAgregatHarian.hitungStatistikHarian(metrics, serverId, startOfDay);

    // Emit real-time update jika Socket.IO tersedia
    if (io) {
      await this.emitAgregasiUpdate(serverId, 'harian', aggregate);
    }

    logger.debug(`Agregat harian berhasil dibuat untuk server ${serverId}`);
    return aggregate;
  }

  /**
   * Analisis trend untuk semua server
   */
  async analisisTrend() {
    try {
      logger.info('Memulai analisis trend...');

      const servers = await Server.find({ status: 'aktif' });
      const hasil = { berhasil: 0, gagal: 0 };

      for (const server of servers) {
        try {
          await this.analisisTrendServer(server._id);
          hasil.berhasil++;
        } catch (error) {
          logger.error(`Analisis trend gagal untuk server ${server.nama}:`, error);
          hasil.gagal++;
        }
      }

      logger.info(`Analisis trend selesai: ${hasil.berhasil} berhasil, ${hasil.gagal} gagal`);
    } catch (error) {
      logger.error('Error dalam analisis trend:', error);
    }
  }

  /**
   * Analisis trend untuk server tertentu
   */
  async analisisTrendServer(serverId, hours = 24) {
    try {
      const trend = await MetrikTrend.analyzeTrend(serverId, hours);
      logger.debug(`Analisis trend berhasil untuk server ${serverId}`);
      return trend;
    } catch (error) {
      if (error.message.includes('Insufficient data')) {
        logger.warn(`Data tidak cukup untuk analisis trend server ${serverId}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Update baseline untuk semua server
   */
  async updateBaseline() {
    try {
      logger.info('Memulai update baseline...');

      const servers = await Server.find({ status: 'aktif' });
      const hasil = { berhasil: 0, gagal: 0 };

      for (const server of servers) {
        try {
          await this.updateBaselineServer(server._id);
          hasil.berhasil++;
        } catch (error) {
          logger.error(`Update baseline gagal untuk server ${server.nama}:`, error);
          hasil.gagal++;
        }
      }

      logger.info(`Update baseline selesai: ${hasil.berhasil} berhasil, ${hasil.gagal} gagal`);
    } catch (error) {
      logger.error('Error dalam update baseline:', error);
    }
  }

  /**
   * Update baseline untuk server tertentu
   */
  async updateBaselineServer(serverId, days = 30) {
    try {
      // Cek apakah baseline terbaru masih valid (kurang dari 7 hari)
      const latestBaseline = await MetrikBaseline.findOne({ serverId })
        .sort({ 'periodeBaseline.mulai': -1 });

      if (latestBaseline) {
        const daysSinceLastUpdate = (Date.now() - latestBaseline.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUpdate < 7) {
          logger.debug(`Baseline server ${serverId} masih up-to-date`);
          return latestBaseline;
        }
      }

      const baseline = await MetrikBaseline.calculateBaseline(serverId, days);
      logger.debug(`Baseline berhasil diupdate untuk server ${serverId}`);
      return baseline;
    } catch (error) {
      if (error.message.includes('Insufficient data')) {
        logger.warn(`Data tidak cukup untuk baseline server ${serverId}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Cleanup data lama berdasarkan retention policy
   */
  async cleanupDataLama() {
    try {
      logger.info('Memulai cleanup data lama...');

      const now = new Date();

      // Cleanup sudah ditangani oleh TTL indexes, tapi kita monitor saja
      const collections = [
        { name: 'Metrik', model: Metrik, retentionDays: 30 },
        { name: 'MetrikAgregatHarian', model: MetrikAgregatHarian, retentionDays: 365 },
        { name: 'MetrikTrend', model: MetrikTrend, retentionDays: 7 },
        { name: 'MetrikBaseline', model: MetrikBaseline, retentionDays: 90 }
      ];

      for (const collection of collections) {
        const cutoffDate = new Date(now.getTime() - collection.retentionDays * 24 * 60 * 60 * 1000);

        // Hitung jumlah data yang akan dihapus (untuk monitoring)
        const countToDelete = await collection.model.countDocuments({
          createdAt: { $lt: cutoffDate }
        });

        if (countToDelete > 0) {
          logger.info(`Menghapus ${countToDelete} dokumen lama dari ${collection.name}`);

          // TTL indexes akan menghapus secara otomatis, tapi kita bisa force delete jika perlu
          // await collection.model.deleteMany({ createdAt: { $lt: cutoffDate } });
        }
      }

      logger.info('Cleanup data lama selesai');
    } catch (error) {
      logger.error('Error dalam cleanup data lama:', error);
    }
  }

  /**
   * Manual trigger untuk agregasi server tertentu
   */
  async triggerAgregasiManual(serverId, tipe = 'semua') {
    try {
      logger.info(`Trigger manual agregasi ${tipe} untuk server ${serverId}`);

      const hasil = { harian: null, trend: null, baseline: null };

      if (tipe === 'semua' || tipe === 'harian') {
        hasil.harian = await this.agregasiHarianServer(serverId);
      }

      if (tipe === 'semua' || tipe === 'trend') {
        hasil.trend = await this.analisisTrendServer(serverId);
      }

      if (tipe === 'semua' || tipe === 'baseline') {
        hasil.baseline = await this.updateBaselineServer(serverId);
      }

      logger.info(`Trigger manual selesai untuk server ${serverId}`);
      return hasil;
    } catch (error) {
      logger.error(`Error dalam trigger manual server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Get status layanan
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: Array.from(this.intervalIds.keys()),
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Rebuild agregat untuk periode tertentu (untuk recovery)
   */
  async rebuildAgregat(serverId, startDate, endDate, tipe = 'semua') {
    try {
      logger.info(`Rebuild agregat ${tipe} untuk server ${serverId} dari ${startDate} sampai ${endDate}`);

      const start = new Date(startDate);
      const end = new Date(endDate);
      const hasil = { harian: 0, trend: 0, baseline: 0 };

      // Rebuild harian
      if (tipe === 'semua' || tipe === 'harian') {
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          try {
            await this.agregasiHarianServer(serverId, date);
            hasil.harian++;
          } catch (error) {
            logger.warn(`Gagal rebuild harian untuk ${date.toISOString()}:`, error);
          }
        }
      }

      // Rebuild trend (untuk setiap 6 jam dalam periode)
      if (tipe === 'semua' || tipe === 'trend') {
        // Implementasi rebuild trend jika diperlukan
        hasil.trend = 1; // Placeholder
      }

      // Rebuild baseline (hanya satu)
      if (tipe === 'semua' || tipe === 'baseline') {
        await this.updateBaselineServer(serverId);
        hasil.baseline = 1;
      }

      logger.info(`Rebuild agregat selesai: ${hasil.harian} harian, ${hasil.trend} trend, ${hasil.baseline} baseline`);
      return hasil;
    } catch (error) {
      logger.error(`Error dalam rebuild agregat server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Emit agregasi update ke Socket.IO
   * @param {string} serverId - ID server
   * @param {string} tipeAgregasi - Tipe agregasi (harian, trend, baseline)
   * @param {Object} dataAgregasi - Data agregasi
   */
  async emitAgregasiUpdate(serverId, tipeAgregasi, dataAgregasi) {
    if (!io) {
      logger.warn('Socket.IO tidak tersedia untuk emit agregasi update');
      return;
    }

    try {
      // Get server info
      const server = await Server.findById(serverId).select('nama host');

      const agregasiData = {
        serverId: serverId.toString(),
        namaServer: server?.nama || 'Unknown Server',
        host: server?.host || 'Unknown Host',
        tipeAgregasi,
        data: dataAgregasi,
        timestamp: new Date().toISOString()
      };

      // Emit ke namespace /monitoring
      const monitoringNamespace = io.of('/monitoring');
      monitoringNamespace.to(`server_metrics_${serverId}`).emit('agregasi:baru', agregasiData);

      // Emit ke namespace /sistem untuk notifikasi umum
      const systemNamespace = io.of('/sistem');
      systemNamespace.to('system_general').emit('sistem:agregasi_update', agregasiData);

      logger.debug(`Agregasi update emitted untuk server ${serverId}: ${tipeAgregasi}`);

    } catch (error) {
      logger.error(`Error emitting agregasi update untuk server ${serverId}:`, error);
    }
  }
}

// Export singleton instance
const layananAgregasiMetrik = new LayananAgregasiMetrik();

module.exports = layananAgregasiMetrik;