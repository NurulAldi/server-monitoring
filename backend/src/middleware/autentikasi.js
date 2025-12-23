// Middleware untuk autentikasi JWT
// Memverifikasi access token dan menambahkan info user ke request object

const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const Pengguna = require('../model/Pengguna');

// Middleware untuk verifikasi JWT token
function autentikasiToken(req, res, next) {
  try {
    // Ambil token dari header Authorization atau cookie
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ?
      authHeader.substring(7) : null;

    // Fallback to auth_token cookie if no Authorization header
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.MISSING_TOKEN,
          message: 'Token autentikasi diperlukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      let errorMessage = 'Token tidak valid';
      let errorCode = ERROR_CODE.INVALID_TOKEN;

      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token sudah expired';
        errorCode = ERROR_CODE.TOKEN_EXPIRED;
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Token tidak valid';
      } else if (jwtError.name === 'NotBeforeError') {
        errorMessage = 'Token belum aktif';
      }

      // Log unauthorized access attempt
      logger.logSecurityEvent('INVALID_TOKEN_ACCESS', {
        token: token.substring(0, 20) + '...', // Log partial token for debugging
        error: jwtError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method
      });

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validasi payload token (support both `peran` and `role` payload keys)
    const role = decoded.peran || decoded.role;
    if (!decoded.userId || !decoded.email || !role) {
      logger.logSecurityEvent('MALFORMED_TOKEN_PAYLOAD', {
        decoded: decoded,
        ip: req.ip,
        endpoint: req.originalUrl
      });

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: 'Token payload tidak valid',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Tambahkan user info ke request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      peran: role
    };

    // Debug log decoded token during tests (error level to ensure visibility)
    logger.error('autentikasi token decoded', { decoded });

    // Log successful authentication
    logger.logUserActivity(decoded.userId, 'TOKEN_VERIFIED', {
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    // Lanjut ke next middleware/endpoint
    next();

  } catch (error) {
    // Log unexpected error
    logger.logError('AUTHENTICATION_MIDDLEWARE_ERROR', error, {
      ip: req.ip,
      endpoint: req.originalUrl,
      headers: req.headers
    });

    // Response error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat autentikasi',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Middleware untuk verifikasi peran pengguna
function verifikasiPeran(peranDiperlukan) {
  return (req, res, next) => {
    try {
      const userPeran = req.user.peran;

      // Convert peranDiperlukan ke array jika string
      const peranArray = Array.isArray(peranDiperlukan) ? peranDiperlukan : [peranDiperlukan];

      // Cek apakah user memiliki peran yang diperlukan
      if (!peranArray.includes(userPeran)) {
        // Log unauthorized role access
        logger.logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
          userId: req.user.userId,
          userRole: userPeran,
          requiredRoles: peranArray,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip
        });

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: ERROR_CODE.INSUFFICIENT_PERMISSIONS,
            message: 'Tidak memiliki izin untuk mengakses resource ini',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Lanjut ke next middleware/endpoint
      next();

    } catch (error) {
      // Log error
      logger.logError('ROLE_VERIFICATION_ERROR', error, {
        userId: req.user?.userId,
        ip: req.ip,
        endpoint: req.originalUrl
      });

      // Response error
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODE.INTERNAL_ERROR,
          message: 'Terjadi kesalahan saat verifikasi peran',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}

// Middleware untuk cek role user (minimal user biasa)
function cekUser(req, res, next) {
  // Pastikan user sudah terautentikasi
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODE.UNAUTHORIZED,
        message: 'Autentikasi diperlukan.',
        timestamp: new Date().toISOString()
      }
    });
  }

  // User valid, lanjut
  next();
}

// Middleware untuk cek ownership (user hanya bisa akses data sendiri)
function cekOwnership(resourceOwnerId) {
  return (req, res, next) => {
    // Pastikan user sudah terautentikasi
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.UNAUTHORIZED,
          message: 'Autentikasi diperlukan.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cek apakah user adalah owner dari resource
    const isOwner = req.user.id === resourceOwnerId;

    if (!isOwner) {
      logger.logUserActivity(req.user.id, 'OWNERSHIP_ACCESS_DENIED', {
        endpoint: req.url,
        method: req.method,
        ip: req.ip,
        resourceOwnerId: resourceOwnerId,
        isOwner: isOwner
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODE.FORBIDDEN,
          message: 'Akses ditolak. Anda hanya dapat mengakses data sendiri.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // User adalah owner, lanjut
    next();
  };
}

// Middleware untuk optional authentication (endpoint bisa diakses tanpa login)
function autentikasiOpsional(req, res, next) {
  try {
    const token = req.cookies.auth_token;

    if (token) {
      // Ada token, verify dan attach user data
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email
      };
    } else {
      // Tidak ada token, set user ke null
      req.user = null;
    }

    next();
  } catch (error) {
    // Token invalid, tapi karena opsional, lanjut dengan user = null
    req.user = null;
    next();
  }
}

// Middleware untuk refresh token (opsional, untuk future enhancement)
function verifikasiRefreshToken(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.UNAUTHORIZED,
          message: 'Refresh token tidak ditemukan.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Import verifyRefreshToken dari jwt config
    const { verifyRefreshToken: verifyRefresh } = require('../konfigurasi/jwt');
    const decoded = verifyRefresh(refreshToken);

    req.user = {
      id: decoded.id,
      type: 'refresh'
    };

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODE.INVALID_TOKEN,
        message: 'Refresh token tidak valid.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Middleware untuk verifikasi email terverifikasi
async function verifikasiEmail(req, res, next) {
  try {
    const userId = req.user.userId;

    // Cari user dan cek status email verification
    const pengguna = await Pengguna.findById(userId).select('emailTerverifikasi');
    if (!pengguna) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: 'Pengguna tidak ditemukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!pengguna.emailTerverifikasi) {
      // Log unverified email access attempt
      logger.logSecurityEvent('UNVERIFIED_EMAIL_ACCESS', {
        userId: userId,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODE.EMAIL_NOT_VERIFIED,
          message: 'Email belum terverifikasi. Silakan verifikasi email terlebih dahulu.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Lanjut ke next middleware/endpoint
    next();

  } catch (error) {
    // Log error
    logger.logError('EMAIL_VERIFICATION_CHECK_ERROR', error, {
      userId: req.user?.userId,
      ip: req.ip,
      endpoint: req.originalUrl
    });

    // Response error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat verifikasi email',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export semua middleware autentikasi
module.exports = {
  autentikasiToken,
  // Backwards-compatible English aliases
  authenticateToken: autentikasiToken,
  // Indonesian aliases expected by route files
  verifikasiToken: autentikasiToken,
  verifikasiPeran,
  requireRole: verifikasiPeran, // Alias untuk kompatibilitas
  verifikasiEmail,
  verifikasiRefreshToken
};