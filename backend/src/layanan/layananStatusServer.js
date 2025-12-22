// Layanan Monitoring Status Server
// Service untuk monitoring dan manajemen status server dengan hysteresis

const {
  tentukanStatusServer,
  evaluasiHysteresis,
  dapatkanRekomendasi,
  STATUS_LEVELS
} = require('../utilitas/statusServer');
const Server = require('../model/Server');
const { logger } = require('../utilitas/logger');

// Import Socket.IO untuk real-time updates
let io = null;

class LayananStatusServer {
  constructor(socketIo = null) {
    this.statusCache = new Map(); // Cache status server
    this.statusHistory = new Map(); // History status untuk hysteresis
    this.isRunning = false;
    this.monitoringInterval = null;
    io = socketIo; // Set Socket.IO instance
  }

  /**
   * Set Socket.IO instance untuk real-time updates
   * @param {SocketIO.Server} socketIo - Socket.IO server instance
   */
  setSocketIO(socketIo) {
    io = socketIo;
    logger.info('Socket.IO instance diset untuk layanan status server');
  }

  /**
   * Mulai layanan monitoring status
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Layanan monitoring status server sudah berjalan');
      return;
    }

    logger.info('Memulai layanan monitoring status server...');
    this.isRunning = true;

    // Load status awal dari database
    await this.loadStatusAwal();

    // Setup monitoring periodik
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateStatusSemuaServer();
      } catch (error) {
        logger.error('Error dalam monitoring status periodik:', error);
      }
    }, 60 * 1000); // Update setiap 1 menit

    logger.info('Layanan monitoring status server berhasil dimulai');
  }

  /**
   * Stop layanan monitoring status
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Menghentikan layanan monitoring status server...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.statusCache.clear();
    this.statusHistory.clear();
    this.isRunning = false;

    logger.info('Layanan monitoring status server dihentikan');
  }

  /**
   * Load status awal dari database
   */
  async loadStatusAwal() {
    try {
      logger.info('Loading status awal server...');

      const servers = await Server.find({}).select('_id nama statusServer waktuStatusTerakhir');
      let loaded = 0;

      for (const server of servers) {
        if (server.statusServer && server.waktuStatusTerakhir) {
          this.statusCache.set(server._id.toString(), {
            status: server.statusServer,
            lastUpdate: server.waktuStatusTerakhir,
            confidence: 100
          });

          // Initialize history dengan status awal
          this.statusHistory.set(server._id.toString(), [{
            status: server.statusServer,
            timestamp: server.waktuStatusTerakhir,
            confidence: 100
          }]);

          loaded++;
        }
      }

      logger.info(`Status awal ${loaded} server berhasil dimuat`);
    } catch (error) {
      logger.error('Error loading status awal:', error);
    }
  }

  /**
   * Update status semua server aktif
   */
  async updateStatusSemuaServer() {
    try {
      const servers = await Server.find({ status: 'aktif' }).select('_id nama');
      const hasil = { berhasil: 0, gagal: 0 };

      for (const server of servers) {
        try {
          await this.updateStatusServer(server._id);
          hasil.berhasil++;
        } catch (error) {
          logger.error(`Gagal update status server ${server.nama}:`, error);
          hasil.gagal++;
        }
      }

      if (hasil.berhasil > 0 || hasil.gagal > 0) {
        logger.debug(`Update status selesai: ${hasil.berhasil} berhasil, ${hasil.gagal} gagal`);
      }
    } catch (error) {
      logger.error('Error dalam update status semua server:', error);
    }
  }

