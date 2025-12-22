// Middleware rate limiter menggunakan express-rate-limit
// Untuk mencegah brute force attacks dan abuse API

const rateLimit = require('express-rate-limit');
const { logger } = require('../utilitas/logger');
const { HTTP_STATUS } = require('../utilitas/konstanta');

// Rate limiter untuk login endpoint (sangat ketat)
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 request per IP dalam 15 menit
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit sebelum mencoba lagi.',
      retryAfter: 15 * 60 // detik
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Handler untuk log ketika rate limit tercapai
  handler: (req, res) => {
    logger.logUserActivity('anonymous', 'RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit sebelum mencoba lagi.',
        retryAfter: 15 * 60
      }
    });
  },
  // Skip rate limiting untuk admin (opsional)
  skip: (req, res) => {
    // Bisa skip untuk IP tertentu atau user admin
    // return req.user?.peran === 'admin';
    return false; // Tidak skip untuk siapapun
  }
});

// Rate limiter untuk API umum (lebih longgar)
const limiterApi = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per IP dalam 15 menit
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak request API. Silakan tunggu beberapa saat.',
      retryAfter: 15 * 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logUserActivity(req.user?.id || 'anonymous', 'API_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Terlalu banyak request API. Silakan tunggu beberapa saat.',
        retryAfter: 15 * 60
      }
    });
  }
});

// Rate limiter untuk chat endpoint (lebih longgar dari AI tapi tetap controlled)
const limiterChat = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 100, // Maksimal 100 chat request per user per jam
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak request chat. Silakan tunggu 1 jam sebelum mencoba lagi.',
      retryAfter: 60 * 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logUserActivity(req.user?.id || 'anonymous', 'CHAT_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Terlalu banyak request chat. Silakan tunggu 1 jam sebelum mencoba lagi.',
        retryAfter: 60 * 60
      }
    });
  }
});

// Rate limiter untuk email endpoint (untuk mencegah spam)
const limiterEmail = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 10, // Maksimal 10 email per IP per jam
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak request email. Silakan tunggu 1 jam.',
      retryAfter: 60 * 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logUserActivity(req.user?.id || 'anonymous', 'EMAIL_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Terlalu banyak request email. Silakan tunggu 1 jam.',
        retryAfter: 60 * 60
      }
    });
  }
});

// Rate limiter untuk registrasi (mencegah spam account)
const limiterRegistrasi = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 3, // Maksimal 3 registrasi per IP per jam
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak registrasi. Silakan tunggu 1 jam.',
      retryAfter: 60 * 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logUserActivity('anonymous', 'REGISTRATION_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Terlalu banyak registrasi. Silakan tunggu 1 jam.',
        retryAfter: 60 * 60
      }
    });
  }
});

// Rate limiter untuk dashboard/metrics (karena real-time)
const limiterDashboard = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 30, // Maksimal 30 request per IP per menit
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak request dashboard. Silakan tunggu 1 menit.',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logUserActivity(req.user?.id || 'anonymous', 'DASHBOARD_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Terlalu banyak request dashboard. Silakan tunggu 1 menit.',
        retryAfter: 60
      }
    });
  }
});

// Middleware untuk skip rate limiting berdasarkan kondisi
function createConditionalLimiter(limiter, skipCondition = null) {
  return (req, res, next) => {
    if (skipCondition && skipCondition(req)) {
      return next();
    }
    limiter(req, res, next);
  };
}

// Rate limiter untuk admin (skip untuk admin users)
const limiterAdmin = createConditionalLimiter(limiterApi, (req) => {
  return req.user?.peran === 'admin';
});

// Fungsi untuk create custom rate limiter
function createCustomLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // default 15 menit
    max: options.max || 100, // default 100 request
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: options.message || 'Terlalu banyak request.',
        retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: options.handler || ((req, res) => {
      logger.logUserActivity(req.user?.id || 'anonymous', 'CUSTOM_RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        endpoint: req.url,
        windowMs: options.windowMs,
        max: options.max
      });
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: options.message || 'Terlalu banyak request.',
          retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000)
        }
      });
    })
  });
}

// Export semua rate limiters
module.exports = {
  // Named limiters
  limiterLogin,
  limiterApi,

  limiterChat,
  limiterEmail,
  limiterRegistrasi,
  limiterDashboard,
  limiterAdmin,
  createCustomLimiter,
  createConditionalLimiter,

  // Backwards-compatible aliases expected by route modules
  apiLimiter: limiterApi,
  limiterGeneral: limiterApi
};