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

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(kataSandi, saltRounds);

    // Buat pengguna baru
    const penggunaBaru = new Pengguna({
      email: email.toLowerCase().trim(),
      kataSandi: hashedPassword
    });

    // Simpan ke database
    const penggunaTersimpan = await penggunaBaru.save();

    // Generate JWT token (only id and email)
    const token = generateToken({
      id: penggunaTersimpan._id,
      email: penggunaTersimpan.email
    });

    // Log aktivitas
    logger.logUserActivity(penggunaTersimpan._id, 'USER_REGISTERED', {
      email: penggunaTersimpan.email
    });

    return {
      pengguna: {
        id: penggunaTersimpan._id,
        email: penggunaTersimpan.email
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

    // Generate JWT token (only id and email)
    const token = generateToken({
      id: pengguna._id,
      email: pengguna.email
    });

    // Log aktivitas
    logger.logUserActivity(pengguna._id, 'USER_LOGIN', {
      email: pengguna.email,
      ip: 'system' // Will be set by controller
    });

    return {
      pengguna: {
        id: pengguna._id,
        email: pengguna.email
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
      email: pengguna.email
    };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_GET_PROFILE_ERROR', error, {
      userId: userId
    });
    throw error;
  }
}

// Verifikasi dan decode JWT token
      nama: pengguna.nama,
      email: pengguna.email,
      peran: pengguna.peran,
      dibuatPada: pengguna.dibuatPada,
      diperbaruiPada: pengguna.diperbaruiPada,
      terakhirLogin: pengguna.terakhirLogin,
      statusAktif: pengguna.statusAktif
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
    const passwordValid = await bcrypt.compare(passwordLama, pengguna.kataSandi);
    if (!passwordValid) {
      throw new Error('Password lama salah');
    }

    // Hash password baru
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(passwordBaru, saltRounds);

    // Update password
    pengguna.kataSandi = hashedPassword;
    pengguna.diperbaruiPada = new Date();
    await pengguna.save();

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

    // Hash password baru
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(passwordBaru, saltRounds);

    // Update password
    pengguna.kataSandi = hashedPassword;
    pengguna.diperbaruiPada = new Date();
    await pengguna.save();

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