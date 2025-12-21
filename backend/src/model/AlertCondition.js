// Model untuk kondisi alert kesehatan server
// Schema MongoDB untuk menyimpan konfigurasi threshold dan kondisi pemicu alert

const mongoose = require('mongoose');

/**
 * DESKRIPSI: Schema untuk menyimpan konfigurasi kondisi alert kesehatan server
 *
 * TUJUAN: Menyimpan threshold dan kondisi yang memicu alert untuk setiap parameter
 * kesehatan server, dengan dukungan untuk alert sementara vs berulang dan anti-spam.
 *
 * STRUKTUR DATA:
 * - Parameter kesehatan server (CPU, Memory, Disk, dll.)
 * - Threshold levels (Warning, Critical, Recovery)
 * - Alert types (Temporary vs Recurring)
 * - Anti-spam mechanisms (Cooldown, State-based)
 * - Metadata untuk tracking dan audit
 *
 * ALASAN DESIGN:
 * - Fleksibilitas konfigurasi per server atau global
 * - Pencegahan alert spam dengan cooldown dan state tracking
 * - Support untuk alert sementara (transient) vs berulang (persistent)
 * - Integration dengan evaluation engine untuk real-time monitoring
 */
const alertConditionSchema = new mongoose.Schema({
  // Referensi server (null untuk global default)
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    default: null,
    index: true
  },

  // Parameter kesehatan server yang dipantau
  parameter: {
    type: String,
    required: [true, 'Parameter wajib diisi'],
    enum: {
      values: [
        'cpu_usage', 'memory_usage', 'disk_usage', 'network_io',
        'system_load', 'temperature', 'server_uptime', 'response_time', 'error_rate'
      ],
      message: 'Parameter tidak valid'
    },
    index: true
  },

  // Nama kondisi alert
  nama: {
    type: String,
    required: [true, 'Nama kondisi wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama kondisi maksimal 100 karakter']
  },

  // Deskripsi kondisi
  deskripsi: {
    type: String,
    trim: true,
    maxlength: [500, 'Deskripsi maksimal 500 karakter']
  },

  // Status aktif/nonaktif
  aktif: {
    type: Boolean,
    default: true,
    index: true
  },

  // Threshold levels
  thresholds: {
    warning: {
      nilai: {
        type: Number,
        required: [true, 'Threshold warning wajib diisi']
      },
      operator: {
        type: String,
        enum: ['>', '>=', '<', '<=', '==', '!='],
        default: '>'
      },
      durasiMinimumMenit: {
        type: Number,
        min: [0, 'Durasi minimum minimal 0 menit'],
        default: 5
      }
    },
    critical: {
      nilai: {
        type: Number,
        required: [true, 'Threshold critical wajib diisi']
      },
      operator: {
        type: String,
        enum: ['>', '>=', '<', '<=', '==', '!='],
        default: '>'
      },
      durasiMinimumMenit: {
        type: Number,
        min: [0, 'Durasi minimum minimal 0 menit'],
        default: 10
      }
    },
    recovery: {
      nilai: {
        type: Number,
        required: [true, 'Threshold recovery wajib diisi']
      },
      operator: {
        type: String,
        enum: ['>', '>=', '<', '<=', '==', '!='],
        default: '<'
      },
      durasiMinimumMenit: {
        type: Number,
        min: [0, 'Durasi minimum minimal 0 menit'],
        default: 5
      }
    }
  },

  // Unit pengukuran
  unit: {
    type: String,
    trim: true,
    default: '%',
    maxlength: [10, 'Unit maksimal 10 karakter']
  },

  // Tipe alert
  alertType: {
    type: String,
    enum: {
      values: ['temporary', 'recurring'],
      message: 'Tipe alert tidak valid'
    },
    default: 'temporary'
  },

  // Konfigurasi anti-spam
  antiSpam: {
    // Cooldown antara alert serupa (menit)
    cooldownMenit: {
      type: Number,
      min: [0, 'Cooldown minimal 0 menit'],
      default: 30
    },

    // State-based alerting
    stateBased: {
      type: Boolean,
      default: true
    },

    // Maksimal alert per jam
    maxAlertPerJam: {
      type: Number,
      min: [1, 'Maksimal alert per jam minimal 1'],
      default: 5
    },

    // Threshold untuk alert berulang (transient -> recurring)
    thresholdBerulang: {
      jumlahMinimum: {
        type: Number,
        min: [1, 'Jumlah minimum minimal 1'],
        default: 3
      },
      dalamMenit: {
        type: Number,
        min: [1, 'Dalam menit minimal 1'],
        default: 60
      }
    }
  },

  // Konfigurasi notifikasi
  notifikasi: {
    email: {
      aktif: {
        type: Boolean,
        default: true
      },
      template: {
        type: String,
        trim: true,
        default: 'default_alert'
      }
    },
    webhook: {
      aktif: {
        type: Boolean,
        default: false
      },
      url: {
        type: String,
        trim: true
      }
    },
    slack: {
      aktif: {
        type: Boolean,
        default: false
      },
      channel: {
        type: String,
        trim: true
      }
    }
  },

  // Metadata
  metadata: {
    dibuatOleh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pengguna'
    },
    diupdateOleh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pengguna'
    },
    versi: {
      type: Number,
      default: 1
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    customData: {
      type: mongoose.Schema.Types.Mixed
    }
  }

}, {
  timestamps: true,
  collection: 'alert_conditions'
});

