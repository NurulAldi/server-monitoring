// Kontroler untuk mengelola operasi pengguna (authentication, profil)
// Handle request/response untuk endpoint pengguna

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananAutentikasi = require('../layanan/layananAutentikasi');

// Registrasi pengguna baru
async function registrasi(req, res) {
  try {
    const { email, kataSandi } = req.body;

    // Log aktivitas registrasi
    logger.logUserActivity('anonymous', 'REGISTRATION_ATTEMPT', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Panggil layanan autentikasi untuk registrasi (email and password only)
    const hasil = await layananAutentikasi.registrasi(email, kataSandi);

    // Log berhasil registrasi
    logger.logUserActivity(hasil.pengguna.id, 'REGISTRATION_SUCCESS', {
      email: email,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Registrasi berhasil. Silakan login.',
      data: {
        pengguna: {
          id: hasil.pengguna.id,
          email: hasil.pengguna.email
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error registrasi
    logger.logUserActivity('anonymous', 'REGISTRATION_FAILED', {
      email: req.body.email,
      error: error.message,
      ip: req.ip
    });

    // Handle specific error types
    if (error.message === 'Email sudah terdaftar') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.USER_EXISTS,
          message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Handle duplicate key errors (stale indexes or db constraints)
    if (error && error.code === 11000) {
      const key = (error.keyPattern && Object.keys(error.keyPattern)[0]) || (error.message && (error.message.match(/StaleIndex:([a-zA-Z_]+)/) || [])[1]);
      if (key && key.toLowerCase().includes('namapengguna')) {
        logger.logError('REGISTRATION_FAILED_STALE_INDEX', error, { email: req.body.email, ip: req.ip });
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            code: ERROR_CODE.INTERNAL_ERROR,
            message: 'Server konfigurasi tidak konsisten. Silakan hubungi administrator.',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (key && key.toLowerCase().includes('email')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: ERROR_CODE.USER_EXISTS,
            message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Unknown duplicate key
      logger.logError('REGISTRATION_FAILED_DUPLICATE_KEY', error, { email: req.body.email, ip: req.ip });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODE.INTERNAL_ERROR,
          message: 'Terjadi konflik pada penyimpanan data. Silakan hubungi administrator.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat registrasi. Silakan coba lagi.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Login pengguna
async function login(req, res) {
  try {
    const { email, kataSandi } = req.body;

    // Log aktivitas login
    logger.logUserActivity('anonymous', 'LOGIN_ATTEMPT', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Panggil layanan autentikasi untuk login
    const hasil = await layananAutentikasi.login(email, kataSandi);

    // Set HttpOnly cookie dengan access token for session management
    res.cookie('auth_token', hasil.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Allow cross-origin for dev; use 'strict' in production
      maxAge: 15 * 60 * 1000 // 15 minutes (same as JWT access token)
    });

    // Log berhasil login
    logger.logUserActivity(hasil.pengguna.id, 'LOGIN_SUCCESS', {
      email: email,
      ip: req.ip
    });

    // Response sukses with both token (for client storage) and user data
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        pengguna: {
          id: hasil.pengguna.id,
          email: hasil.pengguna.email,
          peran: hasil.pengguna.peran
        },
        token: hasil.token, // Include token for client-side storage as backup
        expiresIn: 15 * 60 // Token expires in 15 minutes (seconds)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error login
    logger.logUserActivity('anonymous', 'LOGIN_FAILED', {
      email: req.body.email,
      error: error.message,
      ip: req.ip
    });

    // Handle specific error types
    if (error.message === 'Email atau password salah') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_CREDENTIALS,
          message: 'Email atau password salah. Periksa kredensial Anda.',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (error.message === 'Akun belum aktif') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODE.ACCOUNT_INACTIVE,
          message: 'Akun Anda belum aktif. Silakan verifikasi email terlebih dahulu.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat login. Silakan coba lagi.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Logout pengguna
async function logout(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id || 'anonymous';

    // Log aktivitas logout
    logger.logUserActivity(userId, 'LOGOUT', {
      ip: req.ip
    });

    // Panggil layanan autentikasi untuk logout
    if (userId !== 'anonymous') {
      await layananAutentikasi.logout(userId);
    }

    // Clear auth_token cookie (match the cookie name set during login)
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logout berhasil.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error logout
    logger.logUserActivity(req.user?.userId || req.user?.id || 'anonymous', 'LOGOUT_FAILED', {
      error: error.message,
      ip: req.ip
    });

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat logout.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Ambil profil pengguna saat ini
async function ambilProfil(req, res) {
  try {
    const userId = req.user.userId || req.user.id; // Support both formats

    // Log aktivitas ambil profil
    logger.logUserActivity(userId, 'PROFILE_ACCESS', {
      ip: req.ip
    });

    // Panggil layanan autentikasi untuk ambil profil
    const pengguna = await layananAutentikasi.ambilProfil(userId);

    // Response sukses with id, email, and peran
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        pengguna: {
          id: pengguna.id,
          email: pengguna.email,
          peran: pengguna.peran || 'user' // Include peran for consistency
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error ambil profil
    logger.logUserActivity(req.user?.userId || req.user?.id || 'anonymous', 'PROFILE_ACCESS_FAILED', {
      error: error.message,
      ip: req.ip
    });

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat mengambil profil.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Verifikasi token (untuk middleware autentikasi)
async function verifikasiToken(req, res) {
  try {
    // Jika sampai di sini, token sudah valid dari middleware autentikasi
    const userId = req.user.id;

    // Log aktivitas verifikasi token
    logger.logUserActivity(userId, 'TOKEN_VERIFICATION', {
      ip: req.ip
    });

    // Response sukses (only id and email)
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token valid.',
      data: {
        pengguna: {
          id: req.user.id,
          email: req.user.email
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error verifikasi token
    logger.logUserActivity(req.user?.id || 'anonymous', 'TOKEN_VERIFICATION_FAILED', {
      error: error.message,
      ip: req.ip
    });

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat verifikasi token.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export semua fungsi kontroler
module.exports = {
  registrasi,
  login,
  logout,
  ambilProfil,
  verifikasiToken
};