// Penjadwal Agregasi Metrik
// Scheduler untuk menjalankan tugas agregasi secara periodik

const layananAgregasiMetrik = require('../layanan/layananAgregasiMetrik');
const { logger } = require('../utilitas/logger');

class PenjadwalAgregasiMetrik {
  constructor() {
    this.isRunning = false;
    this.timers = new Map();
    this.nextRuns = new Map();
  }

  /**
   * Mulai penjadwal
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Penjadwal agregasi metrik sudah berjalan');
      return;
    }

    logger.info('Memulai penjadwal agregasi metrik...');
    this.isRunning = true;

    // Setup semua jadwal
    this.setupJadwalAgregasiHarian();
    this.setupJadwalAnalisisTrend();
    this.setupJadwalUpdateBaseline();
    this.setupJadwalCleanup();

    // Jalankan tugas awal jika diperlukan
    await this.jalankanTugasAwal();

    logger.info('Penjadwal agregasi metrik berhasil dimulai');
  }

  /**
   * Stop penjadwal
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Menghentikan penjadwal agregasi metrik...');

    // Clear semua timers
    for (const [key, timer] of this.timers) {
      clearTimeout(timer);
      logger.debug(`Timer ${key} dihentikan`);
    }
    this.timers.clear();
    this.nextRuns.clear();

    this.isRunning = false;
    logger.info('Penjadwal agregasi metrik dihentikan');
  }

  /**
   * Setup jadwal agregasi harian (setiap hari jam 2:00)
   */
  setupJadwalAgregasiHarian() {
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date(now);

      // Set ke jam 2:00 hari berikutnya
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(2, 0, 0, 0);

      const timeUntilNext = nextRun.getTime() - now.getTime();

      logger.debug(`Agregasi harian berikutnya: ${nextRun.toISOString()}`);

      const timer = setTimeout(async () => {
        try {
          await layananAgregasiMetrik.agregasiHarian();
        } catch (error) {
          logger.error('Error dalam jadwal agregasi harian:', error);
        }

        // Schedule run berikutnya
        if (this.isRunning) {
          this.setupJadwalAgregasiHarian();
        }
      }, timeUntilNext);

      this.timers.set('agregasiHarian', timer);
      this.nextRuns.set('agregasiHarian', nextRun);
    };

