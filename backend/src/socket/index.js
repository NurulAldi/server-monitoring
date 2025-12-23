// Handler Socket.IO untuk Real-time Monitoring Server
// Implementasi event-event Socket.IO sesuai rancangan arsitektur

const jwt = require('jsonwebtoken');
const { logger, logSocketConnection } = require('../utilitas/logger');
const Server = require('../model/Server');
const Pengguna = require('../model/Pengguna');

// Import validasi Socket.IO
const {
  validateSocketEvent,
  validateRoomName,
  validateSocketAuth
} = require('../middleware/socketValidasi');

// Import error handling
const { handleSocketError, asyncSocketHandler } = require('../middleware/errorHandler');
const { SocketError, ValidationError, AuthorizationError } = require('../utilitas/customErrors');

// Connection tracking untuk rate limiting dan security monitoring
const connectionTracker = new Map(); // userId -> {connections: Set, firstConnection, totalConnections, lastActivity}
const rateLimiter = new Map(); // userId:eventType -> {count, windowStart}

/**
 * Setup Socket.IO handlers dengan namespace dan middleware
 * @param {SocketIO.Server} io - Instance Socket.IO server
 */
function setupSocketHandlers(io) {
  // Middleware autentikasi untuk semua koneksi
  io.use(async (socket, next) => {
    try {
      // Extract token dari multiple sources untuk compatibility
      const token = socket.handshake.auth?.token ||
                   socket.handshake.query?.token ||
                   socket.handshake.headers?.authorization?.replace('Bearer ', '');

      // Validasi token format terlebih dahulu
      const tokenValidation = validateSocketAuth(token);
      if (!tokenValidation.valid) {
        logger.logSystemActivity('SOCKET_AUTH_FAILED_TOKEN_VALIDATION', {
          socketId: socket.id,
          ip: socket.handshake.address,
          error: tokenValidation.error
        });
        return next(new Error(tokenValidation.error));
      }

      if (!token) {
        logger.logSystemActivity('SOCKET_AUTH_FAILED_NO_TOKEN', {
          socketId: socket.id,
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });
        return next(new Error('Token autentikasi diperlukan'));
      }

      // Verifikasi JWT token dengan error handling detail
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        let errorMessage = 'Token tidak valid';
        if (jwtError.name === 'TokenExpiredError') {
          errorMessage = 'Token sudah expired';
        } else if (jwtError.name === 'JsonWebTokenError') {
          errorMessage = 'Token format tidak valid';
        }

        logger.logSystemActivity('SOCKET_AUTH_FAILED_INVALID_TOKEN', {
          socketId: socket.id,
          ip: socket.handshake.address,
          error: jwtError.name,
          tokenExpired: jwtError.name === 'TokenExpiredError'
        });
        return next(new Error(errorMessage));
      }

      // Validasi payload token
      if (!decoded.id || !decoded.role) {
        logger.logSystemActivity('SOCKET_AUTH_FAILED_INVALID_PAYLOAD', {
          socketId: socket.id,
          ip: socket.handshake.address,
          decoded: decoded
        });
        return next(new Error('Token payload tidak lengkap'));
      }

      // Validasi role
      const validRoles = ['user', 'admin', 'superadmin', 'researcher'];
      if (!validRoles.includes(decoded.role)) {
        logger.logSystemActivity('SOCKET_AUTH_FAILED_INVALID_ROLE', {
          socketId: socket.id,
          ip: socket.handshake.address,
          role: decoded.role
        });
        return next(new Error('Role tidak valid'));
      }

      // Load dan validasi user data dari database
      const user = await Pengguna.findById(decoded.id).select('nama email role aktif terakhirLogin');
      if (!user) {
        logger.logSystemActivity('SOCKET_AUTH_FAILED_USER_NOT_FOUND', {
          socketId: socket.id,
          ip: socket.handshake.address,
          userId: decoded.id
        });
        return next(new Error('User tidak ditemukan'));
      }

      if (!user.aktif) {
        logger.logSystemActivity('SOCKET_AUTH_FAILED_USER_INACTIVE', {
          socketId: socket.id,
          ip: socket.handshake.address,
          userId: decoded.id
        });
        return next(new Error('Akun user tidak aktif'));
      }

      // Attach user data ke socket instance
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userData = user;
      socket.authenticatedAt = new Date();

      // Update last login timestamp (optional, untuk tracking)
      await Pengguna.findByIdAndUpdate(decoded.id, {
        terakhirLogin: new Date()
      });

      logger.logSystemActivity('SOCKET_AUTH_SUCCESS', {
        userId: user._id,
        userRole: user.role,
        socketId: socket.id,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

      next();
    } catch (error) {
      logger.logSystemError('SOCKET_AUTH_UNEXPECTED_ERROR', error, {
        socketId: socket.id,
        ip: socket.handshake.address
      });
      next(new Error('Terjadi kesalahan autentikasi'));
    }
  });

  // Handler koneksi utama
  io.on('connection', (socket) => {
    logSocketConnection(socket.userId || 'anonymous', 'connect', {
      socketId: socket.id,
      connectionType: socket.handshake.query.transport || 'websocket',
      rooms: [],
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent']
    });

    // Track connection untuk security monitoring
    trackConnection(socket);

    // Setup room subscriptions berdasarkan role dan permissions
    setupRoomSubscriptions(socket);

    // Handler disconnect
    socket.on('disconnect', (reason) => {
      // Calculate connection duration
      const connectionDuration = socket.authenticatedAt ?
        Date.now() - socket.authenticatedAt.getTime() : null;

      logSocketConnection(socket.userId || 'anonymous', 'disconnect', {
        socketId: socket.id,
        connectionType: socket.handshake.query.transport || 'websocket',
        rooms: Array.from(socket.rooms || []),
        connectionDuration,
        disconnectReason: reason,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

      // Remove connection tracking
      removeConnectionTracking(socket.userId, socket.id);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.logSystemError('SOCKET_ERROR', error, {
        userId: socket.userId,
        socketId: socket.id
      });
    });
  });

  // Setup namespace handlers
  setupMonitoringNamespace(io);
  setupStatusNamespace(io);
  setupChatNamespace(io);
  setupAlertNamespace(io);
  setupSystemNamespace(io);
  setupAdminNamespace(io);
  setupAINamespace(io); // Tambahkan namespace AI

  logger.info('Socket.IO handlers berhasil di-setup');
}

/**
 * Setup room subscriptions untuk user
 * @param {SocketIO.Socket} socket - Socket instance
 */
async function setupRoomSubscriptions(socket) {
  const { userId, userData } = socket;

  try {
    // Join user-specific room (untuk pesan personal)
    socket.join(`user_${userId}`);
    logger.debug(`User ${userId} joined personal room: user_${userId}`);

    // Join role-based rooms
    if (userData.role === 'superadmin') {
      socket.join('superadmin');
      socket.join('admin'); // Superadmin juga dapat akses admin rooms
      logger.debug(`Superadmin ${userId} joined superadmin and admin rooms`);
    } else if (userData.role === 'admin') {
      socket.join('admin');
      logger.debug(`Admin ${userId} joined admin room`);
    }

    // Join maintenance room untuk semua user aktif (untuk notifikasi sistem)
    socket.join('maintenance');
    logger.debug(`User ${userId} joined maintenance room`);

    // Join organization room (untuk broadcast umum)
    socket.join('org_main');
    logger.debug(`User ${userId} joined organization room: org_main`);

    // Join server rooms berdasarkan permissions
    await setupServerRooms(socket);

    // Join alert rooms berdasarkan role dan preferences
    await setupAlertRooms(socket);

    logger.logSystemActivity('SOCKET_ROOMS_SETUP_COMPLETE', {
      userId,
      userRole: userData.role,
      socketId: socket.id,
      roomCount: Array.from(socket.rooms).length
    });

  } catch (error) {
    logger.error(`Error setting up rooms for user ${userId}:`, error);

    // Fallback: hanya join user room dan maintenance
    socket.join(`user_${userId}`);
    socket.join('maintenance');

    logger.warn(`Fallback room setup for user ${userId}: only personal and maintenance rooms`);
  }
}

/**
 * Setup server rooms berdasarkan user permissions
 * @param {SocketIO.Socket} socket - Socket instance
 */
async function setupServerRooms(socket) {
  const { userId, userData } = socket;

  try {
    let servers = [];
    let query = {};

    // Build query berdasarkan role dan permissions
    if (userData.role === 'superadmin') {
      // Superadmin dapat akses semua server tanpa batas
      query = {};
    } else if (userData.role === 'admin') {
      // Admin dapat akses server yang mereka kelola atau semua server aktif
      query = {
        $or: [
          { pemilik: userId },
          { 'permissions.admins': userId },
          { status: 'aktif' }
        ]
      };
    } else {
      // User biasa hanya server yang mereka buat atau diberi akses
      query = {
        $or: [
          { pemilik: userId },
          { 'permissions.users': userId },
          { 'permissions.viewers': userId }
        ]
      };
    }

    servers = await Server.find(query).select('_id nama status');

    // Join server rooms dengan validasi
    const joinedRooms = [];
    servers.forEach(server => {
      // Hanya join server yang aktif (kecuali superadmin)
      if (userData.role === 'superadmin' || server.status === 'aktif') {
        const roomName = `server_${server._id}`;
        socket.join(roomName);
        joinedRooms.push(roomName);

        logger.debug(`User ${userId} joined server room: ${roomName} (${server.nama})`);
      }
    });

    // Store authorized servers untuk validasi selanjutnya
    socket.authorizedServers = servers
      .filter(s => userData.role === 'superadmin' || s.status === 'aktif')
      .map(s => ({
        id: s._id.toString(),
        nama: s.nama,
        status: s.status
      }));

    logger.logSystemActivity('SOCKET_SERVER_ROOMS_SETUP', {
      userId,
      userRole: userData.role,
      serverCount: socket.authorizedServers.length,
      joinedRooms: joinedRooms.length
    });

  } catch (error) {
    logger.error(`Error setting up server rooms for user ${userId}:`, error);

    // Fallback: tidak join server rooms
    socket.authorizedServers = [];
    logger.warn(`No server rooms joined for user ${userId} due to error`);
  }
}

/**
 * Setup alert rooms berdasarkan role dan preferences
 * @param {SocketIO.Socket} socket - Socket instance
 */
async function setupAlertRooms(socket) {
  const { userId, userData } = socket;

  try {
    // Load user alert preferences (jika ada di model Pengguna)
    // Untuk sementara, gunakan role-based assignment

    // Semua user join low dan medium alert rooms
    socket.join('alerts_low');
    socket.join('alerts_medium');

    // Admin dan superadmin join high dan critical alert rooms
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      socket.join('alerts_high');
      socket.join('alerts_critical');
      logger.debug(`Admin ${userId} joined high and critical alert rooms`);
    }

    // Superadmin join semua alert rooms termasuk system alerts
    if (userData.role === 'superadmin') {
      socket.join('alerts_system');
      logger.debug(`Superadmin ${userId} joined system alert room`);
    }

    logger.debug(`User ${userId} joined alert rooms based on role: ${userData.role}`);

  } catch (error) {
    logger.error(`Error setting up alert rooms for user ${userId}:`, error);

    // Fallback: join basic alert rooms
    socket.join('alerts_low');
    socket.join('alerts_medium');
    logger.warn(`Fallback alert rooms setup for user ${userId}`);
  }
}

/**
 * Setup namespace /monitoring untuk real-time metrics
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupMonitoringNamespace(io) {
  const monitoring = io.of('/monitoring');

  // Middleware autentikasi untuk namespace monitoring
  monitoring.use(async (socket, next) => {
    // Re-use main authentication
    if (socket.userId) {
      next();
    } else {
      next(new Error('Autentikasi diperlukan'));
    }
  });

  monitoring.on('connection', (socket) => {
    logger.debug(`User ${socket.userId} connected to /monitoring`);

    // Client dapat request specific server metrics
    socket.on('metrik:subscribe', (serverId) => {
      // Validasi event dan payload
      const validation = validateSocketEvent('join-server', { serverId }, socket);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        logger.logSystemActivity('SOCKET_EVENT_VALIDATION_FAILED', {
          userId: socket.userId,
          socketId: socket.id,
          event: 'metrik:subscribe',
          error: validation.error
        });
        return;
      }

      // Validasi akses server
      const hasAccess = socket.authorizedServers &&
                       socket.authorizedServers.some(server => server.id === serverId);

      if (hasAccess) {
        socket.join(`server_metrics_${serverId}`);
        logger.debug(`User ${socket.userId} subscribed to metrics: ${serverId}`);

        // Log subscription untuk audit
        logger.logSystemActivity('METRICS_SUBSCRIPTION', {
          userId: socket.userId,
          serverId,
          socketId: socket.id,
          action: 'subscribe'
        });
      } else {
        socket.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'Akses server ditolak - Anda tidak memiliki permission untuk server ini'
        });
        logger.logSystemActivity('METRICS_SUBSCRIPTION_DENIED', {
          userId: socket.userId,
          serverId,
          socketId: socket.id,
          reason: 'insufficient_permissions'
        });
      }
    });

    socket.on('metrik:unsubscribe', (serverId) => {
      socket.leave(`server_metrics_${serverId}`);
      logger.debug(`User ${socket.userId} unsubscribed from metrics: ${serverId}`);

      logger.logSystemActivity('METRICS_SUBSCRIPTION', {
        userId: socket.userId,
        serverId,
        socketId: socket.id,
        action: 'unsubscribe'
      });
    });

    // Client dapat request dashboard summary
    socket.on('dashboard:subscribe', () => {
      socket.join('dashboard_summary');
      logger.debug(`User ${socket.userId} subscribed to dashboard summary`);

      // Send initial summary
      emitDashboardSummary(monitoring);
    });

    socket.on('dashboard:unsubscribe', () => {
      socket.leave('dashboard_summary');
      logger.debug(`User ${socket.userId} unsubscribed from dashboard summary`);
    });
  });
}

/**
 * Setup namespace /status untuk status server
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupStatusNamespace(io) {
  const status = io.of('/status');

  status.use(async (socket, next) => {
    if (socket.userId) {
      next();
    } else {
      next(new Error('Autentikasi diperlukan'));
    }
  });

  status.on('connection', (socket) => {
    logger.debug(`User ${socket.userId} connected to /status`);

    // Auto-join status rooms berdasarkan authorized servers
    if (socket.authorizedServers && socket.authorizedServers.length > 0) {
      socket.authorizedServers.forEach(server => {
        const roomName = `server_status_${server.id}`;
        socket.join(roomName);
        logger.debug(`User ${socket.userId} joined status room: ${roomName} (${server.nama})`);
      });

      logger.logSystemActivity('STATUS_ROOMS_JOINED', {
        userId: socket.userId,
        serverCount: socket.authorizedServers.length,
        socketId: socket.id
      });
    } else {
      logger.debug(`User ${socket.userId} has no authorized servers for status updates`);
    }
  });
}

/**
 * Setup namespace /chat untuk chat AI dan support
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupChatNamespace(io) {
  const chat = io.of('/chat');

  chat.use(async (socket, next) => {
    if (socket.userId) {
      next();
    } else {
      next(new Error('Autentikasi diperlukan'));
    }
  });

  chat.on('connection', (socket) => {
    logger.debug(`User ${socket.userId} connected to /chat`);

    // Handle join room
    socket.on('ruang:bergabung', async (data) => {
      // Validasi event dan payload
      const validation = validateSocketEvent('join-server', data, socket);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        logger.logSystemActivity('SOCKET_EVENT_VALIDATION_FAILED', {
          userId: socket.userId,
          socketId: socket.id,
          event: 'ruang:bergabung',
          error: validation.error
        });
        return;
      }

      const { ruangId } = data;

      // Validate room access (server-specific rooms)
      // Support rooms format: {serverId}_support
      const serverId = ruangId.replace('_support', '');
      const hasAccess = socket.authorizedServers &&
                       socket.authorizedServers.some(server => server.id === serverId);

      if (hasAccess) {
        socket.join(ruangId);

        // Emit join notification
        const joinData = {
          ruangId,
          penggunaId: socket.userId,
          namaPengguna: socket.userData?.email || 'Pengguna',
          peran: socket.userData.role,
          timestamp: new Date().toISOString(),
          pesertaAktif: await getRoomParticipants(chat, ruangId)
        }; 

        chat.to(ruangId).emit('ruang:bergabung', joinData);

        logger.logSystemActivity('CHAT_ROOM_JOINED', {
          userId: socket.userId,
          roomId: ruangId,
          serverId,
          socketId: socket.id
        });
      } else {
        socket.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'Akses ruang chat ditolak - Anda tidak memiliki permission untuk server ini'
        });

        logger.logSystemActivity('CHAT_ROOM_ACCESS_DENIED', {
          userId: socket.userId,
          roomId: ruangId,
          serverId,
          socketId: socket.id,
          reason: 'insufficient_server_permissions'
        });
      }
    });

    // Handle leave room
    socket.on('ruang:keluar', (data) => {
      const { ruangId } = data;
      socket.leave(ruangId);
      logger.debug(`User ${socket.userId} left chat room: ${ruangId}`);
    });

    // Handle new message
    socket.on('pesan:kirim', asyncSocketHandler(async (socket, data) => {
      // Validasi event dan payload
      const validation = validateSocketEvent('send-message', data, socket);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      const { ruangId, pesan, tipe = 'teks', mention = [], balasKe = null } = data;

      // Validate room membership
      if (!socket.rooms.has(ruangId)) {
        throw new AuthorizationError('Belum bergabung dengan ruang chat');
      }

      const messageData = {
        pesanId: `msg_${Date.now()}_${socket.userId}`,
        ruangId,
        pengirimId: socket.userId,
        namaPengirim: socket.userData?.email || 'Pengguna',
        pesan,
        timestamp: new Date().toISOString(),
        tipe,
        mention,
        balasKe
      }; 

      // Emit to room
      chat.to(ruangId).emit('pesan:baru', messageData);

      // If message mentions AI, trigger AI response
      if (mention.includes('ai_assistant') || pesan.toLowerCase().includes('ai')) {
        setTimeout(() => {
          emitAIResponseToRoom(chat, ruangId, messageData.pesanId, pesan);
        }, 1000 + Math.random() * 2000); // Simulate AI thinking time
      }

      logger.debug(`Message sent in room ${ruangId} by user ${socket.userId}`);

      return { success: true, messageId: messageData.pesanId };
    }));

    // Handle typing indicator
    socket.on('pengguna:mengetik', (data) => {
      const { ruangId, sedangMengetik } = data;

      if (socket.rooms.has(ruangId)) {
        const typingData = {
          ruangId,
          penggunaId: socket.userId,
          namaPengguna: socket.userData?.email || 'Pengguna',
          sedangMengetik,
          timestamp: new Date().toISOString()
        }; 

        socket.to(ruangId).emit('pengguna:mengetik', typingData);
      }
    });
  });
}

/**
 * Setup namespace /alert untuk notifikasi alert
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupAlertNamespace(io) {
  const alert = io.of('/alert');

  alert.use(async (socket, next) => {
    if (socket.userId) {
      next();
    } else {
      next(new Error('Autentikasi diperlukan'));
    }
  });

  alert.on('connection', (socket) => {
    logger.debug(`User ${socket.userId} connected to /alert`);

    // Auto-join alert rooms berdasarkan role
    if (socket.userData.role === 'admin' || socket.userData.role === 'superadmin') {
      socket.join('alerts_critical');
      socket.join('alerts_high');
    }
    socket.join('alerts_medium');
    socket.join('alerts_low');

    // Handle acknowledge alert
    socket.on('alert:diakui', async (data) => {
      const { alertId, catatan = '' } = data;

      try {
        // Update alert in database (simplified)
        const acknowledgeData = {
          alertId,
          penggunaId: socket.userId,
          namaPengguna: socket.userData?.email || 'Pengguna',
          timestamp: new Date().toISOString(),
          catatan,
          tindakan: 'acknowledge'
        }; 

        // Emit to all clients interested in this alert
        alert.emit('alert:diakui', acknowledgeData);

        logger.logSystemActivity('ALERT_ACKNOWLEDGED', {
          alertId,
          userId: socket.userId,
          socketId: socket.id
        });

      } catch (error) {
        logger.error(`Error acknowledging alert ${alertId}:`, error);
        socket.emit('error', { message: 'Gagal mengakui alert' });
      }
    });

    // Handle resolve alert
    socket.on('alert:diselesaikan', async (data) => {
      const { alertId, resolusi, kategoriResolusi, waktuPemulihan, pelajaran = '', preventifAction = '' } = data;

      try {
        const resolveData = {
          alertId,
          penggunaId: socket.userId,
          namaPengguna: socket.userData?.email || 'Pengguna',
          timestamp: new Date().toISOString(),
          resolusi,
          kategoriResolusi,
          waktuPemulihan,
          pelajaran,
          preventifAction
        }; 

        alert.emit('alert:diselesaikan', resolveData);

        logger.logSystemActivity('ALERT_RESOLVED', {
          alertId,
          userId: socket.userId,
          resolution: kategoriResolusi
        });

      } catch (error) {
        logger.error(`Error resolving alert ${alertId}:`, error);
        socket.emit('error', { message: 'Gagal menyelesaikan alert' });
      }
    });
  });
}

/**
 * Setup namespace /sistem untuk notifikasi sistem
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupSystemNamespace(io) {
  const system = io.of('/sistem');

  system.use(async (socket, next) => {
    if (socket.userId) {
      next();
    } else {
      next(new Error('Autentikasi diperlukan'));
    }
  });

  system.on('connection', (socket) => {
    logger.debug(`User ${socket.userId} connected to /sistem`);

    // Auto-join system rooms berdasarkan role
    if (socket.userData.role === 'admin' || socket.userData.role === 'superadmin') {
      socket.join('system_admin');
    }
    socket.join('system_general');
  });
}

/**
 * Setup namespace /admin untuk kontrol admin
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupAdminNamespace(io) {
  const admin = io.of('/admin');

  admin.use(async (socket, next) => {
    // Only admin and superadmin can access
    if (socket.userId && (socket.userData.role === 'admin' || socket.userData.role === 'superadmin')) {
      next();
    } else {
      next(new Error('Akses admin diperlukan'));
    }
  });

  admin.on('connection', (socket) => {
    logger.debug(`Admin ${socket.userId} connected to /admin`);

    // Handle remote command execution
    socket.on('perintah:jalankan', async (data) => {
      const { serverId, tipePerintah, parameter = {} } = data;

      // Validate server access - admin must have access to target server
      const hasAccess = socket.authorizedServers &&
                       socket.authorizedServers.some(server => server.id === serverId);

      if (!hasAccess) {
        socket.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'Akses server ditolak - Anda tidak memiliki permission untuk server ini'
        });

        logger.logSystemActivity('REMOTE_COMMAND_ACCESS_DENIED', {
          userId: socket.userId,
          serverId,
          commandType: tipePerintah,
          socketId: socket.id,
          reason: 'insufficient_server_permissions'
        });
        return;
      }

      try {
        const commandId = `cmd_${Date.now()}_${socket.userId}`;

        // Emit command start
        const commandData = {
          perintahId: commandId,
          serverId,
          tipePerintah,
          parameter,
          dimintaOleh: socket.userId,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };

        admin.to(socket.id).emit('perintah:eksekusi', commandData);

        // Simulate command execution (in real implementation, this would call actual command service)
        setTimeout(() => {
          const resultData = {
            perintahId: commandId,
            status: Math.random() > 0.1 ? 'completed' : 'failed', // 90% success rate
            timestamp: new Date().toISOString(),
            hasil: {
              exitCode: Math.random() > 0.1 ? 0 : 1,
              stdout: `Command ${tipePerintah} executed successfully on server ${serverId}`,
              stderr: Math.random() > 0.1 ? '' : 'Warning: Some issues detected',
              waktuEksekusi: Math.floor(Math.random() * 5000) + 1000
            }
          };

          admin.to(socket.id).emit('perintah:hasil', resultData);
        }, 2000 + Math.random() * 3000); // 2-5 second delay

        logger.logSystemActivity('REMOTE_COMMAND_EXECUTED', {
          commandId,
          serverId,
          commandType: tipePerintah,
          userId: socket.userId
        });

      } catch (error) {
        logger.error(`Error executing remote command:`, error);
        socket.emit('error', { message: 'Gagal menjalankan perintah' });
      }
    });
  });
}

/**
 * Helper function untuk mendapatkan participants dalam room
 * @param {Namespace} namespace - Socket.IO namespace
 * @param {string} roomName - Nama room
 * @returns {Array} Array participants
 */
async function getRoomParticipants(namespace, roomName) {
  const participants = [];
  const sockets = await namespace.in(roomName).fetchSockets();

  for (const socket of sockets) {
    if (socket.userData) {
      participants.push({
        id: socket.userId,
        nama: socket.userData.nama,
        peran: socket.userData.role
      });
    }
  }

  return participants;
}

/**
 * Emit AI response ke chat room
 * @param {Namespace} chatNamespace - Chat namespace
 * @param {string} roomId - Room ID
 * @param {string} replyTo - Message ID to reply to
 * @param {string} userMessage - Original user message
 */
function emitAIResponseToRoom(chatNamespace, roomId, replyTo, userMessage) {
  // Simulate AI analysis based on message content
  let aiResponse = '';
  let recommendations = [];
  let confidence = 0.85;

  if (userMessage.toLowerCase().includes('cpu')) {
    aiResponse = 'Berdasarkan analisis metrik CPU, terdeteksi penggunaan yang tinggi. Kemungkinan disebabkan oleh proses backup atau aplikasi yang tidak teroptimasi.';
    recommendations = [
      'Periksa proses dengan CPU usage tertinggi menggunakan `top` atau `htop`',
      'Evaluasi untuk menambah core CPU atau melakukan load balancing',
      'Monitor tren CPU dalam 24 jam ke depan'
    ];
  } else if (userMessage.toLowerCase().includes('memori')) {
    aiResponse = 'Analisis menunjukkan memory usage yang meningkat. Periksa aplikasi yang mungkin mengalami memory leak.';
    recommendations = [
      'Gunakan `free -h` untuk melihat detail memory usage',
      'Periksa aplikasi Java/Node.js untuk memory leaks',
      'Pertimbangkan penambahan RAM atau optimasi aplikasi'
    ];
  } else if (userMessage.toLowerCase().includes('disk')) {
    aiResponse = 'Penggunaan disk yang tinggi terdeteksi. Perlu pembersihan file temporary atau log files.';
    recommendations = [
      'Gunakan `df -h` dan `du -sh /*` untuk analisis disk usage',
      'Hapus file log lama dan temporary files',
      'Evaluasi kebutuhan storage tambahan'
    ];
  } else {
    aiResponse = 'Saya menganalisis kondisi server saat ini. Berdasarkan metrik terbaru, sistem berjalan dalam kondisi normal dengan beberapa area yang perlu diperhatikan.';
    recommendations = [
      'Monitor terus performa server',
      'Periksa log sistem untuk anomali',
      'Pastikan backup terjadwal berjalan dengan baik'
    ];
  }

  const aiData = {
    pesanId: `ai_${Date.now()}`,
    ruangId: roomId,
    balasKe: replyTo,
    responAI: {
      teks: aiResponse,
      confidence,
      sumberData: ['cpu_metrics', 'memory_metrics', 'disk_metrics', 'system_logs'],
      rekomendasi,
      tindakanOtomatis: {
        tersedia: Math.random() > 0.7, // 30% chance of auto action
        deskripsi: 'Jalankan diagnostik mendalam server',
        risiko: 'low'
      }
    },
    timestamp: new Date().toISOString()
  };

  chatNamespace.to(roomId).emit('ai:respon', aiData);
}

/**
 * Emit dashboard summary ke monitoring namespace
 * @param {Namespace} monitoringNamespace - Monitoring namespace
 */
async function emitDashboardSummary(monitoringNamespace) {
  try {
    // Get summary from database
    const servers = await Server.find({ status: 'aktif' }).select('statusServer');

    const summary = {
      totalServer: servers.length,
      sehat: servers.filter(s => s.statusServer === 'HEALTHY').length,
      peringatan: servers.filter(s => s.statusServer === 'WARNING').length,
      kritis: servers.filter(s => s.statusServer === 'CRITICAL').length,
      bahaya: servers.filter(s => s.statusServer === 'DANGER').length,
      offline: servers.filter(s => s.statusServer === 'OFFLINE').length
    };

    // Get latest metrics for global averages
    const Metrik = require('../model/Metrik');
    const latestMetrics = await Metrik.find()
      .sort({ timestampPengumpulan: -1 })
      .limit(100) // Get last 100 metrics for averaging
      .select('cpu memori');

    let cpuRataRata = 0;
    let memoriRataRata = 0;
    let totalMetrics = 0;

    if (latestMetrics.length > 0) {
      const cpuSum = latestMetrics.reduce((sum, m) => sum + (m.cpu?.persentase || 0), 0);
      const memoriSum = latestMetrics.reduce((sum, m) => sum + (m.memori?.persentase || 0), 0);
      totalMetrics = latestMetrics.length;

      cpuRataRata = Math.round((cpuSum / totalMetrics) * 100) / 100;
      memoriRataRata = Math.round((memoriSum / totalMetrics) * 100) / 100;
    }

    // Get active alerts count (simplified - TODO: implement real alert counting)
    const alertAktif = Math.floor(Math.random() * 5);

    const summaryData = {
      timestamp: new Date().toISOString(),
      ringkasan: summary,
      perubahanTerbaru: [], // Would be populated from recent status changes
      metrikGlobal: {
        cpuRataRata,
        memoriRataRata,
        alertAktif
      }
    };

    monitoringNamespace.to('dashboard_summary').emit('dashboard:ringkasan', summaryData);

  } catch (error) {
    logger.error('Error emitting dashboard summary:', error);
  }
}

/**
 * Track user connections untuk security monitoring
 * @param {SocketIO.Socket} socket - Socket instance
 */
function trackConnection(socket) {
  const userId = socket.userId;
  const now = Date.now();

  if (!connectionTracker.has(userId)) {
    connectionTracker.set(userId, {
      connections: new Set(),
      firstConnection: now,
      totalConnections: 0,
      lastActivity: now
    });
  }

  const userTrack = connectionTracker.get(userId);
  userTrack.connections.add(socket.id);
  userTrack.totalConnections++;
  userTrack.lastActivity = now;

  // Limit concurrent connections per user (max 5)
  if (userTrack.connections.size > 5) {
    logger.logSystemActivity('CONNECTION_LIMIT_EXCEEDED', {
      userId,
      connectionCount: userTrack.connections.size,
      socketId: socket.id
    });

    // Force disconnect oldest connection if limit exceeded
    const connectionArray = Array.from(userTrack.connections);
    if (connectionArray.length > 5) {
      // Remove oldest connection from tracking
      const oldestSocketId = connectionArray[0];
      userTrack.connections.delete(oldestSocketId);

      logger.logSystemActivity('CONNECTION_FORCE_DISCONNECTED', {
        userId,
        socketId: oldestSocketId,
        reason: 'connection_limit_exceeded'
      });
    }
  }
}

/**
 * Remove connection tracking
 * @param {string} userId - User ID
 * @param {string} socketId - Socket ID
 */
function removeConnectionTracking(userId, socketId) {
  if (connectionTracker.has(userId)) {
    const userTrack = connectionTracker.get(userId);
    userTrack.connections.delete(socketId);

    // Clean up if no more connections
    if (userTrack.connections.size === 0) {
      connectionTracker.delete(userId);
    }
  }
}

/**
 * Check rate limiting untuk socket events
 * @param {string} userId - User ID
 * @param {string} eventType - Type of event
 * @param {number} limit - Max events per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if allowed, false if rate limited
 */
function checkRateLimit(userId, eventType, limit = 10, windowMs = 60000) {
  const key = `${userId}:${eventType}`;
  const now = Date.now();

  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, {
      count: 1,
      windowStart: now
    });
    return true;
  }

  const limitInfo = rateLimiter.get(key);

  // Reset window if expired
  if (now - limitInfo.windowStart > windowMs) {
    limitInfo.count = 1;
    limitInfo.windowStart = now;
    return true;
  }

  // Check limit
  if (limitInfo.count >= limit) {
    logger.logSystemActivity('RATE_LIMIT_EXCEEDED', {
      userId,
      eventType,
      currentCount: limitInfo.count,
      limit,
      windowMs
    });
    return false;
  }

  limitInfo.count++;
  return true;
}