/**
 * INDEXING STRATEGI
 *
 * 1. Compound index untuk query kondisi aktif per server
 * 2. Index untuk query berdasarkan parameter
 * 3. Index untuk query global conditions (serverId null)
 */
alertConditionSchema.index({ serverId: 1, aktif: 1 });
alertConditionSchema.index({ parameter: 1 });
alertConditionSchema.index({ serverId: 1, parameter: 1 });

/**
 * VIRTUALS
 *
 * Computed properties untuk kemudahan akses
 */
alertConditionSchema.virtual('isGlobal').get(function() {
  return this.serverId === null;
});

alertConditionSchema.virtual('ringkasanThreshold').get(function() {
  return {
    warning: `${this.thresholds.warning.operator}${this.thresholds.warning.nilai}${this.unit}`,
    critical: `${this.thresholds.critical.operator}${this.thresholds.critical.nilai}${this.unit}`,
    recovery: `${this.thresholds.recovery.operator}${this.thresholds.recovery.nilai}${this.unit}`
  };
});

/**
 * INSTANCE METHODS
 *
 * Method untuk operasi pada instance kondisi alert
 */

/**
 * Method untuk mengecek apakah nilai memicu alert
 */
alertConditionSchema.methods.cekThreshold = function(nilai, level = 'warning') {
  const threshold = this.thresholds[level];
  if (!threshold) return false;

  switch (threshold.operator) {
    case '>':
      return nilai > threshold.nilai;
    case '>=':
      return nilai >= threshold.nilai;
    case '<':
      return nilai < threshold.nilai;
    case '<=':
      return nilai <= threshold.nilai;
    case '==':
      return nilai === threshold.nilai;
    case '!=':
      return nilai !== threshold.nilai;
    default:
      return false;
  }
};

/**
 * Method untuk mendapatkan severity berdasarkan nilai
 */
alertConditionSchema.methods.getSeverity = function(nilai) {
  if (this.cekThreshold(nilai, 'critical')) {
    return 'critical';
  } else if (this.cekThreshold(nilai, 'warning')) {
    return 'warning';
  }
  return null;
};

/**
 * Method untuk format kondisi untuk display
 */
alertConditionSchema.methods.formatUntukDisplay = function() {
  return {
    id: this._id,
    nama: this.nama,
    deskripsi: this.deskripsi,
    parameter: this.parameter,
    aktif: this.aktif,
    thresholds: this.ringkasanThreshold,
    unit: this.unit,
    alertType: this.alertType,
    antiSpam: this.antiSpam,
    notifikasi: this.notifikasi,
    serverId: this.serverId,
    isGlobal: this.isGlobal,
    metadata: {
      dibuat: this.createdAt,
      diupdate: this.updatedAt,
      versi: this.metadata.versi
    }
  };
};

