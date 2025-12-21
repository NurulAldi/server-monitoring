// Model untuk Riwayat Chat AI
// Schema MongoDB untuk menyimpan riwayat percakapan dengan AI monitoring

const mongoose = require('mongoose');

/**
 * DESKRIPSI: Schema untuk menyimpan riwayat chat AI
 *
 * TUJUAN: Menyimpan semua interaksi user dengan AI untuk:
 * - Audit trail dan compliance
 * - Analisis performa AI
 * - Evaluasi sistem
 * - Improvement AI berdasarkan feedback
 *
 * STRUKTUR DATA:
 * - Metadata sesi chat
 * - Array pesan lengkap
 * - Data analisis AI
 * - Audit information
 *
 * ALASAN DESIGN:
 * - Time-series data untuk analisis historis
 * - Indexing untuk query cepat berdasarkan user dan waktu
 * - TTL untuk auto-cleanup data lama
 * - Encrypted fields untuk data sensitif
 */
const riwayatChatAISchema = new mongoose.Schema({
  // Metadata Sesi Chat
  sessionId: {
    type: String,
    required: [true, 'Session ID wajib diisi'],
    unique: true,
    index: true
  },

  // Relasi dengan User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pengguna',
    required: [true, 'User ID wajib diisi'],
    index: true
  },

  // Relasi dengan Server (opsional)
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    index: true
  },

  // Timestamp
  timestampMulai: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  timestampSelesai: {
    type: Date,
    index: true
  },

  durasiDetik: {
    type: Number,
    min: [0, 'Durasi minimal 0 detik']
  },

  // Status Sesi
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'error', 'timeout', 'cancelled'],
      message: 'Status sesi tidak valid'
    },
    default: 'active',
    index: true
  },

  // Array Pesan
  pesan: [{
    id: {
      type: String,
      required: true
    },
    tipe: {
      type: String,
      enum: ['user', 'ai', 'system'],
      required: true
    },
    konten: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    questionId: {
      type: String
    },
    dataUsed: [{
      type: {
        type: String,
        enum: ['cpu_usage', 'memory_usage', 'disk_usage', 'network_in', 'network_out', 'load_average']
      },
      value: mongoose.Schema.Types.Mixed,
      unit: String,
      timestamp: Date
    }],
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],

  // Metadata AI Processing
  aiMetadata: {
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    tokensDigunakan: {
      type: Number,
      min: 0
    },
    confidenceRataRata: {
      type: Number,
      min: 0,
      max: 1
    },
    totalProcessingTimeMs: {
      type: Number,
      min: 0
    },
    errorCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Data Analisis
  analisisData: {
    kategoriPertanyaan: [{
      type: String,
      enum: ['status', 'analisis', 'troubleshooting', 'edukasi', 'umum']
    }],
    metrikDigunakan: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Metrik'
    }],
    skorKesehatanSaatAnalisis: {
      type: Number,
      min: 0,
      max: 100
    },
    rekomendasiDiberikan: [{
      type: String
    }],
    totalPertanyaan: {
      type: Number,
      default: 0,
      min: 0
    },
    totalJawabanAI: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Audit & Security
  auditInfo: {
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    zonaWaktu: {
      type: String,
      default: 'Asia/Jakarta'
    },
    validasiStatus: {
      type: String,
      enum: ['passed', 'blocked', 'warning'],
      default: 'passed'
    },
    blockedReason: {
      type: String
    },
    apiCalls: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Error Information (jika ada)
  errorInfo: {
    type: {
      type: String,
      enum: ['validation', 'api', 'timeout', 'network', 'internal']
    },
    message: String,
    stack: String,
    timestamp: Date
  }

}, {
  timestamps: true,
  collection: 'riwayat_chat_ai'
});

/**
 * INDEXING STRATEGI OPTIMASI
 *
 * 1. Primary compound index untuk dashboard user
 * 2. Time-series indexes untuk analisis temporal
 * 3. Status & error indexes untuk monitoring
 * 4. TTL index untuk data retention (1 tahun)
 * 5. Text index untuk search dalam pesan
 */
