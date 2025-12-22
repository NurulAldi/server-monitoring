/**
 * Validasi untuk Socket.IO Events
 * Strategi validasi untuk real-time communication
 */

const { logger } = require('../utilitas/logger');

/**
 * Validasi room name untuk Socket.IO
 */
const validateRoomName = (roomName) => {
  if (!roomName || typeof roomName !== 'string') {
    return { valid: false, error: 'Room name harus berupa string' };
  }

  // Room name harus mengikuti format: server-{ObjectId} atau user-{ObjectId}
  const roomPattern = /^(server|user)-[a-f\d]{24}$/;
  if (!roomPattern.test(roomName)) {
    return { valid: false, error: 'Format room name tidak valid' };
  }

  // Cek panjang room name
  if (roomName.length > 50) {
    return { valid: false, error: 'Room name terlalu panjang' };
  }

  return { valid: true };
};

/**
 * Validasi event name untuk Socket.IO
 */
const validateEventName = (eventName) => {
  if (!eventName || typeof eventName !== 'string') {
    return { valid: false, error: 'Event name harus berupa string' };
  }

  // Whitelist event names yang diizinkan
  const allowedEvents = [
    'join-server',
    'leave-server',
    'send-message',
    'update-metrics',
    'alert-triggered',
    'server-status',
    'disconnect',
    'connect',
    'error',
    'ping',
    'pong'
  ];

  if (!allowedEvents.includes(eventName)) {
    return { valid: false, error: 'Event name tidak diizinkan' };
  }

  return { valid: true };
};

/**
 * Validasi payload untuk event join-server
 */
const validateJoinServerPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload harus berupa object' };
  }

  // Validasi serverId
  if (!payload.serverId || typeof payload.serverId !== 'string') {
    return { valid: false, error: 'Server ID diperlukan' };
  }

  // Validasi format MongoDB ObjectId
  const objectIdPattern = /^[a-f\d]{24}$/;
  if (!objectIdPattern.test(payload.serverId)) {
    return { valid: false, error: 'Format Server ID tidak valid' };
  }

  // Validasi userId (opsional)
  if (payload.userId && typeof payload.userId !== 'string') {
    return { valid: false, error: 'User ID harus berupa string' };
  }

  if (payload.userId && !objectIdPattern.test(payload.userId)) {
    return { valid: false, error: 'Format User ID tidak valid' };
  }

  return { valid: true };
};

/**
 * Validasi payload untuk event send-message
 */
const validateSendMessagePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload harus berupa object' };
  }

  // Validasi message content
  if (!payload.message || typeof payload.message !== 'string') {
    return { valid: false, error: 'Pesan diperlukan' };
  }

  // Validasi panjang pesan
  if (payload.message.length < 1 || payload.message.length > 500) {
    return { valid: false, error: 'Panjang pesan harus 1-500 karakter' };
  }

  // Sanitasi dan validasi konten pesan
  const sanitizedMessage = sanitizeSocketMessage(payload.message);
  if (sanitizedMessage !== payload.message) {
    return { valid: false, error: 'Pesan mengandung karakter yang tidak diizinkan' };
  }

  // Validasi serverId (opsional untuk chat umum)
  if (payload.serverId) {
    const objectIdPattern = /^[a-f\d]{24}$/;
    if (!objectIdPattern.test(payload.serverId)) {
      return { valid: false, error: 'Format Server ID tidak valid' };
    }
  }

  // Validasi messageType
  if (payload.messageType && !['text', 'system', 'alert'].includes(payload.messageType)) {
    return { valid: false, error: 'Tipe pesan tidak valid' };
  }

  return { valid: true };
};

/**
 * Validasi payload untuk event update-metrics
 */
const validateUpdateMetricsPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload harus berupa object' };
  }

  // Validasi serverId
  if (!payload.serverId || typeof payload.serverId !== 'string') {
    return { valid: false, error: 'Server ID diperlukan' };
  }

  const objectIdPattern = /^[a-f\d]{24}$/;
  if (!objectIdPattern.test(payload.serverId)) {
    return { valid: false, error: 'Format Server ID tidak valid' };
  }

  // Validasi metrics data
  if (!payload.metrics || typeof payload.metrics !== 'object') {
    return { valid: false, error: 'Data metrics diperlukan' };
  }

  const metrics = payload.metrics;

  // Validasi CPU metrics
  if (metrics.cpu) {
    if (typeof metrics.cpu.persentase === 'number' &&
        (metrics.cpu.persentase < 0 || metrics.cpu.persentase > 100)) {
      return { valid: false, error: 'CPU persentase harus 0-100' };
    }
  }

  // Validasi Memory metrics
  if (metrics.memori) {
    if (typeof metrics.memori.persentase === 'number' &&
        (metrics.memori.persentase < 0 || metrics.memori.persentase > 100)) {
      return { valid: false, error: 'Memory persentase harus 0-100' };
    }
  }

  // Validasi Disk metrics
  if (metrics.disk) {
    if (typeof metrics.disk.persentase === 'number' &&
        (metrics.disk.persentase < 0 || metrics.disk.persentase > 100)) {
      return { valid: false, error: 'Disk persentase harus 0-100' };
    }
  }

  // Validasi Network metrics
  if (metrics.jaringan) {
    if (typeof metrics.jaringan.downloadMbps === 'number' &&
        (metrics.jaringan.downloadMbps < 0 || metrics.jaringan.downloadMbps > 10000)) {
      return { valid: false, error: 'Download speed harus 0-10000 Mbps' };
    }
    if (typeof metrics.jaringan.uploadMbps === 'number' &&
        (metrics.jaringan.uploadMbps < 0 || metrics.jaringan.uploadMbps > 10000)) {
      return { valid: false, error: 'Upload speed harus 0-10000 Mbps' };
    }
  }

  return { valid: true };
};

