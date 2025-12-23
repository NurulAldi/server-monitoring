// Layanan untuk mengelola autentikasi pengguna
// Business logic untuk registrasi, login, JWT token management

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Pengguna = require('../model/Pengguna');
const { generateToken, verifyToken } = require('../konfigurasi/jwt');
const { logger } = require('../utilitas/logger');
const { ERROR_CODE } = require('../utilitas/konstanta');

// Registrasi pengguna baru
async function registrasi(email, kataSandi) {
  try {
    // Cek apakah email sudah terdaftar
    const penggunaAda = await Pengguna.findOne({ email: email.toLowerCase() });
    if (penggunaAda) {
      throw new Error('Email sudah terdaftar');
    }

    // Buat pengguna baru
    // Store plaintext kataSandi and let model pre-save middleware hash it once
    const penggunaBaru = new Pengguna({
      email: email.toLowerCase().trim(),
      kataSandi: kataSandi
    });

    // Simpan ke database
    let penggunaTersimpan;
    try {
      penggunaTersimpan = await penggunaBaru.save();
    } catch (saveErr) {
      // Handle Mongo duplicate key errors (e.g., stale unique index on namaPengguna or duplicate email)
      if (saveErr && saveErr.code === 11000) {
        // Try to detect duplicated field
        const duplicateKey = (saveErr.keyPattern && Object.keys(saveErr.keyPattern)[0]) ||
                             (saveErr.keyValue && Object.keys(saveErr.keyValue)[0]) ||
                             (saveErr.message && (saveErr.message.match(/index: ([^ ]+)_\d+/) || [])[1]);

        if (duplicateKey && duplicateKey.toLowerCase().includes('email')) {
          // Surface as a friendly error for controller to map
          throw new Error('Email sudah terdaftar');
        }

        if (duplicateKey && duplicateKey.toLowerCase().includes('namapengguna')) {
          const err = new Error('StaleIndex:namaPengguna');
          err.code = 11000;
          throw err;
        }

        // Unknown duplicate key: return generic duplicate key error
        const err = new Error('Duplicate key error');
        err.code = 11000;
        throw err;
      }

      // Other save errors — rethrow
      throw saveErr;
    }

    // Generate JWT token with userId, email, and peran fields
    const token = generateToken({
      id: penggunaTersimpan._id,
      email: penggunaTersimpan.email,
      peran: 'user' // Default role for all users
    });

    // Log aktivitas
    logger.logUserActivity(penggunaTersimpan._id, 'USER_REGISTERED', {
      email: penggunaTersimpan.email
    });

    return {
      pengguna: {
        id: penggunaTersimpan._id,
        email: penggunaTersimpan.email,
        peran: 'user' // Include peran in response for frontend
      },
      token: token
    };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_REGISTRATION_ERROR', error, {
      email: email
    });
    throw error;
  }
}

// Login pengguna
async function login(email, kataSandi) {
  try {
    // Cari pengguna berdasarkan email (include password for verification)
    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() }).select('+kataSandi');
    if (!pengguna) {
      throw new Error('Email atau password salah');
    }

    // Cek apakah akun dikunci
    if (pengguna.adalahAkunDikunci) {
      throw new Error('Akun dikunci sementara karena terlalu banyak percobaan login gagal');
    }

    // Verifikasi password
    const passwordValid = await pengguna.verifikasiPassword(kataSandi);
    if (!passwordValid) {
      // Record login gagal
      await pengguna.recordLoginGagal();
      throw new Error('Email atau password salah');
    }

    // Record login berhasil
    await pengguna.recordLoginBerhasil();

    // Generate JWT token with userId, email, and peran fields
    const token = generateToken({
      id: pengguna._id,
      email: pengguna.email,
      peran: 'user' // Default role for all users
    });

    // Log aktivitas
    logger.logUserActivity(pengguna._id, 'USER_LOGIN', {
      email: pengguna.email,
      ip: 'system' // Will be set by controller
    });

    return {
      pengguna: {
        id: pengguna._id,
        email: pengguna.email,
        peran: 'user' // Include peran in response for frontend
      },
      token: token
    };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_LOGIN_ERROR', error, {
      email: email
    });
    throw error;
  }
}

// Logout pengguna (invalidate token)
async function logout(userId) {
  try {
    // Dalam implementasi ini, logout hanya dilakukan di client side
    // dengan menghapus cookie token. Server side tidak menyimpan
    // daftar token yang valid/invalid untuk performa.

    // Namun kita bisa menambahkan token ke blacklist jika diperlukan
    // Untuk saat ini, cukup log aktivitas saja

    logger.logUserActivity(userId, 'USER_LOGOUT', {});

    return { success: true };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_LOGOUT_ERROR', error, {
      userId: userId
    });
    throw error;
  }
}

// Ambil profil pengguna
async function ambilProfil(userId) {
  try {
    const pengguna = await Pengguna.findById(userId)
      .select('-kataSandi') // Exclude password
      .lean();

    if (!pengguna) {
      throw new Error('Pengguna tidak ditemukan');
    }

    return {
      id: pengguna._id,
      email: pengguna.email,
      peran: 'user' // Include peran for consistency
    };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_GET_PROFILE_ERROR', error, {
      userId: userId
    });
    throw error;
  }
}

// Update profil pengguna
// Verifikasi dan decode JWT token
async function verifikasiTokenUser(token) {
  try {
    const decoded = verifyToken(token);

    // Cek apakah pengguna masih ada
    const pengguna = await Pengguna.findById(decoded.id).select('-kataSandi');
    if (!pengguna) {
      throw new Error('Token tidak valid atau pengguna tidak ditemukan');
    }

    return {
      id: pengguna._id,
      email: pengguna.email
    };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_VERIFY_TOKEN_ERROR', error, {});
    throw error;
  }
}

// Ganti password pengguna
async function gantiPassword(userId, passwordLama, passwordBaru) {
  try {
    const pengguna = await Pengguna.findById(userId);
    if (!pengguna) {
      throw new Error('Pengguna tidak ditemukan');
    }

    // Verifikasi password lama
    const passwordValid = await pengguna.verifikasiPassword(passwordLama);
    if (!passwordValid) {
      throw new Error('Password lama salah');
    }

    // Update password using model helper (handles hashing and reset)
    await pengguna.updatePassword(passwordBaru);

    // Log aktivitas
    logger.logUserActivity(userId, 'USER_PASSWORD_CHANGED', {});

    return { success: true, message: 'Password berhasil diganti' };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_CHANGE_PASSWORD_ERROR', error, {
      userId: userId
    });
    throw error;
  }
}

// Reset password (untuk admin atau fitur lupa password)
async function resetPassword(userId, passwordBaru) {
  try {
    const pengguna = await Pengguna.findById(userId);
    if (!pengguna) {
      throw new Error('Pengguna tidak ditemukan');
    }

    // Update password using model helper (handles hashing and reset)
    await pengguna.updatePassword(passwordBaru);

    // Log aktivitas
    logger.logUserActivity(userId, 'USER_PASSWORD_RESET', {
      resetBy: 'admin' // Bisa disesuaikan
    });

    return { success: true, message: 'Password berhasil direset' };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_RESET_PASSWORD_ERROR', error, {
      userId: userId
    });
    throw error;
  }
}

// Export semua fungsi layanan
module.exports = {
  registrasi,
  login,
  logout,
  ambilProfil,
  verifikasiTokenUser,
  gantiPassword,
  resetPassword
};