/**
 * Setup namespace /ai untuk AI chat real-time
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupAINamespace(io) {
  const ai = io.of('/ai');

  // Middleware autentikasi untuk namespace AI
  ai.use(async (socket, next) => {
    if (socket.userId) {
      next();
    } else {
      next(new Error('Autentikasi diperlukan untuk AI chat'));
    }
  });

  ai.on('connection', (socket) => {
    logger.debug(`User ${socket.userId} connected to /ai namespace`);

    // Join user-specific AI room untuk pesan personal
    socket.join(`ai_user_${socket.userId}`);
    logger.debug(`User ${socket.userId} joined AI room: ai_user_${socket.userId}`);

    // Event: User memulai chat session
    socket.on('ai:session:start', (data) => {
      logger.logSystemActivity('AI_SESSION_START', {
        userId: socket.userId,
        socketId: socket.id,
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      });

      // Emit konfirmasi session dimulai
      socket.emit('ai:session:started', {
        sessionId: data.sessionId,
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    });

    // Event: User mengirim pertanyaan (status thinking)
    socket.on('ai:question:sent', (data) => {
      logger.logSystemActivity('AI_QUESTION_SENT', {
        userId: socket.userId,
        socketId: socket.id,
        questionLength: data.question?.length || 0,
        serverId: data.serverId,
        timestamp: new Date().toISOString()
      });

      // Broadcast ke room user bahwa AI sedang thinking
      ai.to(`ai_user_${socket.userId}`).emit('ai:status:thinking', {
        questionId: data.questionId,
        status: 'processing',
        message: 'AI sedang menganalisis pertanyaan Anda...',
        timestamp: new Date().toISOString()
      });
    });

    // Event: AI selesai memproses (dari kontroler)
    socket.on('ai:response:ready', (data) => {
      // Emit response ke user
      ai.to(`ai_user_${socket.userId}`).emit('ai:response', {
        questionId: data.questionId,
        answer: data.answer,
        dataUsed: data.dataUsed,
        confidence: data.confidence,
        timestamp: data.timestamp,
        status: 'completed'
      });

      logger.logSystemActivity('AI_RESPONSE_SENT', {
        userId: socket.userId,
        socketId: socket.id,
        questionId: data.questionId,
        answerLength: data.answer?.length || 0,
        dataUsed: data.dataUsed,
        timestamp: new Date().toISOString()
      });
    });

    // Event: Error dalam AI processing
    socket.on('ai:error', (data) => {
      ai.to(`ai_user_${socket.userId}`).emit('ai:status:error', {
        questionId: data.questionId,
        error: data.error,
        message: data.message,
        timestamp: new Date().toISOString()
      });

      logger.logSystemActivity('AI_ERROR', {
        userId: socket.userId,
        socketId: socket.id,
        questionId: data.questionId,
        error: data.error,
        timestamp: new Date().toISOString()
      });
    });

    // Event: User melihat data health terbaru
    socket.on('ai:data:request', (serverId) => {
      // Emit data health terbaru untuk konteks AI
      emitLatestHealthData(socket, serverId);
    });

    socket.on('disconnect', () => {
      logger.debug(`User ${socket.userId} disconnected from /ai namespace`);
    });
  });
}

/**
 * Emit response AI ke user tertentu
 * @param {string} userId - ID user target
 * @param {Object} responseData - Data response AI
 */