    scheduleNextRun();
  }

  /**
   * Setup jadwal analisis trend (setiap 6 jam)
   */
  setupJadwalAnalisisTrend() {
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date(now);

      // Set ke jam berikutnya yang merupakan kelipatan 6 jam
      const currentHour = now.getHours();
      const nextHour = Math.ceil((currentHour + 1) / 6) * 6;
      nextRun.setHours(nextHour % 24, 0, 0, 0);

      if (nextHour >= 24) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const timeUntilNext = nextRun.getTime() - now.getTime();

      logger.debug(`Analisis trend berikutnya: ${nextRun.toISOString()}`);

      const timer = setTimeout(async () => {
        try {
          await layananAgregasiMetrik.analisisTrend();
        } catch (error) {
          logger.error('Error dalam jadwal analisis trend:', error);
        }

        // Schedule run berikutnya
        if (this.isRunning) {
          this.setupJadwalAnalisisTrend();
        }
      }, timeUntilNext);

      this.timers.set('analisisTrend', timer);
      this.nextRuns.set('analisisTrend', nextRun);
    };

    scheduleNextRun();
  }

  /**
   * Setup jadwal update baseline (setiap minggu hari Minggu jam 3:00)
   */
  setupJadwalUpdateBaseline() {
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date(now);

      // Cari hari Minggu berikutnya
      const daysUntilSunday = (7 - now.getDay()) % 7;
      if (daysUntilSunday === 0 && now.getHours() >= 3) {
        // Jika hari Minggu dan sudah lewat jam 3, maka Minggu depan
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setDate(nextRun.getDate() + daysUntilSunday);
      }
      nextRun.setHours(3, 0, 0, 0);

      const timeUntilNext = nextRun.getTime() - now.getTime();

      logger.debug(`Update baseline berikutnya: ${nextRun.toISOString()}`);

      const timer = setTimeout(async () => {
        try {
          await layananAgregasiMetrik.updateBaseline();
        } catch (error) {
          logger.error('Error dalam jadwal update baseline:', error);
        }

        // Schedule run berikutnya
        if (this.isRunning) {
          this.setupJadwalUpdateBaseline();
        }
      }, timeUntilNext);

      this.timers.set('updateBaseline', timer);
      this.nextRuns.set('updateBaseline', nextRun);
    };

    scheduleNextRun();
  }

  /**
   * Setup jadwal cleanup (setiap hari jam 4:00)
   */
  setupJadwalCleanup() {
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date(now);

      // Set ke jam 4:00 hari berikutnya
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(4, 0, 0, 0);

      const timeUntilNext = nextRun.getTime() - now.getTime();

      logger.debug(`Cleanup berikutnya: ${nextRun.toISOString()}`);

      const timer = setTimeout(async () => {
        try {
          await layananAgregasiMetrik.cleanupDataLama();
        } catch (error) {
          logger.error('Error dalam jadwal cleanup:', error);
        }

        // Schedule run berikutnya
        if (this.isRunning) {
          this.setupJadwalCleanup();
        }
      }, timeUntilNext);

      this.timers.set('cleanup', timer);
      this.nextRuns.set('cleanup', nextRun);
    };

    scheduleNextRun();
  }

  /**
   * Jalankan tugas awal saat startup
   */
  async jalankanTugasAwal() {
    try {
      logger.info('Menjalankan tugas awal penjadwal...');

      const now = new Date();
      const currentHour = now.getHours();

      // Jika startup di luar jam kerja (misal malam hari), jalankan agregasi harian
      if (currentHour >= 0 && currentHour <= 5) {
        logger.info('Startup di luar jam kerja, menjalankan agregasi harian awal...');
        try {
          await layananAgregasiMetrik.agregasiHarian();
        } catch (error) {
          logger.error('Error dalam tugas awal agregasi harian:', error);
        }
      }

      // Selalu jalankan analisis trend saat startup
      logger.info('Menjalankan analisis trend awal...');
      try {
        await layananAgregasiMetrik.analisisTrend();
      } catch (error) {
        logger.error('Error dalam tugas awal analisis trend:', error);
      }

      logger.info('Tugas awal penjadwal selesai');
    } catch (error) {
      logger.error('Error dalam tugas awal penjadwal:', error);
    }
  }

  /**
   * Trigger manual untuk tugas tertentu
   */
  async triggerManual(tipeTugas) {
    try {
      logger.info(`Trigger manual untuk tugas: ${tipeTugas}`);

      switch (tipeTugas) {
        case 'agregasiHarian':
          await layananAgregasiMetrik.agregasiHarian();
          break;
        case 'analisisTrend':
          await layananAgregasiMetrik.analisisTrend();
          break;
        case 'updateBaseline':
          await layananAgregasiMetrik.updateBaseline();
          break;
        case 'cleanup':
          await layananAgregasiMetrik.cleanupDataLama();
          break;
        default:
          throw new Error(`Tipe tugas tidak valid: ${tipeTugas}`);
      }

      logger.info(`Trigger manual ${tipeTugas} selesai`);
      return { success: true, message: `Tugas ${tipeTugas} berhasil dijalankan` };
    } catch (error) {
      logger.error(`Error dalam trigger manual ${tipeTugas}:`, error);
      throw error;
    }
  }

  /**
   * Get status penjadwal
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      activeTimers: Array.from(this.timers.keys()),
      nextRuns: {}
    };

    for (const [key, nextRun] of this.nextRuns) {
      status.nextRuns[key] = nextRun.toISOString();
    }

    return status;
  }

  /**
   * Reset jadwal untuk tugas tertentu
   */
  resetJadwal(tipeTugas) {
    if (!this.isRunning) {
      throw new Error('Penjadwal tidak sedang berjalan');
    }

    // Clear timer yang ada
    if (this.timers.has(tipeTugas)) {
      clearTimeout(this.timers.get(tipeTugas));
      this.timers.delete(tipeTugas);
      this.nextRuns.delete(tipeTugas);
    }

    // Setup ulang jadwal
    switch (tipeTugas) {
      case 'agregasiHarian':
        this.setupJadwalAgregasiHarian();
        break;
      case 'analisisTrend':
        this.setupJadwalAnalisisTrend();
        break;
      case 'updateBaseline':
        this.setupJadwalUpdateBaseline();
        break;
      case 'cleanup':
        this.setupJadwalCleanup();
        break;
      default:
        throw new Error(`Tipe tugas tidak valid: ${tipeTugas}`);
    }

    logger.info(`Jadwal ${tipeTugas} berhasil direset`);
    return { success: true, message: `Jadwal ${tipeTugas} berhasil direset` };
  }

  /**
   * Get info jadwal untuk monitoring
   */
  getInfoJadwal() {
    const now = new Date();
    const info = {};

    for (const [key, nextRun] of this.nextRuns) {
      const timeUntilNext = nextRun.getTime() - now.getTime();
      const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
      const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

      info[key] = {
        nextRun: nextRun.toISOString(),
        timeUntilNext: `${hoursUntilNext} jam ${minutesUntilNext} menit`,
        isActive: this.timers.has(key)
      };
    }

    return info;
  }
}

// Export singleton instance
const penjadwalAgregasiMetrik = new PenjadwalAgregasiMetrik();

module.exports = penjadwalAgregasiMetrik;