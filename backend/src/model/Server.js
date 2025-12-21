// Model untuk data Server
// Schema MongoDB untuk menyimpan informasi server monitoring

const mongoose = require('mongoose');
const { STATUS_OK, STATUS_WARNING, STATUS_CRITICAL } = require('../utilitas/konstanta');

/**
 * DESKRIPSI: Schema untuk menyimpan data server yang dimonitor
 *
 * TUJUAN: Menyimpan informasi lengkap tentang server yang akan
 * dimonitor kesehatan dan performanya.
 *
 * STRUKTUR DATA:
 * - Informasi dasar: nama, deskripsi, jenis server
 * - Konfigurasi jaringan: IP address, hostname
 * - Spesifikasi hardware: CPU, RAM, disk
 * - Status monitoring: status kesehatan, metrics terbaru
 * - Metadata: timestamps, ownership
 *
 * ALASAN DESIGN:
 * - Ownership per user untuk multi-tenancy
 * - Status enum untuk consistency
 * - Spesifikasi sebagai nested object untuk extensibility
 * - Metrics terbaru cached untuk performa query cepat
 */
const serverSchema = new mongoose.Schema({
  // Informasi dasar server
  nama: {
    type: String,
    required: [true, 'Nama server wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama server maksimal 100 karakter']
  },

  deskripsi: {
    type: String,
    trim: true,
    maxlength: [500, 'Deskripsi maksimal 500 karakter'],
    default: ''
  },

  jenisServer: {
    type: String,
    required: [true, 'Jenis server wajib diisi'],
    enum: {
      values: ['web', 'database', 'api', 'cache', 'load-balancer', 'monitoring'],
      message: 'Jenis server tidak valid'
    }
  },

  // Konfigurasi jaringan
  alamatIp: {
    type: String,
    required: [true, 'Alamat IP wajib diisi'],
    validate: {
      validator: function(v) {
        // Validasi format IPv4
        const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
        return ipv4Regex.test(v);
      },
      message: 'Format alamat IP tidak valid'
    }
  },

  sistemOperasi: {
    type: String,
    required: [true, 'Sistem operasi wajib diisi'],
    maxlength: [100, 'Sistem operasi maksimal 100 karakter']
  },

  // Spesifikasi hardware
  spesifikasi: {
    cpu: {
      core: {
        type: Number,
        min: [1, 'CPU minimal 1 core'],
        max: [128, 'CPU maksimal 128 core']
      },
      model: {
        type: String,
        maxlength: [100, 'Model CPU maksimal 100 karakter']
      }
    },
    memoriTotal: {
      type: Number,
      min: [1, 'Memori minimal 1 GB'],
      max: [10000, 'Memori maksimal 10000 GB']
    },
    diskTotal: {
      type: Number,
      min: [1, 'Disk minimal 1 GB'],
      max: [100000, 'Disk maksimal 100000 GB']
    }
  },

  // Status monitoring
  status: {
    type: String,
    enum: {
      values: ['online', 'offline', 'unknown'],
      message: 'Status server tidak valid'
    },
    default: 'unknown'
  },

  terakhirOnline: {
    type: Date,
    default: null
  },

  // Metrics terbaru (cached untuk performa)
  metrikTerbaru: {
    cpu: Number,      // Persentase 0-100
    memori: Number,   // Persentase 0-100
    disk: Number,     // Persentase 0-100
    networkIn: Number,    // KB/s
    networkOut: Number,   // KB/s
    timestamp: Date
  },

  // Alert aktif (cached untuk dashboard)
  alertAktif: [{
    id: String,
    tingkatKeparahan: {
      type: String,
      enum: ['Warning', 'Critical']
    },
    pesan: String,
    timestamp: Date
  }],

  // Ownership dan metadata
  pemilik: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pengguna',
    required: [true, 'Pemilik server wajib diisi']
  },

  // Timestamps
  dibuatPada: {
    type: Date,
    default: Date.now
  },

  diperbaruiPada: {
    type: Date,
    default: Date.now
  }
}, {
  // Options
  timestamps: false, // Manual timestamps
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * DESKRIPSI: Virtual untuk menghitung uptime server
 *
 * TUJUAN: Menghitung berapa lama server sudah online
 * sejak terakhir online.
 *
 * @returns {number} Uptime dalam milidetik, atau null jika offline
 */
serverSchema.virtual('uptimeMs').get(function() {
  if (this.status === 'online' && this.terakhirOnline) {
    return Date.now() - this.terakhirOnline.getTime();
  }
  return null;
});

/**
 * DESKRIPSI: Virtual untuk status kesehatan berdasarkan metrics
 *
 * TUJUAN: Menghitung status kesehatan secara real-time
 * berdasarkan metrics terbaru dan threshold.
 *
 * @returns {string} Status kesehatan: OK, Warning, Critical
 */
serverSchema.virtual('statusKesehatan').get(function() {
  if (!this.metrikTerbaru) {
    return STATUS_OK; // Default jika belum ada metrics
  }

  const { cpu, memori, disk } = this.metrikTerbaru;

  // Critical conditions (OR logic - jika salah satu critical, maka critical)
  if (cpu >= 80 || memori >= 85 || disk >= 90) {
    return STATUS_CRITICAL;
  }

  // Warning conditions (OR logic)
  if (cpu >= 60 || memori >= 70 || disk >= 80) {
    return STATUS_WARNING;
  }

  return STATUS_OK;
});

/**
 * DESKRIPSI: Method untuk update metrics server
 *
 * TUJUAN: Update metrics terbaru dan status server
 * dalam satu operasi atomic.
 *
 * @param {Object} metricsBaru - Metrics baru dari monitoring
 * @param {number} metricsBaru.cpu - CPU usage 0-100
 * @param {number} metricsBaru.memori - Memory usage 0-100
 * @param {number} metricsBaru.disk - Disk usage 0-100
 * @returns {Promise<Server>} Server yang sudah diupdate
 */
serverSchema.methods.updateMetrics = async function(metricsBaru) {
  // Update metrics
  this.metrikTerbaru = {
    ...metricsBaru,
    timestamp: new Date()
  };

  // Update status berdasarkan metrics
  this.status = 'online';
  this.terakhirOnline = new Date();
  this.diperbaruiPada = new Date();

  // Simpan perubahan
  return await this.save();
};

/**
 * DESKRIPSI: Method untuk menambah alert ke server
 *
 * TUJUAN: Menambah alert baru ke array alertAktif
 * dengan validasi duplikasi.
 *
 * @param {Object} alertBaru - Data alert baru
 * @param {string} alertBaru.id - ID unik alert
 * @param {string} alertBaru.tingkatKeparahan - Warning/Critical
 * @param {string} alertBaru.pesan - Pesan alert
 * @returns {Promise<Server>} Server yang sudah diupdate
 */
serverSchema.methods.tambahAlert = async function(alertBaru) {
  // Cek apakah alert dengan ID yang sama sudah ada
  const alertAda = this.alertAktif.find(alert => alert.id === alertBaru.id);

  if (!alertAda) {
    this.alertAktif.push({
      ...alertBaru,
      timestamp: new Date()
    });

    this.diperbaruiPada = new Date();
    return await this.save();
  }

  return this; // Return tanpa perubahan jika alert sudah ada
};

/**
 * DESKRIPSI: Method untuk menghapus alert dari server
 *
 * TUJUAN: Menghapus alert berdasarkan ID dari array alertAktif.
 *
 * @param {string} idAlert - ID alert yang akan dihapus
 * @returns {Promise<Server>} Server yang sudah diupdate
 */
serverSchema.methods.hapusAlert = async function(idAlert) {
  this.alertAktif = this.alertAktif.filter(alert => alert.id !== idAlert);
  this.diperbaruiPada = new Date();

  return await this.save();
};

/**
 * DESKRIPSI: Static method untuk mencari server berdasarkan status kesehatan
 *
 * TUJUAN: Query helper untuk mendapatkan server berdasarkan
 * status kesehatan secara efisien.
 *
 * @param {string} statusKesehatan - Status yang dicari (OK/Warning/Critical)
 * @returns {Query} Mongoose query untuk server dengan status tersebut
 */
serverSchema.statics.findByStatusKesehatan = function(statusKesehatan) {
  // Karena statusKesehatan adalah virtual, kita perlu query berdasarkan metrics
  const conditions = {};

  switch (statusKesehatan) {
    case STATUS_CRITICAL:
      conditions.$or = [
        { 'metrikTerbaru.cpu': { $gte: 80 } },
        { 'metrikTerbaru.memori': { $gte: 85 } },
        { 'metrikTerbaru.disk': { $gte: 90 } }
      ];
      break;

    case STATUS_WARNING:
      conditions.$and = [
        {
          $nor: [
            { 'metrikTerbaru.cpu': { $gte: 80 } },
            { 'metrikTerbaru.memori': { $gte: 85 } },
            { 'metrikTerbaru.disk': { $gte: 90 } }
          ]
        },
        {
          $or: [
            { 'metrikTerbaru.cpu': { $gte: 60 } },
            { 'metrikTerbaru.memori': { $gte: 70 } },
            { 'metrikTerbaru.disk': { $gte: 80 } }
          ]
        }
      ];
      break;

    case STATUS_OK:
    default:
      conditions.$and = [
        { 'metrikTerbaru.cpu': { $lt: 60 } },
        { 'metrikTerbaru.memori': { $lt: 70 } },
        { 'metrikTerbaru.disk': { $lt: 80 } }
      ];
      break;
  }

  return this.find(conditions);
};

/**
 * DESKRIPSI: Pre-save middleware untuk validasi dan logging
 *
 * TUJUAN: Validasi data sebelum disimpan dan log perubahan penting.
 */
serverSchema.pre('save', function(next) {
  // Update timestamp diperbarui
  this.diperbaruiPada = new Date();

  // Validasi spesifikasi lengkap
  if (this.spesifikasi && (!this.spesifikasi.cpu || !this.spesifikasi.memoriTotal || !this.spesifikasi.diskTotal)) {
    const error = new Error('Spesifikasi server tidak lengkap');
    return next(error);
  }

  next();
});

/**
 * DESKRIPSI: Index untuk performa query
 *
 * ALASAN INDEX:
 * - pemilik: Query berdasarkan ownership (paling sering)
 * - status: Filter berdasarkan status server
 * - jenisServer: Filter berdasarkan tipe server
 * - alamatIp: Lookup berdasarkan IP (unik constraint)
 */
serverSchema.index({ pemilik: 1, diperbaruiPada: -1 }); // Ownership + sort terbaru
serverSchema.index({ status: 1 }); // Filter status
serverSchema.index({ jenisServer: 1 }); // Filter jenis
serverSchema.index({ alamatIp: 1 }, { unique: true }); // IP unik global (bukan per user)

// Compound index untuk query kompleks
serverSchema.index({ pemilik: 1, status: 1, jenisServer: 1 });

// Export model
const Server = mongoose.model('Server', serverSchema);
module.exports = Server;