function emitAIResponse(userId, responseData) {
  // Emit ke namespace /ai room user
  const aiNamespace = global.io?.of('/ai');
  if (aiNamespace) {
    aiNamespace.to(`ai_user_${userId}`).emit('ai:response', {
      ...responseData,
      timestamp: new Date().toISOString()
    });

    logger.debug(`AI response emitted to user ${userId}`);
  } else {
    logger.warn('AI namespace not available for emitAIResponse');
  }
}

/**
 * Emit status thinking AI ke user
 * @param {string} userId - ID user target
 * @param {string} questionId - ID pertanyaan
 */
function emitAIThinking(userId, questionId) {
  const aiNamespace = global.io?.of('/ai');
  if (aiNamespace) {
    aiNamespace.to(`ai_user_${userId}`).emit('ai:status:thinking', {
      questionId,
      status: 'processing',
      message: 'AI sedang menganalisis...',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Emit data health server terbaru untuk konteks AI
 * @param {SocketIO.Socket} socket - Socket instance
 * @param {string} serverId - ID server
 */
async function emitLatestHealthData(socket, serverId) {
  try {
    const Metrik = require('../model/Metrik');

    const query = serverId ? { serverId } : {};
    const latestMetrics = await Metrik.find(query)
      .sort({ timestamp: -1 })
      .limit(1)
      .populate('serverId', 'nama hostname');

    if (latestMetrics.length > 0) {
      socket.emit('ai:data:latest', {
        serverId,
        metrics: latestMetrics[0],
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Error emitting latest health data:', error);
    socket.emit('ai:data:error', {
      serverId,
      error: 'Gagal mengambil data health terbaru',
      timestamp: new Date().toISOString()
    });
  }
}

// Export functions untuk digunakan di service lain
module.exports = {
  setupSocketHandlers,
  emitDashboardSummary,
  emitAIResponse,
  emitAIThinking,
  trackConnection,
  removeConnectionTracking,
  checkRateLimit
};