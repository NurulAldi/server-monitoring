// Layanan Monitoring Live - Global State Management
// Mendukung automated simulation dan manual override untuk testing

const { logger } = require('../utilitas/logger');
const { EventEmitter } = require('events');

/**
 * GLOBAL STATE: Menyimpan metrics real-time untuk semua server
 * Format: { serverId: { cpu, ram, disk, temperature, timestamp, isOverride } }
 */
class MonitoringLiveService extends EventEmitter {
  constructor() {
    super();
    this.globalState = new Map(); // serverId -> metrics
    this.overrideLocks = new Map(); // serverId -> lockUntilTimestamp
    this.automatedLoopInterval = null;
    this.isRunning = false;
    this.updateIntervalMs = 3000; // 3 seconds
    this.overrideLockDuration = 2 * 60 * 1000; // 2 minutes
  }

  /**
   * Initialize global state untuk server tertentu
   */
  initializeServer(serverId, initialMetrics = null) {
    if (!this.globalState.has(serverId)) {
      const defaultMetrics = initialMetrics || {
        cpu: this.randomBetween(20, 50),
        ram: this.randomBetween(30, 60),
        disk: this.randomBetween(40, 70),
        temperature: this.randomBetween(45, 60)
      };

      this.globalState.set(serverId, {
        ...defaultMetrics,
        timestamp: new Date(),
        isOverride: false,
        lastUpdate: Date.now()
      });

      logger.logSystem('MONITORING_LIVE_INIT', {
        serverId,
        metrics: defaultMetrics
      });
    }
  }

  /**
   * Start automated loop - update every 3s dengan randomization
   */
  startAutomatedLoop() {
    if (this.isRunning) {
      logger.warn('Automated loop sudah berjalan');
      return;
    }

    this.isRunning = true;
    logger.logSystem('MONITORING_LIVE_START', {
      interval: this.updateIntervalMs,
      lockDuration: this.overrideLockDuration
    });

    this.automatedLoopInterval = setInterval(() => {
      this.updateAllServers();
    }, this.updateIntervalMs);
  }

  /**
   * Stop automated loop
   */
  stopAutomatedLoop() {
    if (this.automatedLoopInterval) {
      clearInterval(this.automatedLoopInterval);
      this.automatedLoopInterval = null;
      this.isRunning = false;
      logger.logSystem('MONITORING_LIVE_STOP', {});
    }
  }

  /**
   * Update all servers dengan randomization kecil (+/- 2%)
   */
  updateAllServers() {
    const now = Date.now();

    for (const [serverId, currentState] of this.globalState.entries()) {
      // Check if server is locked by override
      const lockUntil = this.overrideLocks.get(serverId);
      if (lockUntil && now < lockUntil) {
        // Skip update - masih dalam periode override lock
        continue;
      }

      // Remove expired lock
      if (lockUntil && now >= lockUntil) {
        this.overrideLocks.delete(serverId);
        logger.logSystem('MONITORING_OVERRIDE_EXPIRED', { serverId });
      }

      // Apply randomization (+/- 2%)
      const updated = this.applyRandomization(currentState);
      
      this.globalState.set(serverId, {
        ...updated,
        timestamp: new Date(),
        isOverride: false,
        lastUpdate: now
      });

      // Emit event untuk real-time updates
      this.emit('metrics-updated', { serverId, metrics: updated });
    }
  }

  /**
   * Apply small randomization to metrics (+/- 2%)
   */
  applyRandomization(currentMetrics) {
    const randomize = (value, variance = 0.02) => {
      const change = value * variance * (Math.random() * 2 - 1);
      return Math.max(0, Math.min(100, value + change));
    };

    return {
      cpu: randomize(currentMetrics.cpu),
      ram: randomize(currentMetrics.ram),
      disk: randomize(currentMetrics.disk, 0.01), // Disk changes slower
      temperature: randomize(currentMetrics.temperature, 0.015)
    };
  }

