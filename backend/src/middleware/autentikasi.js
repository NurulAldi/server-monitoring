// Middleware autentikasi menggunakan JWT
// Memverifikasi token JWT dari cookie dan attach user data ke request

const { verifyToken } = require('../konfigurasi/jwt');
const { HTTP_STATUS, ERROR_CODE, PERAN_PENGGUNA } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');

// Middleware untuk verifikasi JWT token
function verifikasiToken(req, res, next) {
  try {
    // Ambil token dari cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.UNAUTHORIZED,
          message: 'Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user data ke request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      peran: decoded.peran
    };

    // Log aktivitas user
    logger.logUserActivity(decoded.id, 'TOKEN_VERIFIED', {
      endpoint: req.url,
      method: req.method,
      ip: req.ip
    });

    // Lanjut ke middleware/controller berikutnya
    next();

  } catch (error) {
    // Handle berbagai jenis error JWT
    let statusCode = HTTP_STATUS.UNAUTHORIZED;
    let errorCode = ERROR_CODE.INVALID_TOKEN;
    let message = 'Token autentikasi tidak valid.';

    if (error.message.includes('expired')) {
      errorCode = ERROR_CODE.TOKEN_EXPIRED;
      message = 'Token autentikasi sudah expired. Silakan login ulang.';
    }

    // Log error
    logger.logError(error, {
      endpoint: req.url,
      method: req.method,
      ip: req.ip,
      tokenPresent: !!req.cookies.token
    });

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Middleware untuk cek role admin
function cekAdmin(req, res, next) {
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

  // Cek apakah user memiliki role admin
  if (req.user.peran !== PERAN_PENGGUNA.ADMIN) {
    logger.logUserActivity(req.user.id, 'ADMIN_ACCESS_DENIED', {
      endpoint: req.url,
      method: req.method,
      ip: req.ip,
      requiredRole: PERAN_PENGGUNA.ADMIN,
      userRole: req.user.peran
    });

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: {
        code: ERROR_CODE.FORBIDDEN,
        message: 'Akses ditolak. Hanya admin yang dapat mengakses fitur ini.',
        timestamp: new Date().toISOString()
      }
    });
  }

  // User adalah admin, lanjut
  next();
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

  // Cek apakah user memiliki role yang valid
  const validRoles = [PERAN_PENGGUNA.USER, PERAN_PENGGUNA.ADMIN];
  if (!validRoles.includes(req.user.peran)) {
    logger.logUserActivity(req.user.id, 'INVALID_ROLE_ACCESS', {
      endpoint: req.url,
      method: req.method,
      ip: req.ip,
      userRole: req.user.peran,
      validRoles: validRoles
    });

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: {
        code: ERROR_CODE.FORBIDDEN,
        message: 'Role pengguna tidak valid.',
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
    const isAdmin = req.user.peran === PERAN_PENGGUNA.ADMIN;

    if (!isOwner && !isAdmin) {
      logger.logUserActivity(req.user.id, 'OWNERSHIP_ACCESS_DENIED', {
        endpoint: req.url,
        method: req.method,
        ip: req.ip,
        resourceOwnerId: resourceOwnerId,
        isOwner: isOwner,
        isAdmin: isAdmin
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

    // User adalah owner atau admin, lanjut
    next();
  };
}

// Middleware untuk optional authentication (endpoint bisa diakses tanpa login)
function autentikasiOpsional(req, res, next) {
  try {
    const token = req.cookies.token;

    if (token) {
      // Ada token, verify dan attach user data
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        peran: decoded.peran
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

// Export semua middleware autentikasi
module.exports = {
  verifikasiToken,
  cekAdmin,
  cekUser,
  cekOwnership,
  autentikasiOpsional,
  verifikasiRefreshToken
};