/**
 * Sanitasi pesan Socket.IO
 */
const sanitizeSocketMessage = (message) => {
  if (typeof message !== 'string') return message;

  return message
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 500); // Limit length
};

/**
 * Rate limiting untuk Socket.IO events
 */
class SocketRateLimiter {
  constructor() {
    this.events = new Map();
    this.maxEventsPerMinute = 60;
    this.maxEventsPerHour = 1000;
  }

  checkRateLimit(socketId, eventName) {
    const key = `${socketId}:${eventName}`;
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    if (!this.events.has(key)) {
      this.events.set(key, []);
    }

    const eventTimes = this.events.get(key);

    // Clean old events
    const recentEvents = eventTimes.filter(time => time > minuteAgo);
    this.events.set(key, recentEvents);

    // Check minute limit
    if (recentEvents.length >= this.maxEventsPerMinute) {
      return { allowed: false, reason: 'Terlalu banyak event per menit' };
    }

    // Check hour limit (count all events in last hour)
    const hourlyEvents = eventTimes.filter(time => time > hourAgo);
    if (hourlyEvents.length >= this.maxEventsPerHour) {
      return { allowed: false, reason: 'Terlalu banyak event per jam' };
    }

    // Add current event
    recentEvents.push(now);

    return { allowed: true };
  }

  cleanup() {
    const hourAgo = Date.now() - 3600000;
    for (const [key, times] of this.events.entries()) {
      const recentTimes = times.filter(time => time > hourAgo);
      if (recentTimes.length === 0) {
        this.events.delete(key);
      } else {
        this.events.set(key, recentTimes);
      }
    }
  }
}

// Singleton rate limiter
const socketRateLimiter = new SocketRateLimiter();

// Cleanup setiap jam
setInterval(() => {
  socketRateLimiter.cleanup();
}, 3600000);

/**
 * Middleware validasi untuk Socket.IO
 */
const validateSocketEvent = (eventName, payload, socket) => {
  try {
    // Rate limiting check
    const rateLimit = socketRateLimiter.checkRateLimit(socket.id, eventName);
    if (!rateLimit.allowed) {
      logger.logSystemActivity('SOCKET_RATE_LIMIT_EXCEEDED', {
        socketId: socket.id,
        eventName,
        reason: rateLimit.reason,
        userId: socket.userId || 'anonymous'
      });
      return { valid: false, error: rateLimit.reason };
    }

    // Event name validation
    const eventValidation = validateEventName(eventName);
    if (!eventValidation.valid) {
      return eventValidation;
    }

    // Payload validation berdasarkan event type
    switch (eventName) {
      case 'join-server':
        return validateJoinServerPayload(payload);
      case 'send-message':
        return validateSendMessagePayload(payload);
      case 'update-metrics':
        return validateUpdateMetricsPayload(payload);
      case 'leave-server':
        return validateJoinServerPayload(payload); // Same validation as join
      default:
        return { valid: true }; // Allow other events
    }

  } catch (error) {
    logger.logError('SOCKET_VALIDATION_ERROR', error, { eventName, socketId: socket.id });
    return { valid: false, error: 'Terjadi kesalahan dalam validasi' };
  }
};

/**
 * Validasi autentikasi socket
 */
const validateSocketAuth = (token) => {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token autentikasi diperlukan' };
  }

  // Basic token format validation
  if (token.length < 10 || token.length > 1000) {
    return { valid: false, error: 'Format token tidak valid' };
  }

  // Cek tidak mengandung karakter berbahaya
  const dangerousChars = /[<>]/;
  if (dangerousChars.test(token)) {
    return { valid: false, error: 'Token mengandung karakter tidak valid' };
  }

  return { valid: true };
};

module.exports = {
  validateRoomName,
  validateEventName,
  validateJoinServerPayload,
  validateSendMessagePayload,
  validateUpdateMetricsPayload,
  sanitizeSocketMessage,
  validateSocketEvent,
  validateSocketAuth,
  SocketRateLimiter,
  socketRateLimiter
};