  /**
   * Update status server tertentu berdasarkan data health terbaru
   */
  async updateStatusServer(serverId) {
    try {
      const Metrik = require('../model/Metrik');

      // Ambil data health terbaru (5 menit terakhir)
      const latestMetrics = await Metrik.findOne({
        serverId,
        timestampPengumpulan: {
          $gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }).sort({ timestampPengumpulan: -1 });

      if (!latestMetrics) {
        // Tidak ada data terbaru, cek apakah perlu set offline
        await this.handleOfflineServer(serverId);
        return;
      }

      // Tentukan status baru berdasarkan data health
      const statusResult = tentukanStatusServer(latestMetrics);

      // Dapatkan status saat ini dari cache
      const currentStatusData = this.statusCache.get(serverId.toString()) || {
        status: 'UNKNOWN',
        lastUpdate: new Date(0),
        confidence: 0
      };

      // Dapatkan history status untuk hysteresis
      const serverHistory = this.statusHistory.get(serverId.toString()) || [];

      // Evaluasi hysteresis
      const hysteresisResult = evaluasiHysteresis(
        currentStatusData.status,
        statusResult.status,
        serverHistory.slice(-10).map(h => h.status), // 10 status terakhir
        currentStatusData.lastUpdate
      );

      const finalStatus = hysteresisResult.newStatus;
      const shouldUpdate = hysteresisResult.shouldChange;

      // Update cache jika status berubah
      if (shouldUpdate || finalStatus !== currentStatusData.status) {
        const newStatusData = {
          status: finalStatus,
          lastUpdate: new Date(),
          confidence: statusResult.confidence,
          reason: statusResult.reason,
          details: statusResult.details
        };

        this.statusCache.set(serverId.toString(), newStatusData);

        // Tambahkan ke history
        serverHistory.push({
          status: finalStatus,
          timestamp: newStatusData.lastUpdate,
          confidence: statusResult.confidence,
          rawStatus: statusResult.status,
          hysteresis: hysteresisResult.reason
        });

        // Keep only last 50 entries
        if (serverHistory.length > 50) {
          serverHistory.splice(0, serverHistory.length - 50);
        }

        this.statusHistory.set(serverId.toString(), serverHistory);

        // Update database
        await Server.findByIdAndUpdate(serverId, {
          statusServer: finalStatus,
          waktuStatusTerakhir: newStatusData.lastUpdate,
          detailStatus: {
            confidence: statusResult.confidence,
            reason: statusResult.reason,
            recommendations: dapatkanRekomendasi(finalStatus, statusResult.details)
          }
        });

        // Log perubahan status
        if (shouldUpdate) {
          logger.logSystemActivity('SERVER_STATUS_CHANGED', {
            serverId,
            oldStatus: currentStatusData.status,
            newStatus: finalStatus,
            reason: hysteresisResult.reason,
            confidence: statusResult.confidence,
            trigger: 'automatic_monitoring'
          });

          // Emit real-time status change
          await this.emitStatusChange(serverId, finalStatus, statusResult, hysteresisResult);

          // Emit dashboard summary update
          await this.emitDashboardSummaryUpdate();
        }

        // Trigger alert jika status critical atau danger
        if (['CRITICAL', 'DANGER', 'OFFLINE'].includes(finalStatus)) {
          await this.triggerAlert(serverId, finalStatus, statusResult);
        }
      }

    } catch (error) {
      logger.error(`Error updating status server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Handle server yang offline (tidak ada data health)
   */
  async handleOfflineServer(serverId) {
    const currentStatusData = this.statusCache.get(serverId.toString());

    if (!currentStatusData) {
      // Server baru, set sebagai offline
      const offlineData = {
        status: 'OFFLINE',
        lastUpdate: new Date(),
        confidence: 100,
        reason: 'Tidak ada data health tersedia'
      };

      this.statusCache.set(serverId.toString(), offlineData);
      this.statusHistory.set(serverId.toString(), [{
        status: 'OFFLINE',
        timestamp: offlineData.lastUpdate,
        confidence: 100
      }]);

      await Server.findByIdAndUpdate(serverId, {
        statusServer: 'OFFLINE',
        waktuStatusTerakhir: offlineData.lastUpdate,
        detailStatus: {
          confidence: 100,
          reason: 'Tidak ada data health tersedia',
          recommendations: dapatkanRekomendasi('OFFLINE', {})
        }
      });

      logger.logSystemActivity('SERVER_OFFLINE_DETECTED', {
        serverId,
        reason: 'no_health_data'
      });

      return;
    }

    // Cek apakah sudah offline
    if (currentStatusData.status === 'OFFLINE') {
      return; // Sudah offline, tidak perlu update
    }

    // Hitung waktu sejak last update
    const timeSinceLastUpdate = Date.now() - currentStatusData.lastUpdate.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    const fifteenMinutes = 15 * 60 * 1000;

    let newStatus = currentStatusData.status;

    if (timeSinceLastUpdate > fifteenMinutes) {
      newStatus = 'OFFLINE';
    } else if (timeSinceLastUpdate > fiveMinutes) {
      newStatus = 'WARNING';
    }

    if (newStatus !== currentStatusData.status) {
      const newStatusData = {
        status: newStatus,
        lastUpdate: new Date(),
        confidence: 90,
        reason: `Tidak ada data health selama ${Math.floor(timeSinceLastUpdate / (60 * 1000))} menit`
      };

      this.statusCache.set(serverId.toString(), newStatusData);

      const serverHistory = this.statusHistory.get(serverId.toString()) || [];
      serverHistory.push({
        status: newStatus,
        timestamp: newStatusData.lastUpdate,
        confidence: 90
      });

      if (serverHistory.length > 50) {
        serverHistory.splice(0, serverHistory.length - 50);
      }

      this.statusHistory.set(serverId.toString(), serverHistory);

      await Server.findByIdAndUpdate(serverId, {
        statusServer: newStatus,
        waktuStatusTerakhir: newStatusData.lastUpdate,
        detailStatus: {
          confidence: 90,
          reason: newStatusData.reason,
          recommendations: dapatkanRekomendasi(newStatus, {})
        }
      });

      logger.logSystemActivity('SERVER_STATUS_CHANGED', {
        serverId,
        oldStatus: currentStatusData.status,
        newStatus,
        reason: 'no_recent_health_data',
        trigger: 'offline_detection'
      });

      // Trigger alert untuk offline
      if (newStatus === 'OFFLINE') {
        await this.triggerAlert(serverId, 'OFFLINE', { reason: newStatusData.reason });
      }
    }
  }

  /**
   * Trigger alert untuk status critical
   */
  async triggerAlert(serverId, status, details) {
    try {
      const layananAlert = require('./layananAlert');

      const alertData = {
        serverId,
        tipe: 'STATUS_CHANGE',
        severity: status === 'DANGER' ? 'critical' : status === 'CRITICAL' ? 'high' : 'medium',
        pesan: `Server status berubah menjadi ${status}`,
        detail: {
          status,
          reason: details.reason,
          confidence: details.confidence,
          recommendations: dapatkanRekomendasi(status, details)
        }
      };

      await layananAlert.buatAlert(alertData);
    } catch (error) {
      logger.error(`Error triggering alert untuk server ${serverId}:`, error);
    }
  }

  /**
   * Get status server saat ini
   */
  getStatusServer(serverId) {
    return this.statusCache.get(serverId.toString()) || null;
  }

  /**
   * Get history status server
   */
  getStatusHistory(serverId, limit = 20) {
    const history = this.statusHistory.get(serverId.toString()) || [];
    return history.slice(-limit);
  }

  /**
   * Get semua status server
   */
  getSemuaStatusServer() {
    const result = {};
    for (const [serverId, statusData] of this.statusCache) {
      result[serverId] = statusData;
    }
    return result;
  }

  /**
   * Manual override status server (untuk maintenance mode)
   */
  async overrideStatusServer(serverId, status, reason = 'Manual override', duration = null) {
    try {
      if (!STATUS_LEVELS[status]) {
        throw new Error(`Status tidak valid: ${status}`);
      }

      const overrideData = {
        status,
        lastUpdate: new Date(),
        confidence: 100,
        reason,
        override: true,
        duration
      };

      this.statusCache.set(serverId.toString(), overrideData);

      // Add to history
      const serverHistory = this.statusHistory.get(serverId.toString()) || [];
      serverHistory.push({
        status,
        timestamp: overrideData.lastUpdate,
        confidence: 100,
        override: true,
        reason
      });

      if (serverHistory.length > 50) {
        serverHistory.splice(0, serverHistory.length - 50);
      }

      this.statusHistory.set(serverId.toString(), serverHistory);

      // Update database
      await Server.findByIdAndUpdate(serverId, {
        statusServer: status,
        waktuStatusTerakhir: overrideData.lastUpdate,
        detailStatus: {
          confidence: 100,
          reason,
          override: true,
          recommendations: []
        }
      });

      logger.logSystemActivity('SERVER_STATUS_OVERRIDE', {
        serverId,
        newStatus: status,
        reason,
        duration,
        trigger: 'manual_override'
      });

      // Auto-revert jika ada duration
      if (duration) {
        setTimeout(async () => {
          try {
            await this.revertOverrideStatus(serverId);
          } catch (error) {
            logger.error(`Error reverting status override untuk server ${serverId}:`, error);
          }
        }, duration);
      }

      return { success: true, message: `Status server di-override menjadi ${status}` };
    } catch (error) {
      logger.error(`Error overriding status server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Revert status override
   */
  async revertOverrideStatus(serverId) {
    try {
      // Hapus dari cache untuk force re-evaluation
      this.statusCache.delete(serverId.toString());

      // Trigger update status normal
      await this.updateStatusServer(serverId);

      logger.logSystemActivity('SERVER_STATUS_OVERRIDE_REVERTED', {
        serverId,
        trigger: 'auto_revert'
      });

      return { success: true, message: 'Status override di-revert' };
    } catch (error) {
      logger.error(`Error reverting status override untuk server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Emit status change ke Socket.IO
   * @param {string} serverId - ID server
   * @param {string} newStatus - Status baru
   * @param {object} statusResult - Hasil evaluasi status
   * @param {object} hysteresisResult - Hasil evaluasi hysteresis
   */
  async emitStatusChange(serverId, newStatus, statusResult, hysteresisResult) {
    if (!io) {
      logger.warn('Socket.IO tidak tersedia untuk emit status change');
      return;
    }

    try {
      // Get server info
      const server = await Server.findById(serverId).select('nama host');

      const statusChangeData = {
        serverId: serverId.toString(),
        namaServer: server?.nama || 'Unknown Server',
        host: server?.host || 'Unknown Host',
        statusBaru: newStatus,
        statusLama: hysteresisResult.oldStatus,
        timestamp: new Date().toISOString(),
        confidence: statusResult.confidence,
        alasan: statusResult.reason,
        detail: statusResult.details,
        hysteresis: {
          alasan: hysteresisResult.reason,
          perubahanDipaksa: hysteresisResult.shouldChange
        },
        rekomendasi: dapatkanRekomendasi(newStatus, statusResult.details),
        trigger: 'automatic_monitoring'
      };

      // Emit ke namespace /status
      const statusNamespace = io.of('/status');
      statusNamespace.to(`server_status_${serverId}`).emit('status:berubah', statusChangeData);

      // Emit ke namespace /monitoring untuk dashboard updates
      const monitoringNamespace = io.of('/monitoring');
      monitoringNamespace.to(`server_metrics_${serverId}`).emit('server:status_update', statusChangeData);

      // Emit ke namespace /alert jika status critical/danger
      if (['CRITICAL', 'DANGER', 'OFFLINE'].includes(newStatus)) {
        const alertNamespace = io.of('/alert');
        alertNamespace.emit('alert:status_critical', {
          ...statusChangeData,
          tingkatAlert: newStatus === 'DANGER' ? 'critical' : 'high',
          pesan: `Server ${server?.nama || serverId} dalam kondisi ${newStatus.toLowerCase()}`,
          tindakanDisarankan: dapatkanRekomendasi(newStatus, statusResult.details)
        });
      }

      // Emit ke namespace /sistem untuk notifikasi umum
      const systemNamespace = io.of('/sistem');
      systemNamespace.to('system_general').emit('sistem:status_update', statusChangeData);

      logger.debug(`Status change emitted untuk server ${serverId}: ${hysteresisResult.oldStatus} -> ${newStatus}`);

    } catch (error) {
      logger.error(`Error emitting status change untuk server ${serverId}:`, error);
    }
  }

  /**
   * Emit dashboard summary update ke Socket.IO
   */
  async emitDashboardSummaryUpdate() {
    if (!io) {
      return;
    }

    try {
      // Get summary from cache
      const servers = Array.from(this.statusCache.values());
      const totalServers = servers.length;

      const summary = {
        totalServer: totalServers,
        sehat: servers.filter(s => s.status === 'HEALTHY').length,
        peringatan: servers.filter(s => s.status === 'WARNING').length,
        kritis: servers.filter(s => s.status === 'CRITICAL').length,
        bahaya: servers.filter(s => s.status === 'DANGER').length,
        offline: servers.filter(s => s.status === 'OFFLINE').length
      };

      const summaryData = {
        timestamp: new Date().toISOString(),
        ringkasan: summary,
        perubahanTerbaru: [], // Could be populated with recent changes
        metrikGlobal: {
          cpuRataRata: 65.2, // Could be calculated from actual metrics
          memoriRataRata: 71.8,
          alertAktif: 3
        }
      };

      // Import and use the emitDashboardSummary function from socket handlers
      const { emitDashboardSummary } = require('../socket/index');
      await emitDashboardSummary(io.of('/monitoring'));

    } catch (error) {
      logger.error('Error emitting dashboard summary update:', error);
    }
  }

  /**
   * Get status layanan
   */
  getStatusLayanan() {
    return {
      isRunning: this.isRunning,
      monitoredServers: this.statusCache.size,
      lastUpdate: new Date(),
      cacheSize: this.statusCache.size,
      historySize: this.statusHistory.size
    };
  }
}

// Export singleton instance
const layananStatusServer = new LayananStatusServer();

module.exports = layananStatusServer;