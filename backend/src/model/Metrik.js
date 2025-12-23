// Model untuk data Metrik Server
// Schema MongoDB untuk menyimpan data performa server yang dikumpulkan

const mongoose = require('mongoose');
const { STATUS_OK, STATUS_WARNING, STATUS_CRITICAL } = require('../utilitas/konstanta');

/**
 * DESKRIPSI: Schema untuk menyimpan data metrics performa server
 *
 * TUJUAN: Menyimpan data performa server yang dikumpulkan secara periodik
 * untuk analisis kesehatan server, trend performa, dan alerting.
 *
 * STRUKTUR DATA:
 * - Referensi server: id server yang dimonitor
 * - Metrics utama: CPU, Memory, Disk, Network
 * - Status kesehatan: status berdasarkan threshold
 * - Metadata: timestamp pengumpulan, durasi response
 *
 * ALASAN DESIGN:
 * - Time-series data untuk analisis historis
 * - Indexing pada serverId dan timestamp untuk query cepat
 * - Status computed untuk alerting otomatis
 * - Network metrics terpisah untuk analisis bandwidth
 * - TTL index untuk auto-cleanup data lama
 */
const metrikSchema = new mongoose.Schema({
  // Referensi ke server yang dimonitor
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: [true, 'Server ID wajib diisi'],
    index: true
  },

  // Timestamp pengumpulan data
  timestampPengumpulan: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Metrics CPU
  cpu: {
    persentase: {
      type: Number,
      required: [true, 'Persentase CPU wajib diisi'],
      min: [0, 'Persentase CPU minimal 0'],
      max: [100, 'Persentase CPU maksimal 100']
    }
  },

  // Metrics Memory (RAM)
  memori: {
    persentase: {
      type: Number,
      required: [true, 'Persentase memori wajib diisi'],
      min: [0, 'Persentase memori minimal 0'],
      max: [100, 'Persentase memori maksimal 100']
    },
    digunakan: {
      type: Number, // dalam MB
      required: [true, 'Memori digunakan wajib diisi'],
      min: [0, 'Memori digunakan minimal 0']
    },
    total: {
      type: Number, // dalam MB
      required: [true, 'Total memori wajib diisi'],
      min: [1, 'Total memori minimal 1']
    }
  },

  // Metrics Disk Storage
  disk: {
    persentase: {
      type: Number,
      required: [true, 'Persentase disk wajib diisi'],
      min: [0, 'Persentase disk minimal 0'],
      max: [100, 'Persentase disk maksimal 100']
    },
    digunakan: {
      type: Number, // dalam GB
      required: [true, 'Disk digunakan wajib diisi'],
      min: [0, 'Disk digunakan minimal 0']
    },
    total: {
      type: Number, // dalam GB
      required: [true, 'Total disk wajib diisi'],
      min: [1, 'Total disk minimal 1']
    }
  },

  // Metrics Temperature
  suhu: {
    celsius: {
      type: Number,
      required: [true, 'Suhu wajib diisi'],
      min: [0, 'Suhu minimal 0'],
      max: [150, 'Suhu maksimal 150']
    }
  },

  // Status kesehatan berdasarkan threshold
  statusKesehatan: {
    type: String,
    enum: {
      values: [STATUS_OK, STATUS_WARNING, STATUS_CRITICAL],
      message: 'Status kesehatan tidak valid'
    },
    default: STATUS_OK
  },

  // Skor kesehatan (0-100) untuk AI analysis
  skorKesehatan: {
    type: Number,
    min: [0, 'Skor kesehatan minimal 0'],
    max: [100, 'Skor kesehatan maksimal 100'],
    default: 100
  },

  // Kondisi terdeteksi oleh state machine
  kondisiTerdeteksi: {
    type: String,
    enum: {
      values: ['NORMAL', 'WARNING', 'CRITICAL'],
      message: 'Kondisi terdeteksi tidak valid'
    },
    default: 'NORMAL'
  },

  // Flag untuk event penting
  isEventImportant: {
    type: Boolean,
    default: false
  },

  // Metadata pengumpulan
  metadataPengumpulan: {
    durasiResponseMs: {
      type: Number,
      min: [0, 'Durasi response minimal 0']
    },
    metodePengumpulan: {
      type: String,
      enum: ['agent', 'snmp', 'api', 'manual'],
      default: 'agent'
    },
    versiAgent: {
      type: String,
      trim: true
    },
    zonaWaktu: {
      type: String,
      default: 'Asia/Jakarta'
    }
  }

}, {
  timestamps: true,
  collection: 'metrik'
});