/**
 * STATIC METHODS
 *
 * Method untuk query dan operasi pada koleksi kondisi alert
 */

/**
 * Method untuk mendapatkan kondisi aktif untuk server tertentu
 */
alertConditionSchema.statics.dapatkanKondisiAktif = function(serverId = null) {
  const query = { aktif: true };

  // Jika serverId disediakan, ambil kondisi spesifik server + global
  // Jika tidak, ambil hanya global
  if (serverId) {
    query.$or = [
      { serverId: serverId },
      { serverId: null }
    ];
  } else {
    query.serverId = null;
  }

  return this.find(query)
    .sort({ serverId: -1, parameter: 1 }) // Prioritas kondisi spesifik server
    .populate('serverId', 'nama jenisServer');
};

/**
 * Method untuk mendapatkan kondisi berdasarkan parameter
 */
alertConditionSchema.statics.dapatkanByParameter = function(parameter, serverId = null) {
  const query = { parameter, aktif: true };

  if (serverId) {
    query.$or = [
      { serverId: serverId },
      { serverId: null }
    ];
  } else {
    query.serverId = null;
  }

  return this.find(query)
    .sort({ serverId: -1 }); // Prioritas kondisi spesifik server
};

/**
 * Method untuk validasi kondisi tidak konflik
 */
alertConditionSchema.statics.validasiKondisi = function(kondisiBaru) {
  const konflik = await this.find({
    parameter: kondisiBaru.parameter,
    serverId: kondisiBaru.serverId,
    aktif: true,
    _id: { $ne: kondisiBaru._id }
  });

  if (konflik.length > 0) {
    throw new Error(`Kondisi untuk parameter ${kondisiBaru.parameter} sudah ada`);
  }

  return true;
};

/**
 * MIDDLEWARE
 *
 * Hook untuk preprocessing
 */

/**
 * Pre-save middleware untuk validasi
 */
alertConditionSchema.pre('save', async function(next) {
  // Validasi threshold logic
  const { warning, critical, recovery } = this.thresholds;

  // Warning harus lebih rendah dari critical untuk parameter yang naik (cpu, memory, dll.)
  const parametersNaik = ['cpu_usage', 'memory_usage', 'disk_usage', 'network_io', 'system_load', 'temperature', 'response_time', 'error_rate'];
  const isParameterNaik = parametersNaik.includes(this.parameter);

  if (isParameterNaik) {
    if (warning.nilai >= critical.nilai) {
      return next(new Error('Threshold warning harus lebih rendah dari critical untuk parameter ini'));
    }
  } else {
    // Untuk parameter turun (uptime), logic terbalik
    if (warning.nilai <= critical.nilai) {
      return next(new Error('Threshold warning harus lebih tinggi dari critical untuk parameter uptime'));
    }
  }

  // Validasi recovery threshold
  if (isParameterNaik) {
    if (recovery.nilai >= warning.nilai) {
      return next(new Error('Threshold recovery harus lebih rendah dari warning'));
    }
  } else {
    if (recovery.nilai <= warning.nilai) {
      return next(new Error('Threshold recovery harus lebih tinggi dari warning'));
    }
  }

  // Increment versi pada update
  if (!this.isNew) {
    this.metadata.versi += 1;
  }

  next();
});

/**
 * Post-save middleware untuk logging
 */
alertConditionSchema.post('save', function(doc) {
  console.log(`⚙️ Kondisi alert ${doc.nama} (${doc.parameter}) ${doc.isNew ? 'dibuat' : 'diupdate'}`);
});

// Buat model dari schema
const AlertCondition = mongoose.model('AlertCondition', alertConditionSchema);

module.exports = AlertCondition;