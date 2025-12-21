// Model untuk data Pengguna
// Schema MongoDB untuk menyimpan informasi user aplikasi

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * DESKRIPSI: Schema untuk menyimpan data pengguna aplikasi
 *
 * TUJUAN: Menyimpan informasi lengkap user untuk authentication,
 * authorization, dan tracking aktivitas.
 *
 * STRUKTUR DATA:
 * - Informasi personal: nama, email, password
 * - Status akun: aktif/nonaktif, role
 * - Tracking: timestamps, last login
 * - Security: password hashing, account status
 *
 * ALASAN DESIGN:
 * - Email unique untuk login
 * - Password hashed dengan bcrypt untuk security
 * - Role-based access control
 * - Account status untuk disable user
 */
const penggunaSchema = new mongoose.Schema({
  // Informasi personal
  nama: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter'],
    minlength: [2, 'Nama minimal 2 karakter']
  },

  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [255, 'Email maksimal 255 karakter'],
    validate: {
      validator: function(v) {
        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(v);
      },
      message: 'Format email tidak valid'
    }
  },

  kataSandi: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [8, 'Password minimal 8 karakter'],
    select: false // Jangan include password di query default
  },

  // Status dan role
  peran: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Peran tidak valid'
    },
    default: 'user'
  },

  statusAktif: {
    type: Boolean,
    default: true
  },

  // Tracking aktivitas
  terakhirLogin: {
    type: Date,
    default: null
  },

  // Metadata
  dibuatPada: {
    type: Date,
    default: Date.now
  },

  diperbaruiPada: {
    type: Date,
    default: Date.now
  },

  // Security tracking
  percobaanLoginGagal: {
    type: Number,
    default: 0,
    min: 0,
    max: 5 // Max 5 percobaan gagal
  },

  dikunciSampai: {
    type: Date,
    default: null
  },

  // Pengaturan email dan notifikasi
  pengaturanEmail: {
    // Notifikasi alert server
    alertKritis: {
      type: Boolean,
      default: true
    },
    alertPeringatan: {
      type: Boolean,
      default: true
    },
    alertRecovery: {
      type: Boolean,
      default: true
    },

    // Frekuensi notifikasi
    frekuensiNotifikasi: {
      type: String,
      enum: {
        values: ['immediate', 'hourly', 'daily', 'weekly'],
        message: 'Frekuensi notifikasi tidak valid'
      },
      default: 'immediate'
    },

    // Ringkasan periodik
    ringkasanHarian: {
      type: Boolean,
      default: true
    },
    ringkasanMingguan: {
      type: Boolean,
      default: true
    },

    // Rekomendasi AI
    rekomendasiAi: {
      type: Boolean,
      default: true
    },

    // Zona waktu untuk scheduling
    zonaWaktu: {
      type: String,
      default: 'Asia/Jakarta'
    }
  },

  // Status email
  emailTerverifikasi: {
    type: Boolean,
    default: false
  },

  tokenVerifikasiEmail: {
    type: String,
    default: null,
    select: false
  },

  tokenVerifikasiEmailExpired: {
    type: Date,
    default: null,
    select: false
  },

  // Tracking email dan notifikasi
  statistikEmail: {
    totalEmailTerkirim: {
      type: Number,
      default: 0
    },
    emailTerakhirDikirim: {
      type: Date,
      default: null
    },
    emailGagal: {
      type: Number,
      default: 0
    }
  },
}, {
  // Options
  timestamps: false, // Manual timestamps
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Jangan include password dan token reset di JSON output
      delete ret.kataSandi;
      delete ret.tokenResetPassword;
      delete ret.tokenResetPasswordExpired;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

/**
 * DESKRIPSI: Virtual untuk cek apakah akun dikunci
 *
 * TUJUAN: Mengecek apakah user sedang dalam status account lock
 * karena terlalu banyak percobaan login gagal.
 *
 * @returns {boolean} True jika akun dikunci
 */
penggunaSchema.virtual('adalahAkunDikunci').get(function() {
  if (!this.dikunciSampai) return false;
  return new Date() < this.dikunciSampai;
});

/**
 * DESKRIPSI: Virtual untuk menghitung hari sejak terakhir login
 *
 * TUJUAN: Mengetahui apakah user masih aktif menggunakan aplikasi.
 *
 * @returns {number} Hari sejak terakhir login, atau null jika belum pernah login
 */
penggunaSchema.virtual('hariSejakLoginTerakhir').get(function() {
  if (!this.terakhirLogin) return null;

  const sekarang = new Date();
  const terakhirLogin = new Date(this.terakhirLogin);
  const selisihMs = sekarang - terakhirLogin;
  const selisihHari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));

  return selisihHari;
});

/**
 * DESKRIPSI: Method untuk verifikasi password
 *
 * TUJUAN: Membandingkan password input dengan hash yang tersimpan.
 * Method ini aman dari timing attack.
 *
 * @param {string} passwordInput - Password plaintext dari user
 * @returns {Promise<boolean>} True jika password cocok
 */
penggunaSchema.methods.verifikasiPassword = async function(passwordInput) {
  return await bcrypt.compare(passwordInput, this.kataSandi);
};

/**
 * DESKRIPSI: Method untuk update password
 *
 * TUJUAN: Mengganti password user dengan yang baru.
 * Password akan di-hash sebelum disimpan.
 *
 * @param {string} passwordBaru - Password baru plaintext
 * @returns {Promise<Pengguna>} User yang sudah diupdate
 */
