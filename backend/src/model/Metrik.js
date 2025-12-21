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
    },
    core: {
      type: Number,
      min: [1, 'Jumlah core minimal 1'],
      default: 1
    },
    frekuensi: {
      type: Number, // dalam MHz
      min: [0, 'Frekuensi CPU minimal 0']
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
    },
    tersedia: {
      type: Number, // dalam MB
      min: [0, 'Memori tersedia minimal 0']
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
    },
    tersedia: {
      type: Number, // dalam GB
      min: [0, 'Disk tersedia minimal 0']
    },
    kecepatanBaca: {
      type: Number, // dalam MB/s
      min: [0, 'Kecepatan baca disk minimal 0']
    },
    kecepatanTulis: {
      type: Number, // dalam MB/s
      min: [0, 'Kecepatan tulis disk minimal 0']
    }
  },

  // Metrics Network
  jaringan: {
    downloadMbps: {
      type: Number,
      default: 0,
      min: [0, 'Kecepatan download minimal 0']
    },
    uploadMbps: {
      type: Number,
      default: 0,
      min: [0, 'Kecepatan upload minimal 0']
    },
    latensiMs: {
      type: Number,
      default: 0,
      min: [0, 'Latensi minimal 0']
    },
    paketHilangPersen: {
      type: Number,
      default: 0,
      min: [0, 'Paket hilang minimal 0'],
      max: [100, 'Paket hilang maksimal 100']
    },
    koneksiAktif: {
      type: Number,
      default: 0,
      min: [0, 'Koneksi aktif minimal 0']
    }
  },

  // Metrics Sistem Operasi
  sistemOperasi: {
    bebanRataRata: {
      '1menit': { type: Number, min: [0, 'Load average minimal 0'] },
      '5menit': { type: Number, min: [0, 'Load average minimal 0'] },
      '15menit': { type: Number, min: [0, 'Load average minimal 0'] }
    },
    prosesAktif: {
      type: Number,
      min: [0, 'Proses aktif minimal 0'],
      default: 0
    },
    threadAktif: {
      type: Number,
      min: [0, 'Thread aktif minimal 0'],
      default: 0
    },
    uptimeDetik: {
      type: Number,
      min: [0, 'Uptime minimal 0'],
      default: 0
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
 * INDEXING STRATEGI
 *
 * 1. Compound index untuk query metrics berdasarkan server dan waktu
 * 2. TTL index untuk auto-delete data lama (30 hari)
 * 3. Single index untuk query cepat berdasarkan status
 */
metrikSchema.index({ serverId: 1, timestampPengumpulan: -1 });
metrikSchema.index({ statusKesehatan: 1 });
metrikSchema.index({ timestampPengumpulan: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 hari

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
 */
metrikSchema.methods.formatUntukDisplay = function() {
  return {
    id: this._id,
    serverId: this.serverId,
    timestamp: this.timestampPengumpulan,
    kesehatan: this.ringkasanKesehatan,
    performa: {
      cpu: {
        persentase: this.cpu.persentase,
        core: this.cpu.core,
        frekuensi: this.cpu.frekuensi ? `${this.cpu.frekuensi} MHz` : 'N/A'
      },
      memori: {
        persentase: this.memori.persentase,
        digunakan: `${this.memori.digunakan} MB`,
        total: `${this.memori.total} MB`,
        tersedia: this.memori.tersedia ? `${this.memori.tersedia} MB` : 'N/A'
      },
      disk: {
        persentase: this.disk.persentase,
        digunakan: `${this.disk.digunakan} GB`,
        total: `${this.disk.total} GB`,
        tersedia: this.disk.tersedia ? `${this.disk.tersedia} GB` : 'N/A'
      },
      jaringan: {
        download: `${this.jaringan.downloadMbps} Mbps`,
        upload: `${this.jaringan.uploadMbps} Mbps`,
        latensi: `${this.jaringan.latensiMs} ms`,
        paketHilang: `${this.jaringan.paketHilangPersen}%`
      }
    },
    sistem: {
      loadAverage: this.sistemOperasi.bebanRataRata,
      prosesAktif: this.sistemOperasi.prosesAktif,
      uptime: this.sistemOperasi.uptimeDetik ?
        `${Math.floor(this.sistemOperasi.uptimeDetik / 86400)} hari` : 'N/A'
    },
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