riwayatChatAISchema.index({ userId: 1, timestampMulai: -1 }); // Primary user dashboard
riwayatChatAISchema.index({ sessionId: 1 }, { unique: true }); // Session lookup
riwayatChatAISchema.index({ status: 1, timestampMulai: -1 }); // Status monitoring
riwayatChatAISchema.index({ serverId: 1, timestampMulai: -1 }); // Server-specific queries
riwayatChatAISchema.index({ 'analisisData.kategoriPertanyaan': 1, timestampMulai: -1 }); // Category analysis
riwayatChatAISchema.index({ 'auditInfo.validasiStatus': 1, timestampMulai: -1 }); // Security monitoring
riwayatChatAISchema.index({ timestampMulai: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // TTL 1 tahun

// Text index untuk search dalam konten pesan
riwayatChatAISchema.index({
  'pesan.konten': 'text',
  'pesan.tipe': 1
}, {
  weights: { 'pesan.konten': 10 },
  name: 'text_pesan'
});

/**
 * VIRTUALS & METHODS
 */

// Virtual untuk total pesan
riwayatChatAISchema.virtual('totalPesan').get(function() {
  return this.pesan ? this.pesan.length : 0;
});

// Virtual untuk durasi format
riwayatChatAISchema.virtual('durasiFormat').get(function() {
  if (!this.durasiDetik) return null;

  const jam = Math.floor(this.durasiDetik / 3600);
  const menit = Math.floor((this.durasiDetik % 3600) / 60);
  const detik = this.durasiDetik % 60;

  if (jam > 0) {
    return `${jam}j ${menit}m ${detik}d`;
  } else if (menit > 0) {
    return `${menit}m ${detik}d`;
  } else {
    return `${detik}d`;
  }
});

/**
 * STATICS METHODS
 */

// Cari riwayat chat user dengan pagination
riwayatChatAISchema.statics.cariRiwayatUser = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  return this.find({ userId })
    .populate('userId', 'nama email')
    .populate('serverId', 'nama hostname')
    .sort({ timestampMulai: -1 })
    .skip(skip)
    .limit(limit)
    .select('-auditInfo.ipAddress -auditInfo.userAgent'); // Exclude sensitive data
};

// Hitung statistik chat user
riwayatChatAISchema.statics.statistikUser = function(userId, startDate, endDate) {
  const matchStage = { userId };
  if (startDate && endDate) {
    matchStage.timestampMulai = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSesi: { $sum: 1 },
        totalPesan: { $sum: { $size: '$pesan' } },
        rataDurasi: { $avg: '$durasiDetik' },
        totalTokens: { $sum: '$aiMetadata.tokensDigunakan' },
        errorCount: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
        kategoriBreakdown: {
          $push: '$analisisData.kategoriPertanyaan'
        }
      }
    },
    {
      $project: {
        totalSesi: 1,
        totalPesan: 1,
        rataDurasi: 1,
        totalTokens: 1,
        errorRate: { $divide: ['$errorCount', '$totalSesi'] },
        kategoriPopuler: {
          $reduce: {
            input: '$kategoriBreakdown',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: {
                    $map: {
                      input: '$$this',
                      as: 'kategori',
                      in: { k: '$$kategori', v: 1 }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Cari pola pertanyaan umum
riwayatChatAISchema.statics.analisisPolaPertanyaan = function(startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.timestampMulai = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$pesan' },
    { $match: { 'pesan.tipe': 'user' } },
    {
      $group: {
        _id: '$pesan.konten',
        count: { $sum: 1 },
        users: { $addToSet: '$userId' },
        firstSeen: { $min: '$timestampMulai' },
        lastSeen: { $max: '$timestampMulai' }
      }
    },
    {
      $project: {
        pertanyaan: '$_id',
        frekuensi: '$count',
        uniqueUsers: { $size: '$users' },
        firstSeen: 1,
        lastSeen: 1,
        trending: {
          $cond: {
            if: { $gte: ['$count', 5] },
            then: true,
            else: false
          }
        }
      }
    },
    { $sort: { frekuensi: -1 } },
    { $limit: 50 }
  ]);
};

/**
 * INSTANCE METHODS
 */

// Selesaikan sesi chat
riwayatChatAISchema.methods.selesaikanSesi = function(status = 'completed') {
  this.status = status;
  this.timestampSelesai = new Date();

  if (this.timestampMulai && this.timestampSelesai) {
    this.durasiDetik = Math.floor((this.timestampSelesai - this.timestampMulai) / 1000);
  }

  return this.save();
};

// Tambah pesan ke sesi
riwayatChatAISchema.methods.tambahPesan = function(pesanData) {
  if (!this.pesan) {
    this.pesan = [];
  }

  // Generate ID jika tidak ada
  if (!pesanData.id) {
    pesanData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Set timestamp jika tidak ada
  if (!pesanData.timestamp) {
    pesanData.timestamp = new Date();
  }

  this.pesan.push(pesanData);

  // Update statistik
  this.analisisData.totalPertanyaan = this.pesan.filter(p => p.tipe === 'user').length;
  this.analisisData.totalJawabanAI = this.pesan.filter(p => p.tipe === 'ai').length;

  return this.save();
};

// Update AI metadata
riwayatChatAISchema.methods.updateAIMetadata = function(metadata) {
  if (!this.aiMetadata) {
    this.aiMetadata = {};
  }

  Object.assign(this.aiMetadata, metadata);

  // Hitung confidence rata-rata
  const aiMessages = this.pesan.filter(p => p.tipe === 'ai' && p.confidence);
  if (aiMessages.length > 0) {
    this.aiMetadata.confidenceRataRata = aiMessages.reduce((sum, msg) => sum + msg.confidence, 0) / aiMessages.length;
  }

  return this.save();
};

// Log error
riwayatChatAISchema.methods.logError = function(errorType, message, stack = null) {
  this.status = 'error';
  this.errorInfo = {
    type: errorType,
    message: message,
    stack: stack,
    timestamp: new Date()
  };

  this.aiMetadata.errorCount = (this.aiMetadata.errorCount || 0) + 1;

  return this.save();
};

const RiwayatChatAI = mongoose.model('RiwayatChatAI', riwayatChatAISchema);

module.exports = RiwayatChatAI;