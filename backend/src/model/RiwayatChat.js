// Model untuk data Riwayat Chat
// Schema MongoDB untuk menyimpan percakapan user dengan AI

const mongoose = require('mongoose');

/**
 * DESKRIPSI: Schema untuk menyimpan riwayat percakapan user dengan AI
 *
 * TUJUAN: Menyimpan semua interaksi chat untuk audit trail,
 * analisis penggunaan AI, dan referensi future conversations.
 *
 * STRUKTUR DATA:
 * - Referensi user dan server (jika ada)
 * - Pertanyaan dan jawaban AI
 * - Metadata performa (response time)
 * - Timestamp dan sumber data
 *
 * ALASAN DESIGN:
 * - Ownership per user untuk privacy
 * - Response time tracking untuk monitoring AI performance
 * - Sumber data untuk analisis konteks pertanyaan
 * - Text indexing untuk search functionality
 */
const riwayatChatSchema = new mongoose.Schema({
  // Referensi ke user yang bertanya
  pengguna: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pengguna',
    required: [true, 'Pengguna wajib diisi'],
    index: true // Index untuk query berdasarkan user
  },

  // Pertanyaan dari user
  pertanyaan: {
    type: String,
    required: [true, 'Pertanyaan wajib diisi'],
    trim: true,
    maxlength: [1000, 'Pertanyaan maksimal 1000 karakter'],
    text: true // Enable text search
  },

  // Jawaban dari AI
  jawaban: {
    type: String,
    required: [true, 'Jawaban AI wajib diisi'],
    maxlength: [10000, 'Jawaban maksimal 10000 karakter'],
    text: true // Enable text search
  },

  // Referensi ke server (optional - jika pertanyaan spesifik server)
  idServer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    default: null,
    index: true // Index untuk query berdasarkan server
  },

  // Sumber data untuk analisis
  sumberData: {
    type: String,
    enum: {
      values: ['general', 'server_specific'],
      message: 'Sumber data tidak valid'
    },
    default: 'general'
  },

  // Performa AI response
  waktuResponse: {
    type: Number, // Dalam milidetik
    min: [0, 'Waktu response tidak boleh negatif'],
    required: [true, 'Waktu response wajib diisi']
  },

  // Provider AI yang digunakan (untuk analisis)
  providerAi: {
    type: String,
    enum: {
      values: ['openai', 'gemini', 'ollama'],
      message: 'Provider AI tidak valid'
    },
    default: 'openai'
  },

  // Rating dari user (optional - untuk feedback)
  rating: {
    type: Number,
    min: [1, 'Rating minimal 1'],
    max: [5, 'Rating maksimal 5'],
    default: null
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Index untuk sorting dan range queries
  }
}, {
  // Options
  timestamps: false, // Manual timestamp
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * DESKRIPSI: Virtual untuk menghitung panjang percakapan
 *
 * TUJUAN: Menghitung total karakter pertanyaan + jawaban
 * untuk analisis usage dan performa.
 *
 * @returns {number} Total panjang karakter
 */
riwayatChatSchema.virtual('panjangPercakapan').get(function() {
  return this.pertanyaan.length + this.jawaban.length;
});

/**
 * DESKRIPSI: Virtual untuk kategori response time
 *
 * TUJUAN: Mengkategorikan performa AI response untuk monitoring.
 *
 * @returns {string} Kategori: 'cepat', 'normal', 'lambat'
 */
riwayatChatSchema.virtual('kategoriResponseTime').get(function() {
  const waktu = this.waktuResponse;

  if (waktu < 1000) return 'cepat';      // < 1 detik
  if (waktu < 3000) return 'normal';     // 1-3 detik
  return 'lambat';                       // > 3 detik
});

/**
 * DESKRIPSI: Method untuk memberikan rating pada chat
 *
 * TUJUAN: Memungkinkan user memberikan feedback pada response AI
 * untuk analisis kualitas dan improvement.
 *
 * @param {number} nilaiRating - Rating 1-5
 * @returns {Promise<RiwayatChat>} Riwayat chat yang sudah diupdate
 */
riwayatChatSchema.methods.berikanRating = async function(nilaiRating) {
  if (nilaiRating < 1 || nilaiRating > 5) {
    throw new Error('Rating harus antara 1-5');
  }

  this.rating = nilaiRating;
  return await this.save();
};

/**
 * DESKRIPSI: Static method untuk mendapatkan statistik chat per user
 *
 * TUJUAN: Menghitung statistik penggunaan AI per user
 * untuk dashboard dan analisis.
 *
 * @param {string} userId - ID user
 * @param {Date} dariTanggal - Tanggal mulai (optional)
 * @param {Date} sampaiTanggal - Tanggal akhir (optional)
 * @returns {Object} Statistik chat user
 */
riwayatChatSchema.statics.getStatistikUser = async function(userId, dariTanggal = null, sampaiTanggal = null) {
  const matchConditions = { pengguna: userId };

  // Filter berdasarkan tanggal jika diberikan
  if (dariTanggal || sampaiTanggal) {
    matchConditions.timestamp = {};
    if (dariTanggal) matchConditions.timestamp.$gte = dariTanggal;
    if (sampaiTanggal) matchConditions.timestamp.$lte = sampaiTanggal;
  }

  const statistik = await this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalChat: { $sum: 1 },
        rataRataResponseTime: { $avg: '$waktuResponse' },
        totalKarakter: { $sum: { $add: [{ $strLenCP: '$pertanyaan' }, { $strLenCP: '$jawaban' }] } },
        chatDenganServer: {
          $sum: { $cond: [{ $ne: ['$idServer', null] }, 1, 0] }
        },
        chatGeneral: {
          $sum: { $cond: [{ $eq: ['$idServer', null] }, 1, 0] }
        },
        rataRataRating: { $avg: { $ifNull: ['$rating', null] } },
        chatTerakhir: { $max: '$timestamp' }
      }
    }
  ]);

  if (statistik.length === 0) {
    return {
      totalChat: 0,
      rataRataResponseTime: 0,
      totalKarakter: 0,
      chatDenganServer: 0,
      chatGeneral: 0,
      rataRataRating: null,
      chatTerakhir: null
    };
  }

  return statistik[0];
};