/**
 * INDEXING STRATEGI OPTIMASI
 *
 * 1. Primary time-series index untuk dashboard real-time
 * 2. Status & kondisi indexes untuk alerting
 * 3. TTL index untuk stratified storage (30 hari raw data)
 * 4. Compound indexes untuk query kompleks
 * 5. Partial indexes untuk data penting
 */
metrikSchema.index({ serverId: 1, timestampPengumpulan: -1 }); // Primary time-series
metrikSchema.index({ statusKesehatan: 1, timestampPengumpulan: -1 }); // Alert filtering
metrikSchema.index({ kondisiTerdeteksi: 1, serverId: 1, timestampPengumpulan: -1 }); // State machine queries
metrikSchema.index({ skorKesehatan: 1, timestampPengumpulan: -1 }); // AI analysis
metrikSchema.index({ isEventImportant: 1, timestampPengumpulan: -1 }); // Important events
metrikSchema.index({ serverId: 1, timestampPengumpulan: -1, statusKesehatan: 1 }); // Dashboard compound
metrikSchema.index({ timestampPengumpulan: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL 30 hari

// Partial index untuk data critical saja
metrikSchema.index(
  { serverId: 1, timestampPengumpulan: -1 },
  {
    partialFilterExpression: { kondisiTerdeteksi: 'CRITICAL' },
    name: 'critical_events_partial'
  }
);

/**
 * VIRTUALS
 *
 * Menambahkan computed properties untuk kemudahan akses data
 */
metrikSchema.virtual('usiaData').get(function() {
  return Date.now() - this.timestampPengumpulan.getTime();
});

metrikSchema.virtual('ringkasanKesehatan').get(function() {
  const ringkasan = {
    status: this.statusKesehatan,
    cpu: `${this.cpu.persentase}%`,
    memori: `${this.memori.persentase}%`,
    disk: `${this.disk.persentase}%`,
    jaringan: `${this.jaringan.latensiMs}ms latency`
  };

  if (this.statusKesehatan === STATUS_CRITICAL) {
    ringkasan.prioritas = 'TINGGI';
  } else if (this.statusKesehatan === STATUS_WARNING) {
    ringkasan.prioritas = 'SEDANG';
  } else {
    ringkasan.prioritas = 'RENDAH';
  }

  return ringkasan;
});

/**
 * INSTANCE METHODS
 *
 * Method untuk operasi pada instance metrics tertentu
 */

/**
 * Method untuk menentukan status kesehatan berdasarkan threshold
 * Mengupdate statusKesehatan otomatis berdasarkan nilai metrics
 */
metrikSchema.methods.tentukanStatusKesehatan = function() {
  const threshold = {
    cpu: { warning: 70, critical: 90 },
    memori: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 }
  };

  // Cek critical conditions
  if (this.cpu.persentase >= threshold.cpu.critical ||
      this.memori.persentase >= threshold.memori.critical ||
      this.disk.persentase >= threshold.disk.critical) {
    this.statusKesehatan = STATUS_CRITICAL;
  }
  // Cek warning conditions
  else if (this.cpu.persentase >= threshold.cpu.warning ||
           this.memori.persentase >= threshold.memori.warning ||
           this.disk.persentase >= threshold.disk.warning) {
    this.statusKesehatan = STATUS_WARNING;
  }
  // Default OK
  else {
    this.statusKesehatan = STATUS_OK;
  }

  return this.statusKesehatan;
};

/**
 * Method untuk mendapatkan metrics dalam format yang mudah dibaca
 * SIMPLIFIED: Only returns 4 core metrics
 */
metrikSchema.methods.formatUntukDisplay = function() {
  return {
    id: this._id,
    serverId: this.serverId,
    timestamp: this.timestampPengumpulan,
    kesehatan: this.statusKesehatan,
    cpu: this.cpu.persentase,
    ram: this.memori.persentase,
    disk: this.disk.persentase,
    temperature: this.suhu.celsius,
    metadata: this.metadataPengumpulan
  };
};

/**
 * STATIC METHODS
 *
 * Method untuk query dan agregasi data metrics
 */

/**
 * Method untuk mendapatkan metrics terbaru dari server tertentu
 */
metrikSchema.statics.dapatkanMetricsTerbaru = function(serverId, limit = 1) {
  return this.find({ serverId })
    .sort({ timestampPengumpulan: -1 })
    .limit(limit)
    .populate('serverId', 'nama jenisServer');
};

/**
 * Method untuk mendapatkan rata-rata metrics dalam periode tertentu
 */
metrikSchema.statics.dapatkanRataRataPeriode = function(serverId, jamTerakhir = 24) {
  const startDate = new Date(Date.now() - (jamTerakhir * 60 * 60 * 1000));

  return this.aggregate([
    {
      $match: {
        serverId: mongoose.Types.ObjectId(serverId),
        timestampPengumpulan: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$serverId',
        rataRataCpu: { $avg: '$cpu.persentase' },
        rataRataMemori: { $avg: '$memori.persentase' },
        rataRataDisk: { $avg: '$disk.persentase' },
        maksCpu: { $max: '$cpu.persentase' },
        maksMemori: { $max: '$memori.persentase' },
        maksDisk: { $max: '$disk.persentase' },
        jumlahData: { $sum: 1 },
        terakhirUpdate: { $max: '$timestampPengumpulan' }
      }
    }
  ]);
};

/**
 * Method untuk mendeteksi anomali berdasarkan deviasi standar
 */
metrikSchema.statics.deteksiAnomali = function(serverId, jamTerakhir = 24) {
  const startDate = new Date(Date.now() - (jamTerakhir * 60 * 60 * 1000));

  return this.aggregate([
    {
      $match: {
        serverId: mongoose.Types.ObjectId(serverId),
        timestampPengumpulan: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$serverId',
        rataRataCpu: { $avg: '$cpu.persentase' },
        stdDevCpu: { $stdDevSamp: '$cpu.persentase' },
        rataRataMemori: { $avg: '$memori.persentase' },
        stdDevMemori: { $stdDevSamp: '$memori.persentase' },
        dataTerbaru: { $max: '$timestampPengumpulan' }
      }
    }
  ]);
};

/**
 * MIDDLEWARE
 *
 * Hook untuk preprocessing sebelum save
 */

/**
 * Pre-save middleware untuk auto-determine status kesehatan
 */
metrikSchema.pre('save', function(next) {
  if (this.isModified('cpu.persentase') ||
      this.isModified('memori.persentase') ||
      this.isModified('disk.persentase')) {
    this.tentukanStatusKesehatan();
  }
  next();
});

/**
 * Pre-save middleware untuk validasi data konsistensi
 */
metrikSchema.pre('save', function(next) {
  // Validasi memori: digunakan + tersedia harus <= total
  if (this.memori.digunakan + (this.memori.tersedia || 0) > this.memori.total) {
    return next(new Error('Data memori tidak konsisten: digunakan + tersedia > total'));
  }

  // Validasi disk: digunakan + tersedia harus <= total
  if (this.disk.digunakan + (this.disk.tersedia || 0) > this.disk.total) {
    return next(new Error('Data disk tidak konsisten: digunakan + tersedia > total'));
  }

  next();
});

// Buat model dari schema
const Metrik = mongoose.model('Metrik', metrikSchema);

module.exports = Metrik;