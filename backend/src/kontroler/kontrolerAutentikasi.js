// Kontroler untuk mengelola operasi autentikasi JWT
// Handle request/response untuk endpoint registrasi, login, logout, dan token management

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger, logUserLogin } = require('../utilitas/logger');
const Pengguna = require('../model/Pengguna');
const layananEmail = require('../layanan/layananEmail');

// Helper function untuk mendeteksi device type
function getDeviceType(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * DESKRIPSI: Handle request registrasi pengguna baru
 *
 * TUJUAN: Membuat akun pengguna baru dengan validasi dan verifikasi email
 *
 * ALUR KERJA:
 * 1. Validasi input (nama, email, password)
 * 2. Cek email sudah terdaftar atau belum
 * 3. Hash password dengan bcrypt
 * 4. Simpan user ke database
 * 5. Generate email verification token
 * 6. Kirim email verifikasi
 * 7. Return response sukses
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.namaPengguna - Username untuk display
 * @param {string} req.body.email - Email pengguna
 * @param {string} req.body.kataSandi - Password pengguna
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON hasil registrasi
 */
async function registrasi(req, res) {
  try {
    const { namaPengguna, email, kataSandi } = req.body;

    // Log aktivitas registrasi
    logger.logUserActivity('anonymous', 'REGISTRATION_ATTEMPT', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Cek apakah email sudah terdaftar
    const penggunaExist = await Pengguna.findOne({ email: email.toLowerCase() });
    if (penggunaExist) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code: ERROR_CODE.ALREADY_EXISTS,
          message: 'Email sudah terdaftar',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cek apakah nama pengguna sudah digunakan
    const namaPenggunaExist = await Pengguna.findOne({ namaPengguna });
    if (namaPenggunaExist) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code: ERROR_CODE.ALREADY_EXISTS,
          message: 'Nama pengguna sudah digunakan',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Hash password
    const saltRounds = 12;
    const kataSandiHash = await bcrypt.hash(kataSandi, saltRounds);

    // Generate email verification token
    const tokenVerifikasi = jwt.sign(
      { email, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Buat pengguna baru
    const penggunaBaru = new Pengguna({
      namaPengguna,
      email: email.toLowerCase(),
      kataSandiHash,
      peran: 'user',
      statusAktif: false,
      emailTerverifikasi: false,
      pengaturanEmail: {
        alertKritis: true,
        alertPeringatan: true,
        ringkasanHarian: true,
        frekuensiNotifikasi: 'immediate'
      }
    });

    // Simpan ke database
    await penggunaBaru.save();

    // Kirim email verifikasi
    try {
      await layananEmail.kirimEmailVerifikasi(email, namaPengguna, tokenVerifikasi);
    } catch (emailError) {
      logger.logError('EMAIL_VERIFICATION_SEND_FAILED', emailError, {
        userId: penggunaBaru._id,
        email: email
      });
      // Jangan fail registrasi jika email gagal, tapi log error
    }

    // Log berhasil registrasi
    logger.logUserActivity(penggunaBaru._id, 'REGISTRATION_SUCCESS', {
      email: email,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Registrasi berhasil. Silakan periksa email untuk verifikasi akun.',
      data: {
        pengguna: {
          id: penggunaBaru._id,
          namaPengguna: penggunaBaru.namaPengguna,
          email: penggunaBaru.email,
          peran: penggunaBaru.peran,
          dibuatPada: penggunaBaru.createdAt
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error registrasi
    logger.logError('REGISTRATION_ERROR', error, {
      email: req.body.email,
      ip: req.ip
    });

    // Response error
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

/**
 * DESKRIPSI: Handle request login pengguna
 *
 * TUJUAN: Autentikasi pengguna dan generate JWT access + refresh tokens
 *
 * ALUR KERJA:
 * 1. Validasi input (email, password)
 * 2. Cari pengguna berdasarkan email
 * 3. Validasi account status (aktif, verified, not locked)
 * 4. Verify password dengan bcrypt
 * 5. Generate JWT access token (15 menit) dan refresh token (7 hari)
 * 6. Simpan refresh token ke database
 * 7. Update last login timestamp
 * 8. Return tokens dan user info
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - Email pengguna
 * @param {string} req.body.kataSandi - Password pengguna
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan JWT tokens
 */
async function login(req, res) {
  try {
    const { email, kataSandi } = req.body;

    // Log aktivitas login
    logger.logUserActivity('anonymous', 'LOGIN_ATTEMPT', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Cari pengguna berdasarkan email
    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() });
    if (!pengguna) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_CREDENTIALS,
          message: 'Email atau kata sandi salah',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cek status account
    if (!pengguna.statusAktif) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.FORBIDDEN,
          message: 'Akun belum aktif. Silakan verifikasi email terlebih dahulu.',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!pengguna.emailTerverifikasi) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.FORBIDDEN,
          message: 'Email belum terverifikasi. Silakan periksa email Anda.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cek account lockout
    if (pengguna.lockedUntil && pengguna.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((pengguna.lockedUntil - new Date()) / 60000); // dalam menit
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.FORBIDDEN,
          message: `Akun terkunci. Coba lagi dalam ${remainingTime} menit.`,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(kataSandi, pengguna.kataSandiHash);
    if (!isPasswordValid) {
      // Log failed login attempt
      logUserLogin(pengguna._id, {
        method: 'password',
        deviceType: getDeviceType(req.get('User-Agent')),
        location: 'unknown',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        failureReason: 'invalid_password'
      });

      // Increment login attempts
      pengguna.loginAttempts = (pengguna.loginAttempts || 0) + 1;

      // Lock account jika attempts terlalu banyak
      if (pengguna.loginAttempts >= 5) {
        pengguna.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 menit
      }

      await pengguna.save();

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_CREDENTIALS,
          message: 'Email atau kata sandi salah',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Reset login attempts dan update last login
    pengguna.loginAttempts = 0;
    pengguna.lockedUntil = undefined;
    pengguna.lastLoginAt = new Date();

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        userId: pengguna._id,
        email: pengguna.email,
        peran: pengguna.peran,
        namaPengguna: pengguna.namaPengguna
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // 15 menit
    );

    const refreshToken = jwt.sign(
      {
        userId: pengguna._id,
        tokenId: Date.now().toString(),
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // 7 hari
    );

    // Simpan refresh token ke database
    pengguna.tokenRefresh.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
      deviceInfo: req.get('User-Agent') || 'Unknown'
    });

    await pengguna.save();

    // Log berhasil login
    logUserLogin(pengguna._id, {
      method: 'password',
      deviceType: getDeviceType(req.get('User-Agent')),
      location: 'unknown', // Could be enhanced with geo-IP lookup
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      sessionId: Date.now().toString()
    });

    // Response sukses dengan tokens
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        pengguna: {
          id: pengguna._id,
          namaPengguna: pengguna.namaPengguna,
          email: pengguna.email,
          peran: pengguna.peran,
          lastLoginAt: pengguna.lastLoginAt
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresIn: 15 * 60, // 15 menit dalam detik
          tokenType: 'Bearer'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error login
    logger.logError('LOGIN_ERROR', error, {
      email: req.body.email,
      ip: req.ip
    });

    // Response error
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

/**
 * DESKRIPSI: Handle request logout pengguna
 *
 * TUJUAN: Revoke refresh token untuk logout pengguna dari device tertentu
 * atau semua devices (jika tidak specify refresh token)
 *
 * ALUR KERJA:
 * 1. Ambil user ID dari JWT access token
 * 2. Jika ada refresh token di body, revoke token tersebut
 * 3. Jika tidak ada refresh token, revoke semua refresh tokens user
 * 4. Log aktivitas logout
 * 5. Return konfirmasi logout
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body (optional)
 * @param {string} req.body.refreshToken - Refresh token untuk direvoke
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi logout
 */
async function logout(req, res) {
  try {
    const userId = req.user.userId;
    const { refreshToken } = req.body;

    // Log aktivitas logout
    logger.logUserActivity(userId, 'LOGOUT_ATTEMPT', {
      ip: req.ip,
      hasRefreshToken: !!refreshToken
    });

    const pengguna = await Pengguna.findById(userId);
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

    if (refreshToken) {
      // Revoke specific refresh token
      pengguna.tokenRefresh = pengguna.tokenRefresh.filter(
        token => token.token !== refreshToken
      );
    } else {
      // Revoke all refresh tokens (logout from all devices)
      pengguna.tokenRefresh = [];
    }

    await pengguna.save();

    // Log berhasil logout
    logger.logUserActivity(userId, 'LOGOUT_SUCCESS', {
      ip: req.ip,
      revokedAll: !refreshToken
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: refreshToken ?
        'Logout berhasil dari device ini.' :
        'Logout berhasil dari semua devices.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error logout
    logger.logError('LOGOUT_ERROR', error, {
      userId: req.user?.userId,
      ip: req.ip
    });

    // Response error
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

/**
 * DESKRIPSI: Handle request refresh access token
 *
 * TUJUAN: Generate access token baru menggunakan refresh token yang valid
 *
 * ALUR KERJA:
 * 1. Validasi refresh token dari request body
 * 2. Verify refresh token dengan JWT_REFRESH_SECRET
 * 3. Cek refresh token ada di database dan belum expired
 * 4. Generate access token baru
 * 5. Return access token baru
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.refreshToken - Refresh token yang valid
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON dengan access token baru
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    // Log aktivitas refresh token
    logger.logUserActivity('anonymous', 'TOKEN_REFRESH_ATTEMPT', {
      ip: req.ip
    });

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: 'Refresh token tidak valid',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cek refresh token di database
    const pengguna = await Pengguna.findById(decoded.userId);
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

    // Cek refresh token ada di database dan belum expired
    const tokenData = pengguna.tokenRefresh.find(
      token => token.token === refreshToken && token.expiresAt > new Date()
    );

    if (!tokenData) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: 'Refresh token expired atau tidak ditemukan',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate access token baru
    const accessToken = jwt.sign(
      {
        userId: pengguna._id,
        email: pengguna.email,
        peran: pengguna.peran,
        namaPengguna: pengguna.namaPengguna
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Log berhasil refresh token
    logger.logUserActivity(pengguna._id, 'TOKEN_REFRESH_SUCCESS', {
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Access token berhasil di-refresh.',
      data: {
        accessToken: accessToken,
        expiresIn: 15 * 60, // 15 menit dalam detik
        tokenType: 'Bearer'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error refresh token
    logger.logError('TOKEN_REFRESH_ERROR', error, {
      ip: req.ip
    });

    // Response error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat refresh token.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request verifikasi token
 *
 * TUJUAN: Validasi status autentikasi pengguna dan return info user
 *
 * ALUR KERJA:
 * 1. Token sudah diverifikasi oleh middleware autentikasi
 * 2. Ambil info user dari database
 * 3. Return user info dan status autentikasi
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON status autentikasi
 */
async function verifikasiToken(req, res) {
  try {
    const userId = req.user.userId;

    // Log aktivitas verifikasi token
    logger.logUserActivity(userId, 'TOKEN_VERIFICATION', {
      ip: req.ip
    });

    const pengguna = await Pengguna.findById(userId).select('-kataSandiHash -tokenRefresh');

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

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token valid.',
      data: {
        pengguna: {
          id: pengguna._id,
          namaPengguna: pengguna.namaPengguna,
          email: pengguna.email,
          peran: pengguna.peran,
          statusAktif: pengguna.statusAktif,
          emailTerverifikasi: pengguna.emailTerverifikasi
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error verifikasi token
    logger.logError('TOKEN_VERIFICATION_ERROR', error, {
      userId: req.user?.userId,
      ip: req.ip
    });

    // Response error
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

/**
 * DESKRIPSI: Handle request lupa kata sandi
 *
 * TUJUAN: Kirim email dengan link reset password
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body.email - Email pengguna
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi email terkirim
 */
async function lupaKataSandi(req, res) {
  try {
    const { email } = req.body;

    // Log aktivitas lupa password
    logger.logUserActivity('anonymous', 'PASSWORD_RESET_REQUEST', {
      email: email,
      ip: req.ip
    });

    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() });
    if (!pengguna) {
      // Jangan expose bahwa email tidak terdaftar
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Jika email terdaftar, link reset password akan dikirim.',
        timestamp: new Date().toISOString()
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: pengguna._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Kirim email reset password
    try {
      await layananEmail.kirimEmailResetPassword(email, pengguna.namaPengguna, resetToken);
    } catch (emailError) {
      logger.logError('PASSWORD_RESET_EMAIL_FAILED', emailError, {
        userId: pengguna._id,
        email: email
      });
    }

    // Log berhasil
    logger.logUserActivity(pengguna._id, 'PASSWORD_RESET_EMAIL_SENT', {
      email: email,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Jika email terdaftar, link reset password akan dikirim.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logError('PASSWORD_RESET_REQUEST_ERROR', error, {
      email: req.body.email,
      ip: req.ip
    });

    // Response error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat memproses request reset password.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * DESKRIPSI: Handle request reset kata sandi
 *
 * TUJUAN: Reset password menggunakan token dari email
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.token - Reset token dari email
 * @param {string} req.body.kataSandiBaru - Password baru
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Response JSON konfirmasi password direset
 */
async function resetKataSandi(req, res) {
  try {
    const { token, kataSandiBaru } = req.body;

    // Log aktivitas reset password
    logger.logUserActivity('anonymous', 'PASSWORD_RESET_ATTEMPT', {
      ip: req.ip
    });

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
    } catch (jwtError) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: 'Token reset password tidak valid atau expired',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cari pengguna
    const pengguna = await Pengguna.findById(decoded.userId);
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

    // Hash password baru
    const saltRounds = 12;
    const kataSandiHashBaru = await bcrypt.hash(kataSandiBaru, saltRounds);

    // Update password dan revoke semua refresh tokens
    pengguna.kataSandiHash = kataSandiHashBaru;
    pengguna.tokenRefresh = [];
    pengguna.updatedAt = new Date();

    await pengguna.save();

    // Log berhasil
    logger.logUserActivity(pengguna._id, 'PASSWORD_RESET_SUCCESS', {
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Kata sandi berhasil direset. Silakan login dengan kata sandi baru.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error
    logger.logError('PASSWORD_RESET_ERROR', error, {
      ip: req.ip
    });

    // Response error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat reset kata sandi.',
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
  refreshToken,
  verifikasiToken,
  lupaKataSandi,
  resetKataSandi
};