/**
 * DESKRIPSI: Static method untuk cleanup riwayat lama
 *
 * TUJUAN: Menghapus riwayat chat yang sudah terlalu lama
 * untuk mengelola storage database.
 *
 * @param {number} hariThreshold - Threshold dalam hari
 * @returns {Object} Summary penghapusan
 */
riwayatChatSchema.statics.cleanupRiwayatLama = async function(hariThreshold = 90) {
  const tanggalThreshold = new Date();
  tanggalThreshold.setDate(tanggalThreshold.getDate() - hariThreshold);

  const hasil = await this.deleteMany({
    timestamp: { $lt: tanggalThreshold }
  });

  return {
    jumlahDihapus: hasil.deletedCount,
    hariThreshold: hariThreshold,
    tanggalThreshold: tanggalThreshold
  };
};

/**
 * DESKRIPSI: Pre-save middleware untuk validasi
 *
 * TUJUAN: Validasi data sebelum disimpan ke database.
 */
riwayatChatSchema.pre('save', function(next) {
  // Validasi panjang pertanyaan minimal
  if (this.pertanyaan.length < 5) {
    const error = new Error('Pertanyaan terlalu pendek');
    return next(error);
  }

  // Validasi waktu response reasonable
  if (this.waktuResponse < 0 || this.waktuResponse > 60000) { // Max 1 menit
    const error = new Error('Waktu response tidak valid');
    return next(error);
  }

  next();
});

/**
 * DESKRIPSI: Index untuk performa query
 *
 * ALASAN INDEX:
 * - pengguna + timestamp: Query riwayat per user (paling sering)
 * - idServer: Filter berdasarkan server
 * - timestamp: Range queries untuk cleanup
 * - Text index: Search dalam pertanyaan/jawaban
 */
riwayatChatSchema.index({ pengguna: 1, timestamp: -1 }); // User history
riwayatChatSchema.index({ idServer: 1 }); // Server-specific chats
riwayatChatSchema.index({ timestamp: 1 }); // Cleanup queries
riwayatChatSchema.index({ sumberData: 1 }); // Analytics

// Text index untuk search
riwayatChatSchema.index({
  pertanyaan: 'text',
  jawaban: 'text'
}, {
  weights: {
    pertanyaan: 10, // Pertanyaan lebih penting untuk search
    jawaban: 5
  },
  name: 'text_search_index'
});

// Export model
const RiwayatChat = mongoose.model('RiwayatChat', riwayatChatSchema);
module.exports = RiwayatChat;