  /**
   * MANUAL OVERRIDE: Set specific values untuk testing
   * @param {string} serverId - ID server
   * @param {Object} overrideMetrics - { cpu?, ram?, disk?, temperature? }
   * @param {number} lockDurationMs - Duration untuk pause automated updates
   */
  setOverride(serverId, overrideMetrics, lockDurationMs = null) {
    // Initialize server if not exists
    if (!this.globalState.has(serverId)) {
      this.initializeServer(serverId);
    }

    const currentState = this.globalState.get(serverId);
    const lockDuration = lockDurationMs || this.overrideLockDuration;

    // Merge override values dengan current state
    const updatedMetrics = {
      cpu: overrideMetrics.cpu !== undefined ? overrideMetrics.cpu : currentState.cpu,
      ram: overrideMetrics.ram !== undefined ? overrideMetrics.ram : currentState.ram,
      disk: overrideMetrics.disk !== undefined ? overrideMetrics.disk : currentState.disk,
      temperature: overrideMetrics.temperature !== undefined ? overrideMetrics.temperature : currentState.temperature
    };

    // Validate ranges
    Object.keys(updatedMetrics).forEach(key => {
      updatedMetrics[key] = Math.max(0, Math.min(100, updatedMetrics[key]));
    });

    // Update global state
    this.globalState.set(serverId, {
      ...updatedMetrics,
      timestamp: new Date(),
      isOverride: true,
      lastUpdate: Date.now()
    });

    // Set override lock
    const lockUntil = Date.now() + lockDuration;
    this.overrideLocks.set(serverId, lockUntil);

    logger.logSystem('MONITORING_OVERRIDE_SET', {
      serverId,
      overrideMetrics,
      lockDuration,
      lockUntilTimestamp: new Date(lockUntil)
    });

    // Emit event
    this.emit('metrics-overridden', { 
      serverId, 
      metrics: updatedMetrics,
      lockUntil: new Date(lockUntil)
    });

    return {
      success: true,
      metrics: updatedMetrics,
      lockedUntil: new Date(lockUntil)
    };
  }

  /**
   * Clear override lock untuk server tertentu
   */
  clearOverride(serverId) {
    this.overrideLocks.delete(serverId);
    
    if (this.globalState.has(serverId)) {
      const current = this.globalState.get(serverId);
      this.globalState.set(serverId, {
        ...current,
        isOverride: false,
        lastUpdate: Date.now()
      });
    }

    logger.logSystem('MONITORING_OVERRIDE_CLEARED', { serverId });
  }

  /**
   * Get current metrics untuk server tertentu
   */
  getCurrentMetrics(serverId) {
    if (!this.globalState.has(serverId)) {
      this.initializeServer(serverId);
    }

    const metrics = this.globalState.get(serverId);
    const lockUntil = this.overrideLocks.get(serverId);

    return {
      ...metrics,
      isLocked: lockUntil ? Date.now() < lockUntil : false,
      lockedUntil: lockUntil ? new Date(lockUntil) : null
    };
  }

  /**
   * Get all servers metrics
   */
  getAllMetrics() {
    const result = {};
    for (const [serverId, metrics] of this.globalState.entries()) {
      const lockUntil = this.overrideLocks.get(serverId);
      result[serverId] = {
        ...metrics,
        isLocked: lockUntil ? Date.now() < lockUntil : false,
        lockedUntil: lockUntil ? new Date(lockUntil) : null
      };
    }
    return result;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalServers: this.globalState.size,
      activeLocks: this.overrideLocks.size,
      updateInterval: this.updateIntervalMs,
      lockDuration: this.overrideLockDuration
    };
  }

  /**
   * Helper: Generate random number between min and max
   */
  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Cleanup - Stop loop dan clear state
   */
  cleanup() {
    this.stopAutomatedLoop();
    this.globalState.clear();
    this.overrideLocks.clear();
    this.removeAllListeners();
    logger.logSystem('MONITORING_LIVE_CLEANUP', {});
  }
}

// Export singleton instance
const monitoringLiveService = new MonitoringLiveService();

module.exports = {
  MonitoringLiveService,
  monitoringLiveService
};
