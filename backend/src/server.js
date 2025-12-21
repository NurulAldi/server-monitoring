// Server utama Express.js untuk aplikasi monitoring health server
// Setup aplikasi Express dengan semua middleware, routes, dan konfigurasi

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');

// Import konfigurasi dan utilitas
const { connectDatabase } = require('./konfigurasi/database');
const { logger } = require('./utilitas/logger');
const { HTTP_STATUS, ERROR_CODE } = require('./utilitas/konstanta');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const ruteUtama = require('./rute/index');
const rutePengguna = require('./rute/rutePengguna');
const ruteServer = require('./rute/ruteServer');
const ruteMetrik = require('./rute/ruteMetrik');
const ruteAlert = require('./rute/ruteAlert');
const ruteChat = require('./rute/ruteChat');
const ruteKonfigurasi = require('./rute/ruteKonfigurasi');
const ruteAgregasi = require('./rute/ruteAgregasi');
const ruteStatusServer = require('./rute/ruteStatusServer');

// Import Socket.IO handlers
const { setupSocketHandlers } = require('./socket/index');

// Import scheduler untuk data generator
const { inisialisasiPenjadwal } = require('./penjadwal/penjadwalGeneratorData');

// Import scheduler untuk agregasi metrik
const penjadwalAgregasiMetrik = require('./penjadwal/penjadwalAgregasiMetrik');

// Import layanan status server
const layananStatusServer = require('./layanan/layananStatusServer');

// Buat aplikasi Express
const app = express();

// Buat HTTP server
const server = http.createServer(app);

// Setup Socket.IO dengan CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware keamanan dan parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression()); // Kompresi response
app.use(cookieParser()); // Parsing cookie
app.use(express.json({ limit: '10mb' })); // Parsing JSON dengan limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parsing URL-encoded

// Rate limiting global (opsional, bisa ditambah per route)
// app.use(rateLimiter.limiterGlobal);

// Logging middleware untuk setiap request
app.use((req, res, next) => {
  const start = Date.now();

  // Log request masuk
  logger.logSystemActivity('REQUEST_IN', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });

  // Log response keluar
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logSystemActivity('REQUEST_OUT', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous'
    });
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/', ruteUtama); // Rute utama untuk health check dan status
app.use('/api/pengguna', rutePengguna);
app.use('/api/server', ruteServer);
app.use('/api/metrik', ruteMetrik);
app.use('/api/alert', ruteAlert);
app.use('/api/chat', ruteChat);
app.use('/api/konfigurasi', ruteKonfigurasi);
app.use('/api/agregasi', ruteAgregasi);
app.use('/api/status-server', ruteStatusServer);

// 404 handler untuk route yang tidak ditemukan
app.use('*', (req, res) => {
  logger.logSystemActivity('ROUTE_NOT_FOUND', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODE.NOT_FOUND,
      message: 'Endpoint tidak ditemukan',
      timestamp: new Date().toISOString()
    }
  });
});

// Global error handler (harus di akhir)
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Initialize layananStatusServer with Socket.IO instance
layananStatusServer.setSocketIO(io);

// Initialize layananAlert with Socket.IO instance
const layananAlert = require('./layanan/layananAlert');
layananAlert.setSocketIO(io);

// Initialize layananAgregasiMetrik with Socket.IO instance
const layananAgregasiMetrik = require('./layanan/layananAgregasiMetrik');
layananAgregasiMetrik.setSocketIO(io);

// Fungsi untuk start server
async function startServer() {
  try {
    // Koneksi ke database
    await connectDatabase();
    logger.logSystemActivity('DATABASE_CONNECTED', { status: 'success' });

    // Setup kondisi alert default
    try {
      const kondisiDefault = await layananAlert.buatKondisiAlertDefault();
      logger.logSystemActivity('DEFAULT_ALERT_CONDITIONS_SETUP', {
        conditionsCreated: kondisiDefault.length,
        status: 'success'
      });
    } catch (error) {
      logger.logSystemError('DEFAULT_ALERT_CONDITIONS_SETUP_FAILED', error);
      // Don't fail server startup for this
    }

    // Start scheduler untuk generate data otomatis
    inisialisasiPenjadwal();
    logger.logSystemActivity('SCHEDULER_STARTED', { status: 'success' });

    // Start scheduler untuk agregasi metrik
    await penjadwalAgregasiMetrik.start();
    logger.logSystemActivity('METRICS_AGGREGATION_SCHEDULER_STARTED', { status: 'success' });

    // Start layanan monitoring status server
    await layananStatusServer.start();
    logger.logSystemActivity('SERVER_STATUS_MONITORING_STARTED', { status: 'success' });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.logSystemActivity('SERVER_STARTED', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });

      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    function gracefulShutdown(signal) {
      logger.logSystemActivity('SERVER_SHUTDOWN_INITIATED', {
        signal: signal,
        timestamp: new Date().toISOString()
      });

      console.log('🛑 Received shutdown signal, closing server gracefully...');

      server.close(async () => {
        console.log('✅ HTTP server closed');

        // Stop schedulers
        penjadwalAgregasiMetrik.stop();
        console.log('✅ Metrics aggregation scheduler stopped');

        layananStatusServer.stop();
        console.log('✅ Server status monitoring stopped');

        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();

        console.log('✅ Database connection closed');
        console.log('👋 Server shutdown complete');

        logger.logSystemActivity('SERVER_SHUTDOWN_COMPLETE', {
          timestamp: new Date().toISOString()
        });

        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    }

  } catch (error) {
    logger.logSystemError('SERVER_START_FAILED', error, {
      port: process.env.PORT || 5000
    });

    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export untuk testing atau penggunaan modular
module.exports = { app, server, io, startServer };

// Start server jika file ini dijalankan langsung
if (require.main === module) {
  startServer();
}