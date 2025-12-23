// Model untuk data Pengguna
// Schema MongoDB untuk menyimpan informasi user aplikasi

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * DESKRIPSI: Simplified schema for user authentication and SMTP alerts
 *
 * TUJUAN: Store minimal user data - only email/password for auth
 * and email for SMTP server health notifications
 *
 * STRUKTUR DATA:
 * - Email: unique identifier for login and SMTP destination
 * - Password: hashed with bcrypt for security
 * - Alert settings: email notification preferences
 * - Security: login attempt tracking, account lock
 *
 * ALASAN DESIGN:
 * - Email only - no profile data needed
 * - Alert settings kept for SMTP notification control
 * - Security features for protection against brute force
 */
const penggunaSchema = new mongoose.Schema({
  // Email for login and SMTP notifications
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

  // Password (hashed)
  kataSandi: {
    type: String,
    // Required only if legacy hash is not present (support creating legacy records with kataSandiHash)
    required: [function() { return !this.kataSandiHash; }, 'Password wajib diisi'],
    minlength: [8, 'Password minimal 8 karakter'],
    select: false // Jangan include password di query default
  },

  // Backwards-compatible: some older records might have kataSandiHash field
  kataSandiHash: {
    type: String,
    select: false,
    required: false
  },

  // Security tracking for brute force protection (both legacy and current fields)
  percobaanLoginGagal: {
    type: Number,
    default: 0,
    min: 0,
    max: 5 // Max 5 percobaan gagal
  },

  loginAttempts: {
    type: Number,
    default: 0,
    min: 0
  },

  dikunciSampai: {
    type: Date,
    default: null
  },

  lockedUntil: {
    type: Date,
    default: null
  },

  // Account status fields expected by controller
  statusAktif: {
    type: Boolean,
    default: true
  },

  emailTerverifikasi: {
    type: Boolean,
    default: true
  },

  // Email verification token (used during registration flow)
  tokenVerifikasi: {
    type: String,
    select: false,
    default: null
  },

  tokenVerifikasiExpires: {
    type: Date,
    default: null
  },

  // Refresh tokens for session management
  tokenRefresh: [
    {
      token: { type: String },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date },
      deviceInfo: { type: String }
    }
  ],

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
}, {
  // Options
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Don't include password in JSON output
      delete ret.kataSandi;
      delete ret.kataSandiHash;
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
 * DESKRIPSI: Method untuk verifikasi password
 *
 * TUJUAN: Membandingkan password input dengan hash yang tersimpan.
 * Method ini aman dari timing attack.
 *
 * @param {string} passwordInput - Password plaintext dari user
 * @returns {Promise<boolean>} True jika password cocok
 */
penggunaSchema.methods.verifikasiPassword = async function(passwordInput) {
  // Support both current `kataSandi` field and legacy `kataSandiHash` field
  const hash = this.kataSandi || this.kataSandiHash || '';
  if (!hash) return false;
  try {
    return await bcrypt.compare(passwordInput, hash);
  } catch (err) {
    return false;
  }
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
  this.kataSandiHash = undefined; // drop legacy field if present

  // Reset security tracking (both legacy and current fields)
  this.percobaanLoginGagal = 0;
  this.loginAttempts = 0;
  this.dikunciSampai = null;
  this.lockedUntil = null;

  // Update timestamp
  this.updatedAt = new Date();

  return await this.save();
};

/**
 * DESKRIPSI: Method untuk record login berhasil
 *
 * TUJUAN: Reset counter percobaan gagal dan unlock account
 *
 * @returns {Promise<Pengguna>} User yang sudah diupdate
 */
penggunaSchema.methods.recordLoginBerhasil = async function() {
  // Reset both legacy and current counters
  this.percobaanLoginGagal = 0;
  this.loginAttempts = 0;

  this.dikunciSampai = null;
  this.lockedUntil = null;

  this.lastLoginAt = new Date();

  return await this.save();
};

/**
 * DESKRIPSI: Method untuk record login gagal
 *
 * TUJUAN: Increment counter percobaan gagal dan lock account jika perlu
 *
 * @returns {Promise<Pengguna>} User yang sudah diupdate
 */
penggunaSchema.methods.recordLoginGagal = async function() {
  // Increment both legacy and current counters
  this.percobaanLoginGagal = (this.percobaanLoginGagal || 0) + 1;
  this.loginAttempts = (this.loginAttempts || 0) + 1;

  // Lock account jika sudah 5 kali gagal (30 menit)
  if ((this.percobaanLoginGagal >= 5) || (this.loginAttempts >= 5)) {
    const until = new Date(Date.now() + 30 * 60 * 1000);
    this.dikunciSampai = until;
    this.lockedUntil = until;
  }

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
 * DESKRIPSI: Pre-save middleware untuk hash password
 *
 * TUJUAN: Otomatis hash password ketika password diubah
 */
penggunaSchema.pre('save', async function(next) {
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
 * - email: Login query (most frequent)
 */
penggunaSchema.index({ email: 1 }, { unique: true }); // Email unique for login



// Export model
const Pengguna = mongoose.model('Pengguna', penggunaSchema);
module.exports = Pengguna;