penggunaSchema.methods.updatePassword = async function(passwordBaru) {
  // Hash password baru
  const saltRounds = 12;
  this.kataSandi = await bcrypt.hash(passwordBaru, saltRounds);

  // Reset security tracking
  this.percobaanLoginGagal = 0;
  this.dikunciSampai = null;

  // Update timestamp
  this.diperbaruiPada = new Date();

  return await this.save();
};

/**
 * DESKRIPSI: Method untuk record login berhasil
 *
 * TUJUAN: Update tracking login dan reset counter percobaan gagal.
 *
 * @returns {Promise<Pengguna>} User yang sudah diupdate
 */
penggunaSchema.methods.recordLoginBerhasil = async function() {
  this.terakhirLogin = new Date();
  this.percobaanLoginGagal = 0;
  this.dikunciSampai = null;
  this.diperbaruiPada = new Date();

  return await this.save();
};

/**
 * DESKRIPSI: Method untuk record login gagal
 *
 * TUJUAN: Increment counter percobaan gagal dan lock account jika perlu.
 *
 * @returns {Promise<Pengguna>} User yang sudah diupdate
 */
penggunaSchema.methods.recordLoginGagal = async function() {
  this.percobaanLoginGagal += 1;

  // Lock account jika sudah 5 kali gagal
  if (this.percobaanLoginGagal >= 5) {
    // Lock selama 30 menit
    this.dikunciSampai = new Date(Date.now() + 30 * 60 * 1000);
  }

  this.diperbaruiPada = new Date();

  return await this.save();
};

/**
 * DESKRIPSI: Method untuk generate reset password token
 *
 * TUJUAN: Membuat token untuk fitur lupa password.
 *
 * @returns {Promise<string>} Token reset password
 */
penggunaSchema.methods.generateResetPasswordToken = async function() {
  // Generate random token
  const token = require('crypto').randomBytes(32).toString('hex');

  // Hash token sebelum simpan
  this.tokenResetPassword = await bcrypt.hash(token, 10);
  this.tokenResetPasswordExpired = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

  await this.save();

  return token; // Return token plaintext untuk dikirim ke email
};

/**
 * DESKRIPSI: Method untuk verifikasi reset password token
 *
 * TUJUAN: Validasi token reset password dari email link.
 *
 * @param {string} token - Token dari email
 * @returns {Promise<boolean>} True jika token valid
 */
penggunaSchema.methods.verifikasiResetPasswordToken = async function(token) {
  if (!this.tokenResetPassword || !this.tokenResetPasswordExpired) {
    return false;
  }

  // Cek apakah token expired
  if (new Date() > this.tokenResetPasswordExpired) {
    return false;
  }

  // Verify token
  return await bcrypt.compare(token, this.tokenResetPassword);
};

/**
 * DESKRIPSI: Method untuk clear reset password token
 *
 * TUJUAN: Menghapus token setelah digunakan atau expired.
 *
 * @returns {Promise<Pengguna>} User yang sudah diupdate
 */
penggunaSchema.methods.clearResetPasswordToken = async function() {
  this.tokenResetPassword = null;
  this.tokenResetPasswordExpired = null;

  return await this.save();
};

/**
 * DESKRIPSI: Static method untuk mencari user berdasarkan email
 *
 * TUJUAN: Helper method untuk query user dengan case-insensitive email.
 *
 * @param {string} email - Email user
 * @returns {Query} Mongoose query
 */
penggunaSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * DESKRIPSI: Static method untuk mendapatkan statistik user
 *
 * TUJUAN: Menghitung statistik pengguna untuk dashboard admin.
 *
 * @returns {Object} Statistik pengguna
 */
penggunaSchema.statics.getStatistikPengguna = async function() {
  const statistik = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPengguna: { $sum: 1 },
        penggunaAktif: {
          $sum: { $cond: ['$statusAktif', 1, 0] }
        },
        penggunaAdmin: {
          $sum: { $cond: [{ $eq: ['$peran', 'admin'] }, 1, 0] }
        },
        penggunaDikunci: {
          $sum: { $cond: ['$dikunciSampai', 1, 0] }
        },
        rataRataPercobaanGagal: { $avg: '$percobaanLoginGagal' }
      }
    }
  ]);

  if (statistik.length === 0) {
    return {
      totalPengguna: 0,
      penggunaAktif: 0,
      penggunaAdmin: 0,
      penggunaDikunci: 0,
      rataRataPercobaanGagal: 0
    };
  }

  return statistik[0];
};

/**
 * DESKRIPSI: Pre-save middleware untuk hash password
 *
 * TUJUAN: Otomatis hash password ketika password diubah.
 */
penggunaSchema.pre('save', async function(next) {
  // Update timestamp
  this.diperbaruiPada = new Date();

  // Hash password jika diubah
  if (this.isModified('kataSandi')) {
    const saltRounds = 12;
    this.kataSandi = await bcrypt.hash(this.kataSandi, saltRounds);
  }

  next();
});

/**
 * DESKRIPSI: Index untuk performa query
 *
 * ALASAN INDEX:
 * - email: Login query (paling sering)
 * - peran: Role-based queries
 * - statusAktif: Filter active users
 * - terakhirLogin: Analytics queries
 */
penggunaSchema.index({ email: 1 }, { unique: true }); // Email unique
penggunaSchema.index({ peran: 1 }); // Role filtering
penggunaSchema.index({ statusAktif: 1 }); // Active users
penggunaSchema.index({ terakhirLogin: -1 }); // Recent logins

// Export model
const Pengguna = mongoose.model('Pengguna', penggunaSchema);
module.exports = Pengguna;