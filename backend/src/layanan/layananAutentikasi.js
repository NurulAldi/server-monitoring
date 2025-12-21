// Layanan untuk mengelola autentikasi pengguna
// Business logic untuk registrasi, login, JWT token management

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Pengguna = require('../model/Pengguna');
const { generateToken, verifyToken } = require('../konfigurasi/jwt');
const { logger } = require('../utilitas/logger');
const { ERROR_CODE } = require('../utilitas/konstanta');

// Registrasi pengguna baru
async function registrasi(nama, email, kataSandi) {
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
      nama: nama.trim(),
      email: email.toLowerCase().trim(),
      kataSandi: hashedPassword,
      peran: 'user', // Default role
      statusAktif: true
    });

    // Simpan ke database
    const penggunaTersimpan = await penggunaBaru.save();

    // Generate JWT token
    const token = generateToken({
      id: penggunaTersimpan._id,
      nama: penggunaTersimpan.nama,
      email: penggunaTersimpan.email,
      peran: penggunaTersimpan.peran
    });

    // Log aktivitas
    logger.logUserActivity(penggunaTersimpan._id, 'USER_REGISTERED', {
      email: penggunaTersimpan.email,
      role: penggunaTersimpan.peran
    });

    return {
      pengguna: {
        id: penggunaTersimpan._id,
        nama: penggunaTersimpan.nama,
        email: penggunaTersimpan.email,
        peran: penggunaTersimpan.peran,
        dibuatPada: penggunaTersimpan.dibuatPada
      },
      token: token
    };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_REGISTRATION_ERROR', error, {
      email: email,
      name: nama
    });
    throw error;
  }
}

// Login pengguna
async function login(email, kataSandi) {
  try {
    // Cari pengguna berdasarkan email
    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() });
    if (!pengguna) {
      throw new Error('Email atau password salah');
    }

    // Cek apakah pengguna aktif
    if (!pengguna.statusAktif) {
      throw new Error('Akun tidak aktif. Silakan hubungi administrator.');
    }

    // Verifikasi password
    const passwordValid = await bcrypt.compare(kataSandi, pengguna.kataSandi);
    if (!passwordValid) {
      throw new Error('Email atau password salah');
    }

    // Update waktu terakhir login
    pengguna.terakhirLogin = new Date();
    await pengguna.save();

    // Generate JWT token
    const token = generateToken({
      id: pengguna._id,
      nama: pengguna.nama,
      email: pengguna.email,
      peran: pengguna.peran
    });

    // Log aktivitas
    logger.logUserActivity(pengguna._id, 'USER_LOGIN', {
      email: pengguna.email,
      ip: 'system' // Will be set by controller
    });

    return {
      pengguna: {
        id: pengguna._id,
        nama: pengguna.nama,
        email: pengguna.email,
        peran: pengguna.peran,
        terakhirLogin: pengguna.terakhirLogin
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
async function updateProfil(userId, dataUpdate) {
  try {
    const { nama, email } = dataUpdate;

    // Jika email diupdate, cek apakah sudah digunakan user lain
    if (email) {
      const penggunaAda = await Pengguna.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });

      if (penggunaAda) {
        throw new Error('Email sudah digunakan oleh pengguna lain');
      }
    }

    // Update data pengguna
    const updateData = {};
    if (nama) updateData.nama = nama.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    updateData.diperbaruiPada = new Date();

    const pengguna = await Pengguna.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-kataSandi');

    if (!pengguna) {
      throw new Error('Pengguna tidak ditemukan');
    }

    // Log aktivitas
    logger.logUserActivity(userId, 'USER_PROFILE_UPDATED', {
      changes: Object.keys(updateData)
    });

    return {
      id: pengguna._id,
      nama: pengguna.nama,
      email: pengguna.email,
      peran: pengguna.peran,
      diperbaruiPada: pengguna.diperbaruiPada
    };

  } catch (error) {
    logger.logSystemError('AUTH_SERVICE_UPDATE_PROFILE_ERROR', error, {
      userId: userId,
      updateData: dataUpdate
    });
    throw error;
  }
}

// Verifikasi dan decode JWT token
async function verifikasiTokenUser(token) {
  try {
    const decoded = verifyToken(token);

    // Cek apakah pengguna masih ada dan aktif
    const pengguna = await Pengguna.findById(decoded.id).select('-kataSandi');
    if (!pengguna || !pengguna.statusAktif) {
      throw new Error('Token tidak valid atau pengguna tidak aktif');
    }

    return {
      id: pengguna._id,
      nama: pengguna.nama,
      email: pengguna.email,
      peran: pengguna.peran
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
  updateProfil,
  verifikasiTokenUser,
  gantiPassword,
  resetPassword
};