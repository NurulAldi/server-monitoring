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

  kataSandi: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [8, 'Password minimal 8 karakter'],
    select: false // Jangan include password di query default
  },

  // Security tracking for brute force protection
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
}, {
  // Options
  timestamps: false,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Don't include password in JSON output
      delete ret.kataSandi;
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
 * TUJUAN: Reset counter percobaan gagal dan unlock account
 *
 * @returns {Promise<Pengguna>} User yang sudah diupdate
 */
penggunaSchema.methods.recordLoginBerhasil = async function() {
  this.percobaanLoginGagal = 0;
  this.dikunciSampai = null;

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
  this.percobaanLoginGagal += 1;

  // Lock account jika sudah 5 kali gagal (30 menit)
  if (this.percobaanLoginGagal >= 5) {
    this.dikunciSampai = new Date(Date.now() + 30 * 60 * 1000);
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