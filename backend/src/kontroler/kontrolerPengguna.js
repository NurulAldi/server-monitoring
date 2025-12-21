// Kontroler untuk mengelola operasi pengguna (authentication, profil)
// Handle request/response untuk endpoint pengguna

const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const layananAutentikasi = require('../layanan/layananAutentikasi');

// Registrasi pengguna baru
async function registrasi(req, res) {
  try {
    const { nama, email, kataSandi } = req.body;

    // Log aktivitas registrasi
    logger.logUserActivity('anonymous', 'REGISTRATION_ATTEMPT', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Panggil layanan autentikasi untuk registrasi
    const hasil = await layananAutentikasi.registrasi(nama, email, kataSandi);

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
          nama: hasil.pengguna.nama,
          email: hasil.pengguna.email,
          peran: hasil.pengguna.peran,
          dibuatPada: hasil.pengguna.dibuatPada
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

    // Handle error berdasarkan tipe
    if (error.message === 'Email sudah terdaftar') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code: ERROR_CODE.USER_EXISTS,
          message: error.message,
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

    // Set cookie dengan token JWT
    res.cookie('token', hasil.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
    });

    // Log berhasil login
    logger.logUserActivity(hasil.pengguna.id, 'LOGIN_SUCCESS', {
      email: email,
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        pengguna: {
          id: hasil.pengguna.id,
          nama: hasil.pengguna.nama,
          email: hasil.pengguna.email,
          peran: hasil.pengguna.peran,
          terakhirLogin: hasil.pengguna.terakhirLogin
        }
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

    // Handle error berdasarkan tipe
    if (error.message === 'Email atau password salah') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_CREDENTIALS,
          message: error.message,
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
    const userId = req.user.id;

    // Log aktivitas logout
    logger.logUserActivity(userId, 'LOGOUT', {
      ip: req.ip
    });

    // Panggil layanan autentikasi untuk logout
    await layananAutentikasi.logout(userId);

    // Clear cookie token
    res.clearCookie('token');

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logout berhasil.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error logout
    logger.logUserActivity(req.user?.id || 'anonymous', 'LOGOUT_FAILED', {
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
    const userId = req.user.id;

    // Log aktivitas ambil profil
    logger.logUserActivity(userId, 'PROFILE_ACCESS', {
      ip: req.ip
    });

    // Panggil layanan autentikasi untuk ambil profil
    const pengguna = await layananAutentikasi.ambilProfil(userId);

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        pengguna: {
          id: pengguna.id,
          nama: pengguna.nama,
          email: pengguna.email,
          peran: pengguna.peran,
          dibuatPada: pengguna.dibuatPada,
          terakhirLogin: pengguna.terakhirLogin,
          statusAktif: pengguna.statusAktif
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error ambil profil
    logger.logUserActivity(req.user?.id || 'anonymous', 'PROFILE_ACCESS_FAILED', {
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

// Update profil pengguna
async function updateProfil(req, res) {
  try {
    const userId = req.user.id;
    const { nama, email } = req.body;

    // Log aktivitas update profil
    logger.logUserActivity(userId, 'PROFILE_UPDATE_ATTEMPT', {
      ip: req.ip,
      changes: { nama, email }
    });

    // Panggil layanan autentikasi untuk update profil
    const pengguna = await layananAutentikasi.updateProfil(userId, { nama, email });

    // Log berhasil update
    logger.logUserActivity(userId, 'PROFILE_UPDATE_SUCCESS', {
      ip: req.ip
    });

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        pengguna: {
          id: pengguna.id,
          nama: pengguna.nama,
          email: pengguna.email,
          peran: pengguna.peran,
          diperbaruiPada: pengguna.diperbaruiPada
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error update profil
    logger.logUserActivity(req.user?.id || 'anonymous', 'PROFILE_UPDATE_FAILED', {
      error: error.message,
      ip: req.ip
    });

    // Handle error berdasarkan tipe
    if (error.message === 'Email sudah digunakan oleh pengguna lain') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code: ERROR_CODE.USER_EXISTS,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Error umum
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Terjadi kesalahan saat memperbarui profil.',
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

    // Response sukses
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token valid.',
      data: {
        pengguna: {
          id: req.user.id,
          nama: req.user.nama,
          email: req.user.email,
          peran: req.user.peran
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
  updateProfil,
  verifikasiToken
};