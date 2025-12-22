// Layanan Alert untuk Sistem Monitoring Server
// Evaluasi kondisi alert kesehatan server berdasarkan threshold dan anti-spam mechanisms

const { logger, logEmailAlert } = require('../utilitas/logger');
const layananEmail = require('./layananEmail');
const Server = require('../model/Server');
const Metrik = require('../model/Metrik');
const Alert = require('../model/Alert');
const AlertCondition = require('../model/AlertCondition');

// Import konstanta
const { STATUS_WARNING, STATUS_CRITICAL, ALERT_BARU } = require('../utilitas/konstanta');

// Import Socket.IO untuk real-time updates
let io = null;

/**
 * Set Socket.IO instance untuk real-time alert updates
 * @param {SocketIO.Server} socketIo - Socket.IO server instance
 */
function setSocketIO(socketIo) {
  io = socketIo;
  logger.info('Socket.IO instance diset untuk layanan alert');
}

/**
 * DESKRIPSI: Evaluasi kondisi alert untuk server berdasarkan metrics terbaru
 *
 * TUJUAN: Mengevaluasi semua kondisi alert aktif terhadap metrics server
 * dan membuat alert jika threshold terlampaui dengan mempertimbangkan anti-spam
 *
 * @param {string} serverId - ID server yang dievaluasi
 * @param {Object} metricsData - Data metrics terbaru server
 * @returns {Promise<Array>} Array alert yang dibuat
 */
async function evaluasiKondisiAlert(serverId, metricsData) {
  try {
    logger.debug(`Evaluasi kondisi alert untuk server ${serverId}`);

    // Dapatkan semua kondisi alert aktif untuk server ini
    const kondisiAlert = await AlertCondition.dapatkanKondisiAktif(serverId);
    if (kondisiAlert.length === 0) {
      logger.debug(`Tidak ada kondisi alert aktif untuk server ${serverId}`);
      return [];
    }

    const alertsDibuat = [];

    // Evaluasi setiap kondisi alert
    for (const kondisi of kondisiAlert) {
      try {
        const alert = await evaluasiKondisiTunggal(serverId, kondisi, metricsData);
        if (alert) {
          alertsDibuat.push(alert);
        }
      } catch (error) {
        logger.logError('ALERT_CONDITION_EVALUATION_FAILED', error, {
          serverId,
          conditionId: kondisi._id,
          parameter: kondisi.parameter
        });
      }
    }

    logger.info(`Evaluasi alert selesai: ${alertsDibuat.length} alert dibuat untuk server ${serverId}`);
    return alertsDibuat;

  } catch (error) {
    logger.logError('ALERT_EVALUATION_FAILED', error, { serverId });
    throw error;
  }
}

/**
 * DESKRIPSI: Evaluasi kondisi alert tunggal
 *
 * @param {string} serverId - ID server
 * @param {Object} kondisi - Kondisi alert dari AlertCondition
 * @param {Object} metricsData - Data metrics
 * @returns {Promise<Object|null>} Alert yang dibuat atau null
 */
async function evaluasiKondisiTunggal(serverId, kondisi, metricsData) {
  const { parameter } = kondisi;

  // Dapatkan nilai metric untuk parameter ini
  const nilaiMetric = dapatkanNilaiMetric(metricsData, parameter);
  if (nilaiMetric === null || nilaiMetric === undefined) {
    logger.debug(`Metric ${parameter} tidak tersedia untuk server ${serverId}`);
    return null;
  }

  // Cek apakah nilai memicu threshold
  const severity = kondisi.getSeverity(nilaiMetric);
  if (!severity) {
    // Cek recovery jika ada alert aktif
    await cekRecoveryAlert(serverId, kondisi, nilaiMetric);
    return null;
  }

  // Cek anti-spam mechanisms
  const bolehAlert = await cekAntiSpam(serverId, kondisi, severity);
  if (!bolehAlert) {
    logger.debug(`Alert ${parameter} untuk server ${serverId} dicegah anti-spam`);
    return null;
  }

  // Cek durasi minimum untuk threshold
  const durasiValid = await cekDurasiMinimum(serverId, kondisi, severity, nilaiMetric);
  if (!durasiValid) {
    logger.debug(`Alert ${parameter} untuk server ${serverId} belum memenuhi durasi minimum`);
    return null;
  }

  // Buat alert baru
  const alert = await buatAlertBaru(serverId, kondisi, severity, nilaiMetric);
  return alert;
}

/**
 * DESKRIPSI: Mendapatkan nilai metric dari data metrics
 *
 * @param {Object} metricsData - Data metrics server
 * @param {string} parameter - Nama parameter
 * @returns {number|null} Nilai metric atau null jika tidak ada
 */
function dapatkanNilaiMetric(metricsData, parameter) {
  const mapping = {
    'cpu_usage': 'cpu',
    'memory_usage': 'memori',
    'disk_usage': 'disk',
    'network_io': 'jaringan',
    'system_load': 'load',
    'temperature': 'temperature',
    'server_uptime': 'uptime',
    'response_time': 'responseTime',
    'error_rate': 'errorRate'
  };

  const metricKey = mapping[parameter];
  if (!metricKey || !metricsData[metricKey]) {
    return null;
  }

  return metricsData[metricKey].nilai || metricsData[metricKey];
}

/**
 * DESKRIPSI: Mengecek anti-spam mechanisms
 *
 * @param {string} serverId - ID server
 * @param {Object} kondisi - Kondisi alert
 * @param {string} severity - Severity alert
 * @returns {Promise<boolean>} True jika boleh buat alert
 */
async function cekAntiSpam(serverId, kondisi, severity) {
  const { antiSpam } = kondisi;

  // Cek cooldown
  if (antiSpam.cooldownMenit > 0) {
    const lastAlert = await Alert.findOne({
      serverId,
      jenisAlert: mapParameterToJenisAlert(kondisi.parameter),
      timestampPemicu: {
        $gte: new Date(Date.now() - antiSpam.cooldownMenit * 60 * 1000)
      }
    }).sort({ timestampPemicu: -1 });

    if (lastAlert) {
      logger.debug(`Alert cooldown aktif untuk ${kondisi.parameter} server ${serverId}`);
      return false;
    }
  }

  // Cek maksimal alert per jam
  if (antiSpam.maxAlertPerJam > 0) {
    const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
    const jumlahAlertJamIni = await Alert.countDocuments({
      serverId,
      jenisAlert: mapParameterToJenisAlert(kondisi.parameter),
      timestampPemicu: { $gte: satuJamLalu }
    });

    if (jumlahAlertJamIni >= antiSpam.maxAlertPerJam) {
      logger.debug(`Batas maksimal alert per jam tercapai untuk ${kondisi.parameter} server ${serverId}`);
      return false;
    }
  }

  // Cek state-based alerting
  if (antiSpam.stateBased) {
    const alertAktif = await Alert.findOne({
      serverId,
      jenisAlert: mapParameterToJenisAlert(kondisi.parameter),
      statusAlert: { $ne: 'resolved' }
    });

    if (alertAktif) {
      logger.debug(`Alert state-based mencegah alert baru untuk ${kondisi.parameter} server ${serverId}`);
      return false;
    }
  }

  return true;
}

/**
 * DESKRIPSI: Mengecek durasi minimum threshold
 *
 * @param {string} serverId - ID server
 * @param {Object} kondisi - Kondisi alert
 * @param {string} severity - Severity level
 * @param {number} nilai - Nilai metric
 * @returns {Promise<boolean>} True jika durasi terpenuhi
 */
async function cekDurasiMinimum(serverId, kondisi, severity, nilai) {
  const threshold = kondisi.thresholds[severity];
  const durasiMin = threshold.durasiMinimumMenit;

  if (durasiMin === 0) return true;

  // Untuk implementasi sederhana, kita asumsikan metrics sudah stabil
  // Dalam implementasi penuh, perlu tracking historis metrics
  // TODO: Implementasi tracking durasi threshold dengan time-series data

  return true; // Placeholder
}

/**
 * DESKRIPSI: Mengecek dan resolve alert recovery
 *
 * @param {string} serverId - ID server
 * @param {Object} kondisi - Kondisi alert
 * @param {number} nilai - Nilai metric saat ini
 */
async function cekRecoveryAlert(serverId, kondisi, nilai) {
  // Cek apakah nilai sudah di bawah threshold recovery
  if (!kondisi.cekThreshold(nilai, 'recovery')) {
    return;
  }

  // Cari alert aktif untuk parameter ini
  const alertAktif = await Alert.findOne({
    serverId,
    jenisAlert: mapParameterToJenisAlert(kondisi.parameter),
    statusAlert: { $in: [ALERT_BARU, 'acknowledged'] }
  });

  if (alertAktif) {
    // Resolve alert
    await alertAktif.resolve(null, 'Auto-resolved: Kondisi kembali normal');
    logger.info(`Alert recovery untuk ${kondisi.parameter} server ${serverId}`);

    // Emit recovery event
    emitAlertRecovery(alertAktif);
  }
}

/**
 * DESKRIPSI: Membuat alert baru
 *
 * @param {string} serverId - ID server
 * @param {Object} kondisi - Kondisi alert
 * @param {string} severity - Severity level
 * @param {number} nilai - Nilai metric
 * @returns {Promise<Object>} Alert yang dibuat
 */
async function buatAlertBaru(serverId, kondisi, severity, nilai) {
  const jenisAlert = mapParameterToJenisAlert(kondisi.parameter);

  const alertData = {
    serverId,
    judul: `${kondisi.nama} - ${severity.toUpperCase()}`,
    deskripsi: `Parameter ${kondisi.parameter} mencapai ${nilai}${kondisi.unit} (${severity})`,
    jenisAlert,
    severity: severity === 'warning' ? STATUS_WARNING : STATUS_CRITICAL,
    kondisiPemicu: {
      metric: kondisi.parameter,
      nilaiAktual: nilai,
      threshold: kondisi.thresholds[severity].nilai,
      operator: kondisi.thresholds[severity].operator,
      unit: kondisi.unit
    },
    metadataAlert: {
      ruleId: kondisi._id.toString(),
      autoGenerated: true,
      source: 'monitoring_agent',
      tags: [kondisi.parameter, severity, kondisi.alertType]
    }
  };

  const alert = new Alert(alertData);
  await alert.save();

  // Kirim notifikasi
  await kirimNotifikasiAlert(alert, kondisi);

  // Emit real-time
  emitAlertBaru(alert, kondisi);

  logger.logSystemActivity('ALERT_CREATED', {
    alertId: alert._id,
    serverId,
    parameter: kondisi.parameter,
    severity,
    value: nilai
  });

  return alert;
}

/**
 * DESKRIPSI: Kirim notifikasi alert
 *
 * @param {Object} alert - Alert object
 * @param {Object} kondisi - Kondisi alert
 */
async function kirimNotifikasiAlert(alert, kondisi) {
  try {
    // Email notification
    if (kondisi.notifikasi.email.aktif) {
      await kirimEmailAlert(alert, kondisi);
    }

    // Webhook notification
    if (kondisi.notifikasi.webhook.aktif && kondisi.notifikasi.webhook.url) {
      await kirimWebhookAlert(alert, kondisi);
    }

    // Slack notification
    if (kondisi.notifikasi.slack.aktif && kondisi.notifikasi.slack.channel) {
      await kirimSlackAlert(alert, kondisi);
    }
  } catch (error) {
    logger.logError('ALERT_NOTIFICATION_FAILED', error, { alertId: alert._id });
  }
}

/**
 * DESKRIPSI: Kirim email alert dengan analisis AI
 *
 * @param {Object} alert - Alert object
 * @param {Object} kondisi - Kondisi alert
 */
async function kirimEmailAlert(alert, kondisi) {
  try {
    // Gunakan fungsi baru dengan analisis AI
    await kirimEmailDenganAnalisis(alert, kondisi);
  } catch (error) {
    logger.logError('EMAIL_ALERT_FAILED', error, { alertId: alert._id });
    // Fallback ke email tanpa AI jika gagal
    try {
      await kirimEmailFallback(alert, kondisi);
    } catch (fallbackError) {
      logger.logError('EMAIL_FALLBACK_FAILED', fallbackError, { alertId: alert._id });
    }
  }
}

/**
 * DESKRIPSI: Kumpulkan data lengkap untuk template email
 */
async function kumpulkanDataUntukTemplateEmail(alert, kondisi) {
  try {
    const serverId = alert.serverId;

    // Data server
    const Server = require('../model/Server');
    const server = await Server.findById(serverId).select('nama jenisServer spesifikasi lokasi');

    // Data metrics real-time
    const Metrik = require('../model/Metrik');
    const metricsRealtime = await Metrik.findOne({ serverId })
      .sort({ timestamp: -1 });

    // Data historis untuk tren
    const duaJamLalu = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const metricsHistoris = await Metrik.find({
      serverId,
      timestamp: { $gte: duaJamLalu }
    }).sort({ timestamp: -1 }).limit(12); // 12 data points untuk 2 jam

    // Alert aktif lainnya
    const Alert = require('../model/Alert');
    const alertsAktif = await Alert.find({
      serverId,
      statusAlert: { $in: ['new', 'acknowledged'] },
      _id: { $ne: alert._id }
    }).select('judul severity kondisiPemicu').limit(3);

    // Ringkasan health untuk AI analysis
    const ringkasanHealth = generateRingkasanDataHealth({
      alert,
      kondisi,
      server,
      metricsRealtime,
      metricsHistoris,
      alertsAktif,
      timestamp: new Date()
    });

    return {
      alert,
      kondisi,
      server,
      metricsRealtime,
      metricsHistoris,
      alertsAktif,
      ringkasanHealth,
      timestamp: new Date()
    };

  } catch (error) {
    logger.logError('TEMPLATE_DATA_COLLECTION_FAILED', error, { alertId: alert._id });
    throw error;
  }
}

/**
 * DESKRIPSI: Buat subjek email alert yang informatif
 */
function buatSubjekEmailAlert(alert, kondisi, analisisAI) {
  const severityEmoji = {
    'critical': '🚨',
    'warning': '⚠️',
    'danger': '🔴'
  };

  const emoji = severityEmoji[alert.severity] || '🚨';
  const serverName = alert.serverId; // Dalam praktiknya, ambil dari server data
  const parameter = kondisi.parameter;
  const nilai = alert.kondisiPemicu?.nilaiAktual || 'N/A';

  return `${emoji} ALERT ${alert.severity.toUpperCase()}: ${serverName} - ${parameter.toUpperCase()} ${nilai}${kondisi.unit}`;
}
async function kumpulkanDataUntukAnalisisAI(alert, kondisi) {
  try {
    const serverId = alert.serverId;
    const parameter = kondisi.parameter;

    // Data real-time saat alert
    const metricsRealtime = await Metrik.findOne({ serverId })
      .sort({ timestamp: -1 });

    // Data historis 2 jam terakhir untuk parameter yang bermasalah
    const duaJamLalu = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const metricsHistoris = await Metrik.find({
      serverId,
      timestamp: { $gte: duaJamLalu }
    }).sort({ timestamp: -1 }).limit(50); // Maksimal 50 data points

    // Info server
    const server = await Server.findById(serverId).select('nama jenisServer spesifikasi lokasi');

    // Alert aktif lain pada server yang sama
    const alertsAktif = await Alert.find({
      serverId,
      statusAlert: { $in: ['new', 'acknowledged'] },
      _id: { $ne: alert._id }
    }).select('judul severity kondisiPemicu');

    return {
      alert,
      kondisi,
      server,
      metricsRealtime,
      metricsHistoris,
      alertsAktif,
      timestamp: new Date()
    };
  } catch (error) {
    logger.logError('DATA_COLLECTION_FOR_AI_FAILED', error, { alertId: alert._id });
    throw error;
  }
}

/**
 * DESKRIPSI: Generate ringkasan data health dalam format terstruktur
 */
function generateRingkasanDataHealth(dataAI) {
  const { alert, kondisi, server, metricsRealtime, metricsHistoris, alertsAktif } = dataAI;

  // Helper function untuk status parameter
  const getStatusParameter = (nilai, warning, critical) => {
    if (nilai >= critical) return 'Critical';
    if (nilai >= warning) return 'Warning';
    return 'Normal';
  };

  // Header ringkasan
  let ringkasan = `=== RINGKASAN KESEHATAN SERVER ===\n`;
  ringkasan += `Server: ${server.nama} (${server.jenisServer || 'Unknown'}, ${server.lokasi || 'Unknown'})\n`;
  ringkasan += `Alert Dipicu: ${kondisi.parameter} pada ${alert.timestampPemicu.toISOString()}\n`;
  ringkasan += `Severity: ${alert.severity}, Durasi: ${Math.round((Date.now() - alert.timestampPemicu) / 60000)} menit\n\n`;

  // Status real-time
  ringkasan += `=== STATUS REAL-TIME ===\n`;
  if (metricsRealtime) {
    const m = metricsRealtime;
    ringkasan += `CPU: ${m.cpu?.persentase || 0}% (${getStatusParameter(m.cpu?.persentase || 0, 70, 85)})\n`;
    ringkasan += `Memory: ${m.memori?.persentase || 0}% (${getStatusParameter(m.memori?.persentase || 0, 75, 90)})\n`;
    ringkasan += `Disk: ${m.disk?.persentase || 0}% (${getStatusParameter(m.disk?.persentase || 0, 80, 95)})\n`;
    ringkasan += `Network: ${m.jaringan?.downloadMbps || 0} MB/s (${getStatusParameter(m.jaringan?.downloadMbps || 0, 100, 200)})\n`;
    ringkasan += `Load: ${(m.sistemOperasi?.bebanRataRata?.['1menit'] || 0).toFixed(1)} (${getStatusParameter(m.sistemOperasi?.bebanRataRata?.['1menit'] || 0, 2.0, 5.0)})\n`;
    ringkasan += `Temperature: ${m.suhu?.celcius || 0}°C (${getStatusParameter(m.suhu?.celcius || 0, 70, 85)})\n`;
    ringkasan += `Uptime: ${Math.round((m.sistemOperasi?.uptimeDetik || 0) / 3600)} hours (${getStatusParameter(m.sistemOperasi?.uptimeDetik || 0, 300, 600)})\n`;
    ringkasan += `Response Time: ${m.jaringan?.latensiMs || 0} ms (${getStatusParameter(m.jaringan?.latensiMs || 0, 2000, 5000)})\n`;
    ringkasan += `Error Rate: ${m.errorRate || 0}% (${getStatusParameter(m.errorRate || 0, 5, 10)})\n\n`;
  }

  // Tren historis (ringkas)
  ringkasan += `=== TREN HISTORIS (2 jam terakhir) ===\n`;
  if (metricsHistoris.length > 0) {
    const parameterMap = {
      'cpu_usage': 'cpu.persentase',
      'memory_usage': 'memori.persentase',
      'disk_usage': 'disk.persentase',
      'network_io': 'jaringan.downloadMbps',
      'system_load': 'sistemOperasi.bebanRataRata.1menit',
      'temperature': 'suhu.celcius',
      'server_uptime': 'sistemOperasi.uptimeDetik',
      'response_time': 'jaringan.latensiMs',
      'error_rate': 'errorRate'
    };

    const path = parameterMap[kondisi.parameter];
    if (path) {
      const values = metricsHistoris.map(m => getNestedValue(m, path)).filter(v => v !== undefined);
      if (values.length > 0) {
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        const min = Math.min(...values).toFixed(1);
        const max = Math.max(...values).toFixed(1);
        const trend = values[0] > values[values.length - 1] ? 'menurun' : 'meningkat';

        ringkasan += `${kondisi.parameter} ${trend} dari ${min} ke ${max} (avg: ${avg})\n`;
      }
    }
  }

  // Kontekstualisasi alert
  ringkasan += `\n=== KONTEKS ALERT ===\n`;
  ringkasan += `Alert ini bersifat ${kondisi.alertType} dengan threshold ${kondisi.thresholds[alert.severity.toLowerCase()].operator}${kondisi.thresholds[alert.severity.toLowerCase()].nilai}${kondisi.unit}\n`;

  if (alertsAktif.length > 0) {
    ringkasan += `Alert aktif lain: ${alertsAktif.length} alert\n`;
    alertsAktif.slice(0, 3).forEach(a => {
      ringkasan += `- ${a.judul} (${a.severity})\n`;
    });
  } else {
    ringkasan += `Tidak ada alert aktif lain pada server ini\n`;
  }

  return ringkasan;
}

/**
 * DESKRIPSI: Lakukan analisis AI terhadap kondisi server
 */
async function lakukanAnalisisAI(ringkasanHealth, dataAI) {
  try {
    const { alert, kondisi, server } = dataAI;

    // Import layanan AI
    const layananAi = require('./layananAi');

    // Buat prompt untuk AI
    const prompt = buatPromptAnalisisAI(ringkasanHealth, alert, kondisi, server);

    // Siapkan context data untuk logging
    const contextData = {
      serverInfo: server,
      metricsData: dataAI.metricsRealtime,
      historicalData: dataAI.metricsHistoris,
      alertInfo: alert,
      conditionInfo: kondisi
    };

    // Kirim ke AI untuk analisis dengan logging
    const responseAI = await layananAi.analisisKondisiServer(prompt, alert.serverId, contextData);

    // Parse response AI menjadi struktur terstruktur
    return parseResponseAI(responseAI);

  } catch (error) {
    logger.logError('AI_ANALYSIS_FAILED', error, { alertId: dataAI.alert._id });
    // Return fallback analysis
    return {
      ringkasanKondisi: 'Analisis AI tidak tersedia saat ini',
      rekomendasiImmediate: ['Periksa kondisi server secara manual'],
      rekomendasiPreventif: ['Pastikan monitoring system berfungsi normal'],
      prioritasEskalasi: 'Tinggi',
      estimasiWaktu: 'Segera'
    };
  }
}

/**
 * DESKRIPSI: Buat prompt untuk analisis AI
 */
function buatPromptAnalisisAI(ringkasanHealth, alert, kondisi, server) {
  const prompt = `
ANALISIS KESEHATAN SERVER - ALERT MONITORING

${ringkasanHealth}

TUGAS ANDA:
1. Berikan ringkasan kondisi server dalam 2-3 kalimat
2. Identifikasi masalah utama dan root cause potensial
3. Berikan rekomendasi immediate (action items prioritas tinggi)
4. Berikan rekomendasi preventif (untuk mencegah masalah serupa)
5. Tentukan prioritas eskalasi (Rendah/Sedang/Tinggi/Kritis)
6. Estimasi waktu penyelesaian

FORMAT OUTPUT (JSON):
{
  "ringkasanKondisi": "string",
  "masalahUtama": "string",
  "rootCause": "string",
  "rekomendasiImmediate": ["action1", "action2"],
  "rekomendasiPreventif": ["action1", "action2"],
  "prioritasEskalasi": "Tinggi",
  "estimasiWaktu": "15-30 menit"
}

INGAT:
- Fokus pada actionable recommendations
- Pertimbangkan jenis server: ${server.jenisServer || 'umum'}
- Bahasa Indonesia
- Jangan berikan instruksi berbahaya
- Maksimal 300 kata total
`;

  return prompt;
}

/**
 * DESKRIPSI: Parse response AI menjadi struktur terstruktur
 */
function parseResponseAI(responseAI) {
  try {
    // Coba parse sebagai JSON
    const parsed = JSON.parse(responseAI);
    return {
      ringkasanKondisi: parsed.ringkasanKondisi || 'Analisis tidak tersedia',
      masalahUtama: parsed.masalahUtama || '',
      rootCause: parsed.rootCause || '',
      rekomendasiImmediate: Array.isArray(parsed.rekomendasiImmediate) ? parsed.rekomendasiImmediate : [],
      rekomendasiPreventif: Array.isArray(parsed.rekomendasiPreventif) ? parsed.rekomendasiPreventif : [],
      prioritasEskalasi: parsed.prioritasEskalasi || 'Sedang',
      estimasiWaktu: parsed.estimasiWaktu || 'Tidak diketahui'
    };
  } catch (error) {
    // Jika bukan JSON, ekstrak informasi dari text
    logger.warn('AI response bukan JSON, menggunakan fallback parsing', { response: responseAI.substring(0, 200) });

    return {
      ringkasanKondisi: responseAI.substring(0, 200) + '...',
      rekomendasiImmediate: ['Periksa kondisi server sesuai deskripsi alert'],
      rekomendasiPreventif: ['Tinjau konfigurasi monitoring'],
      prioritasEskalasi: 'Sedang',
      estimasiWaktu: 'Segera'
    };
  }
}

/**
 * DESKRIPSI: Kirim email dengan analisis AI
 */
async function kirimEmailDenganAnalisis(alert, kondisi) {
  let logId = null;
  let sessionId = null;

  try {
    // Import services
    const aiLoggingService = require('./aiLoggingService');

    // Kumpulkan data lengkap untuk template email
    const dataLengkap = await kumpulkanDataUntukTemplateEmail(alert, kondisi);

    // Start logging AI decision
    const loggingContext = await aiLoggingService.startAlertAnalysisLogging(
      alert._id,
      alert.serverId,
      null, // userId - bisa diambil dari kondisi notifikasi
      {
        prompt: '', // Will be filled when AI analysis starts
        serverInfo: dataLengkap.server,
        metricsData: dataLengkap.metricsRealtime,
        historicalData: dataLengkap.metricsHistoris,
        userContext: null
      }
    );

    sessionId = loggingContext.sessionId;
    logId = loggingContext.logId;

    // Lakukan analisis AI
    const analisisAI = await lakukanAnalisisAI(dataLengkap.ringkasanHealth, dataLengkap);

    // Complete logging dengan output AI
    await aiLoggingService.completeAlertAnalysisLogging(
      sessionId,
      analisisAI.rawResponse || JSON.stringify(analisisAI),
      analisisAI,
      {
        confidence: analisisAI.confidence || 0.8,
        processingTime: analisisAI.processingTime || 0,
        tokensUsed: analisisAI.tokensUsed || { total: 0 },
        accuracy: 0.8,
        relevance: 0.9,
        actionability: 0.8,
        timeliness: 0.9
      }
    );

    // Import layanan email
    const layananEmail = require('./layananEmail');

    // Buat subjek email yang informatif
    const subjekEmail = buatSubjekEmailAlert(alert, kondisi, analisisAI);

    // Siapkan data email
    const emailData = {
      to: kondisi.notifikasi?.email?.penerima || 'admin@company.com',
      subject: subjekEmail,
      html: buatTemplateEmailAlert(dataLengkap, analisisAI)
    };

    // Kirim email
    const emailResult = await layananEmail.kirimEmail(emailData);

    // Log successful email alert
    logEmailAlert(alert._id.toString(), {
      alertType: kondisi.level || 'unknown',
      recipients: [emailData.to],
      emailTemplate: 'ai_analysis_template',
      deliveryStatus: 'sent',
      smtpResponse: emailResult?.messageId || 'OK',
      retryCount: 0,
      emailSize: emailData.html?.length || 0,
      subject: subjekEmail
    });

    // Log successful email sending
    await aiLoggingService.addUserInteraction(
      logId,
      null, // system user
      'email_sent',
      {
        recipient: emailData.to,
        subject: subjekEmail,
        templateUsed: 'ai_analysis_template'
      }
    );

    logger.debug(`Email alert dengan AI analysis dikirim untuk ${alert._id}`);

  } catch (error) {
    // Log failed email alert
    logEmailAlert(alert._id.toString(), {
      alertType: kondisi.level || 'unknown',
      recipients: [kondisi.notifikasi?.email?.penerima || 'admin@company.com'],
      emailTemplate: 'ai_analysis_template',
      deliveryStatus: 'failed',
      retryCount: 0,
      emailSize: 0,
      subject: `🚨 ALERT: ${alert.judul}`,
      error: error.message
    });

    // Log error jika ada logId
    if (logId && sessionId) {
      try {
        await aiLoggingService.logAIError(
          logId,
          'email_sending_error',
          error.message,
          'Fallback to standard email template'
        );
      } catch (logError) {
        logger.logError('AI_ERROR_LOGGING_FAILED', logError, { originalError: error.message });
      }
    }

    logger.logError('EMAIL_WITH_AI_ANALYSIS_FAILED', error, { alertId: alert._id });
    throw error;
  }
}

/**
 * DESKRIPSI: Kirim email fallback tanpa AI
 */
async function kirimEmailFallback(alert, kondisi) {
  try {
    const layananEmail = require('./layananEmail');

    const emailData = {
      to: 'admin@company.com',
      subject: `🚨 ALERT: ${alert.judul}`,
      html: `
        <h2>${alert.judul}</h2>
        <p>${alert.deskripsi}</p>
        <p><strong>Parameter:</strong> ${kondisi.parameter}</p>
        <p><strong>Nilai:</strong> ${alert.kondisiPemicu.nilaiAktual}${alert.kondisiPemicu.unit}</p>
        <p><strong>Threshold:</strong> ${alert.kondisiPemicu.operator}${alert.kondisiPemicu.threshold}${alert.kondisiPemicu.unit}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Waktu:</strong> ${alert.timestampPemicu.toISOString()}</p>
        <br>
        <p>Periksa dashboard monitoring untuk detail lebih lanjut.</p>
      `
    };

    await layananEmail.kirimEmail(emailData);
    logger.debug(`Email alert fallback dikirim untuk ${alert._id}`);

  } catch (error) {
    logger.logError('EMAIL_FALLBACK_FAILED', error, { alertId: alert._id });
    throw error;
  }
}

/**
 * DESKRIPSI: Buat template HTML email alert dengan analisis AI
 */
function buatTemplateEmailAlert(dataLengkap, analisisAI) {
  const { alert, kondisi, server, metricsRealtime, metricsHistoris, alertsAktif } = dataLengkap;

  // Helper functions untuk formatting
  const formatSeverityColor = (severity) => {
    const colors = {
      'critical': '#dc3545',
      'warning': '#ffc107',
      'danger': '#dc3545',
      'normal': '#28a745'
    };
    return colors[severity] || '#6c757d';
  };

  const formatSeverityLabel = (severity) => {
    const labels = {
      'critical': 'Kritis',
      'warning': 'Peringatan',
      'danger': 'Bahaya',
      'normal': 'Normal'
    };
    return labels[severity] || 'Tidak Diketahui';
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'N/A';
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}h ${hours}j ${minutes}m`;
  };

  const formatParameterValue = (param, value) => {
    if (!value && value !== 0) return 'N/A';
    const paramConfig = {
      cpu: { unit: '%', label: 'CPU Usage' },
      memori: { unit: '%', label: 'Memory Usage' },
      disk: { unit: '%', label: 'Disk Usage' },
      jaringan: { unit: 'MB/s', label: 'Network I/O' }
    };
    const config = paramConfig[param] || { unit: '', label: param };
    return `${value}${config.unit}`;
  };

  const getParameterStatus = (param, value) => {
    if (!value && value !== 0) return 'unknown';

    const thresholds = {
      cpu: { normal: [0, 70], warning: [70, 85], critical: [85, 100] },
      memori: { normal: [0, 75], warning: [75, 88], critical: [88, 100] },
      disk: { normal: [0, 80], warning: [80, 90], critical: [90, 100] },
      jaringan: { normal: [0, 50], warning: [50, 100], critical: [100, Infinity] }
    };

    const paramThresholds = thresholds[param];
    if (!paramThresholds) return 'unknown';

    if (value >= paramThresholds.critical[0]) return 'critical';
    if (value >= paramThresholds.warning[0]) return 'warning';
    if (value >= paramThresholds.normal[0] && value <= paramThresholds.normal[1]) return 'normal';

    return 'unknown';
  };

  // Generate HTML template
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alert Server - ${alert.judul}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 700px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, ${formatSeverityColor(alert.severity)}, ${formatSeverityColor(alert.severity)}dd);
            color: white;
            padding: 25px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header .subtitle {
            margin: 8px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .section {
            padding: 25px;
            border-bottom: 1px solid #e9ecef;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section h2 {
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid ${formatSeverityColor(alert.severity)};
            padding-bottom: 8px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid ${formatSeverityColor(alert.severity)};
        }
        .info-item strong {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6c757d;
            margin-bottom: 4px;
        }
        .info-item span {
            font-size: 14px;
            font-weight: 500;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            background: ${formatSeverityColor(alert.severity)};
            color: white;
        }
        .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metrics-table th,
        .metrics-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        .metrics-table th {
            background: #f8f9fa;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #495057;
        }
        .metrics-table .status-cell {
            text-align: center;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-normal { background-color: #28a745; }
        .status-warning { background-color: #ffc107; }
        .status-critical { background-color: #dc3545; }
        .status-unknown { background-color: #6c757d; }
        .ai-analysis {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            border: 1px solid #2196f3;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .ai-analysis h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 16px;
        }
        .ai-insight {
            background: rgba(255,255,255,0.8);
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            border-left: 4px solid #2196f3;
        }
        .recommendations {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .recommendations h3 {
            margin: 0 0 15px 0;
            color: #856404;
            font-size: 16px;
        }
        .priority-high {
            background: #f8d7da;
            border-left-color: #dc3545;
        }
        .priority-medium {
            background: #fff3cd;
            border-left-color: #ffc107;
        }
        .priority-low {
            background: #d1ecf1;
            border-left-color: #17a2b8;
        }
        .action-list {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        .action-list li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            display: flex;
            align-items: flex-start;
        }
        .action-list li:last-child {
            border-bottom: none;
        }
        .action-list li:before {
            content: "▶";
            color: ${formatSeverityColor(alert.severity)};
            font-weight: bold;
            margin-right: 10px;
            flex-shrink: 0;
        }
        .additional-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .additional-info h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #495057;
        }
        .trend-chart {
            font-family: monospace;
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            overflow-x: auto;
        }
        .alert-list {
            list-style: none;
            padding: 0;
        }
        .alert-list li {
            padding: 8px 12px;
            margin: 5px 0;
            background: #fff3cd;
            border-radius: 4px;
            border-left: 4px solid #ffc107;
            font-size: 14px;
        }
        .important-note {
            background: linear-gradient(135deg, #ffebee, #ffcdd2);
            border: 1px solid #f44336;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .important-note strong {
            color: #c62828;
            font-size: 16px;
            display: block;
            margin-bottom: 10px;
        }
        .contact-info {
            background: #e8f5e8;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .contact-info h4 {
            margin: 0 0 10px 0;
            color: #2e7d32;
        }
        .footer {
            background: #343a40;
            color: #adb5bd;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
        .footer .system-info {
            margin: 10px 0;
            font-size: 11px;
            opacity: 0.8;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .header, .section {
                padding: 15px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .metrics-table {
                font-size: 12px;
            }
            .metrics-table th,
            .metrics-table td {
                padding: 8px 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🚨 ${alert.judul}</h1>
            <div class="subtitle">
                Severity: <span class="status-badge">${formatSeverityLabel(alert.severity)}</span> |
                ${new Date(alert.timestampPemicu).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </div>
        </div>

        <!-- Bagian 1: Identitas Server -->
        <div class="section">
            <h2>🏢 INFORMASI SERVER</h2>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Nama Server</strong>
                    <span>${server?.nama || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Jenis Server</strong>
                    <span>${server?.jenisServer || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Lokasi Server</strong>
                    <span>${server?.lokasi || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Spesifikasi Utama</strong>
                    <span>${server?.spesifikasi || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Status Operasional</strong>
                    <span>Online</span>
                </div>
                <div class="info-item">
                    <strong>Waktu Uptime</strong>
                    <span>${formatUptime(metricsRealtime?.uptime)}</span>
                </div>
            </div>
        </div>

        <!-- Bagian 2: Ringkasan Kondisi Saat Ini -->
        <div class="section">
            <h2>📊 RINGKASAN KONDISI KESEHATAN SERVER</h2>

            <div class="info-item" style="margin-bottom: 20px;">
                <strong>Status Keseluruhan</strong>
                <span>
                    <span class="status-indicator status-${alert.severity}"></span>
                    ${formatSeverityLabel(alert.severity).toUpperCase()}
                </span>
            </div>

            <table class="metrics-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Nilai Saat Ini</th>
                        <th>Status</th>
                        <th>Threshold</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>CPU Usage</strong></td>
                        <td>${formatParameterValue('cpu', metricsRealtime?.cpu?.persentase)}</td>
                        <td class="status-cell">
                            <span class="status-indicator status-${getParameterStatus('cpu', metricsRealtime?.cpu?.persentase)}"></span>
                            ${formatSeverityLabel(getParameterStatus('cpu', metricsRealtime?.cpu?.persentase))}
                        </td>
                        <td>Warning: >70%, Critical: >85%</td>
                    </tr>
                    <tr>
                        <td><strong>Memory Usage</strong></td>
                        <td>${formatParameterValue('memori', metricsRealtime?.memori?.persentase)}</td>
                        <td class="status-cell">
                            <span class="status-indicator status-${getParameterStatus('memori', metricsRealtime?.memori?.persentase)}"></span>
                            ${formatSeverityLabel(getParameterStatus('memori', metricsRealtime?.memori?.persentase))}
                        </td>
                        <td>Warning: >75%, Critical: >88%</td>
                    </tr>
                    <tr>
                        <td><strong>Disk Usage</strong></td>
                        <td>${formatParameterValue('disk', metricsRealtime?.disk?.persentase)}</td>
                        <td class="status-cell">
                            <span class="status-indicator status-${getParameterStatus('disk', metricsRealtime?.disk?.persentase)}"></span>
                            ${formatSeverityLabel(getParameterStatus('disk', metricsRealtime?.disk?.persentase))}
                        </td>
                        <td>Warning: >80%, Critical: >90%</td>
                    </tr>
                    <tr>
                        <td><strong>Network I/O</strong></td>
                        <td>${formatParameterValue('jaringan', metricsRealtime?.jaringan?.downloadMbps)}</td>
                        <td class="status-cell">
                            <span class="status-indicator status-${getParameterStatus('jaringan', metricsRealtime?.jaringan?.downloadMbps)}"></span>
                            ${formatSeverityLabel(getParameterStatus('jaringan', metricsRealtime?.jaringan?.downloadMbps))}
                        </td>
                        <td>Warning: >50 MB/s, Critical: >100 MB/s</td>
                    </tr>
                </tbody>
            </table>

            <div class="info-grid" style="margin-top: 20px;">
                <div class="info-item">
                    <strong>Waktu Deteksi Alert</strong>
                    <span>${new Date(alert.timestampPemicu).toLocaleString('id-ID')}</span>
                </div>
                <div class="info-item">
                    <strong>Sumber Alert</strong>
                    <span>${kondisi.parameter} ${kondisi.thresholds[alert.severity]?.operator || '>'} ${kondisi.thresholds[alert.severity]?.value || kondisi.thresholds[alert.severity] || 'N/A'}${kondisi.unit}</span>
                </div>
                <div class="info-item">
                    <strong>Level Severity</strong>
                    <span class="status-badge">${formatSeverityLabel(alert.severity)}</span>
                </div>
                <div class="info-item">
                    <strong>Durasi Alert</strong>
                    <span>${Math.round((Date.now() - alert.timestampPemicu) / 60000)} menit</span>
                </div>
            </div>
        </div>

        <!-- Bagian 3: Analisis Singkat AI -->
        <div class="section">
            <h2>🤖 ANALISIS INTELIJEN BUATAN (AI)</h2>

            <div class="ai-analysis">
                <h3>Ringkasan Analisis</h3>
                <div class="ai-insight">
                    ${analisisAI?.analisis || 'Analisis AI sedang diproses. Kondisi server memerlukan perhatian segera berdasarkan parameter yang dilampaui threshold.'}
                </div>

                ${analisisAI?.penyebabMungkin && analisisAI.penyebabMungkin.length > 0 ? `
                <h4 style="margin: 15px 0 10px 0; color: #1976d2;">Faktor Penyebab Utama:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    ${analisisAI.penyebabMungkin.map(cause => `<li style="margin: 5px 0;">${cause}</li>`).join('')}
                </ul>
                ` : ''}

                <h4 style="margin: 15px 0 10px 0; color: #1976d2;">Tren Perkembangan:</h4>
                <div class="ai-insight">
                    ${analisisAI?.tren || 'Berdasarkan data historis 2 jam terakhir, kondisi server menunjukkan tren yang perlu dimonitor secara intensif.'}
                </div>

                <h4 style="margin: 15px 0 10px 0; color: #1976d2;">Dampak Potensial:</h4>
                <div class="ai-insight">
                    ${analisisAI?.dampak || 'Kondisi ini dapat mempengaruhi performa aplikasi dan pengalaman pengguna jika tidak segera ditangani.'}
                </div>
            </div>
        </div>

        <!-- Bagian 4: Rekomendasi Tindakan -->
        <div class="section">
            <h2>💡 REKOMENDASI TINDAKAN</h2>

            <div class="recommendations">
                <h3>Tindakan Prioritas Tinggi (Segera):</h3>
                <ul class="action-list">
                    ${analisisAI?.rekomendasi && analisisAI.rekomendasi.length > 0 ?
                        analisisAI.rekomendasi.slice(0, 3).map(rec => `<li>${rec}</li>`).join('') :
                        `
                        <li>Periksa proses yang menggunakan resource tinggi menggunakan monitoring tools</li>
                        <li>Evaluasi konfigurasi server dan aplikasi terkait</li>
                        <li>Siapkan rencana eskalasi jika kondisi memburuk</li>
                        `
                    }
                </ul>

                <h3 style="margin-top: 20px;">Tindakan Preventif Jangka Pendek:</h3>
                <ul class="action-list">
                    <li>Monitor kondisi server secara intensif selama 24 jam ke depan</li>
                    <li>Persiapkan scaling resources jika traffic meningkat</li>
                    <li>Backup konfigurasi dan data penting</li>
                    <li>Review log sistem untuk pola yang mencurigakan</li>
                </ul>

                <h3 style="margin-top: 20px;">Tindakan Perbaikan Jangka Panjang:</h3>
                <ul class="action-list">
                    <li>Optimalkan konfigurasi server berdasarkan usage pattern</li>
                    <li>Upgrade hardware jika diperlukan (CPU, RAM, Storage)</li>
                    <li>Implementasi auto-scaling dan load balancing</li>
                    <li>Lakukan audit keamanan dan performa berkala</li>
                </ul>

                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 6px;">
                    <strong>Estimasi Waktu Penyelesaian:</strong> ${analisisAI?.estimasiWaktuPenyelesaian || '2-4 jam untuk diagnosis awal, tergantung kompleksitas masalah'}<br>
                    <strong>Tim yang Perlu Dilibatkan:</strong> SRE/DevOps, Database Administrator, Network Administrator
                </div>
            </div>
        </div>

        <!-- Bagian 5: Informasi Tambahan -->
        <div class="section">
            <h2>📈 DATA HISTORIS & TREN</h2>

            <div class="additional-info">
                <h3>Grafik Kondisi 2 Jam Terakhir:</h3>
                <div class="trend-chart">
CPU: [${'█'.repeat(Math.min(20, Math.floor((metricsRealtime?.cpu?.persentase || 0) / 5)))}${'░'.repeat(20 - Math.min(20, Math.floor((metricsRealtime?.cpu?.persentase || 0) / 5)))}] ${(metricsRealtime?.cpu?.persentase || 0).toFixed(1)}% ${metricsRealtime?.cpu?.persentase > 70 ? '↑' : '→'}<br>
Memory: [${'█'.repeat(Math.min(20, Math.floor((metricsRealtime?.memori?.persentase || 0) / 5)))}${'░'.repeat(20 - Math.min(20, Math.floor((metricsRealtime?.memori?.persentase || 0) / 5)))}] ${(metricsRealtime?.memori?.persentase || 0).toFixed(1)}% ${metricsRealtime?.memori?.persentase > 75 ? '↑' : '→'}<br>
Disk: [${'█'.repeat(Math.min(20, Math.floor((metricsRealtime?.disk?.persentase || 0) / 5)))}${'░'.repeat(20 - Math.min(20, Math.floor((metricsRealtime?.disk?.persentase || 0) / 5)))}] ${(metricsRealtime?.disk?.persentase || 0).toFixed(1)}% ${metricsRealtime?.disk?.persentase > 80 ? '↑' : '→'}<br>
Network: [${'█'.repeat(Math.min(20, Math.floor((metricsRealtime?.jaringan?.downloadMbps || 0) / 5)))}${'░'.repeat(20 - Math.min(20, Math.floor((metricsRealtime?.jaringan?.downloadMbps || 0) / 5)))}] ${(metricsRealtime?.jaringan?.downloadMbps || 0).toFixed(1)} MB/s ${metricsRealtime?.jaringan?.downloadMbps > 50 ? '↑' : '→'}
                </div>

                ${alertsAktif && alertsAktif.length > 0 ? `
                <h3>Alert Terkait Lainnya:</h3>
                <ul class="alert-list">
                    ${alertsAktif.map(alert => `<li><strong>${alert.judul}</strong> (${formatSeverityLabel(alert.severity)})</li>`).join('')}
                </ul>
                ` : '<p>Tidak ada alert aktif lainnya pada server ini.</p>'}

                <div style="margin-top: 20px; text-align: center;">
                    <a href="#" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">🔗 Akses Dashboard Monitoring</a>
                </div>
            </div>
        </div>

        <!-- Bagian 6: Catatan Penting -->
        <div class="section">
            <h2>⚠️ CATATAN PENTING</h2>

            <div class="important-note">
                <strong>ℹ️ PENTING: Data Bersifat Simulasi</strong>
                <p>Mohon diperhatikan bahwa data yang disajikan dalam laporan alert ini bersifat simulasi untuk keperluan pengembangan dan testing sistem monitoring. Dalam implementasi produksi, data akan bersumber dari sensor dan metrik server yang sesungguhnya.</p>
            </div>

            <div class="contact-info">
                <h4>Kontak Darurat:</h4>
                <p><strong>Tim On-Call:</strong> +62-XXX-XXXX-XXXX | oncall@company.com</p>
                <p><strong>Supervisor IT:</strong> supervisor@company.com</p>
                <p><strong>Vendor Support:</strong> support@vendor.com</p>
            </div>

            <div class="additional-info">
                <h4>Referensi:</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><a href="#" style="color: #007bff;">📋 Dokumentasi Troubleshooting</a></li>
                    <li><a href="#" style="color: #007bff;">📖 Runbook Server Operasional</a></li>
                    <li><a href="#" style="color: #007bff;">🚨 Incident Response Procedure</a></li>
                </ul>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>
                <strong>Sistem Monitoring Server AI Monitor</strong><br>
                Memberikan pemantauan cerdas dan responsif untuk kesehatan infrastruktur IT
            </div>
            <div class="system-info">
                Versi Sistem: 2.1.0 | Generated: ${new Date().toISOString()} | Alert ID: ${alert._id}
            </div>
        </div>
    </div>
</body>
</html>`;

  return html;
}

/**
 * DESKRIPSI: Kirim webhook alert
 */
async function kirimWebhookAlert(alert, kondisi) {
  // TODO: Implement webhook posting
  logger.debug(`Webhook alert akan dikirim untuk ${alert._id}`);
}

/**
 * DESKRIPSI: Kirim Slack alert
 */
async function kirimSlackAlert(alert, kondisi) {
  // TODO: Implement Slack posting
  logger.debug(`Slack alert akan dikirim untuk ${alert._id}`);
}

/**
 * DESKRIPSI: Emit alert baru via Socket.IO
 */
function emitAlertBaru(alert, kondisi) {
  if (!io) return;

  const alertData = {
    id: alert._id,
    serverId: alert.serverId,
    parameter: kondisi.parameter,
    severity: alert.severity,
    title: alert.judul,
    description: alert.deskripsi,
    value: alert.kondisiPemicu.nilaiAktual,
    threshold: alert.kondisiPemicu.threshold,
    unit: alert.kondisiPemicu.unit,
    timestamp: alert.timestampPemicu
  };

  // Emit ke namespace alert
  const alertNamespace = io.of('/alert');
  alertNamespace.to('alerts_all').emit('alert:new', alertData);

  if (alert.severity === STATUS_CRITICAL) {
    alertNamespace.to('alerts_critical').emit('alert:critical', alertData);
  } else {
    alertNamespace.to('alerts_warning').emit('alert:warning', alertData);
  }

  // Emit ke room server spesifik
  alertNamespace.to(`server_${alert.serverId}`).emit('alert:server_new', alertData);
}

/**
 * DESKRIPSI: Emit alert recovery via Socket.IO
 */
function emitAlertRecovery(alert) {
  if (!io) return;

  const recoveryData = {
    id: alert._id,
    serverId: alert.serverId,
    resolvedAt: alert.timestampResolusi
  };

  const alertNamespace = io.of('/alert');
  alertNamespace.to('alerts_all').emit('alert:resolved', recoveryData);
  alertNamespace.to(`server_${alert.serverId}`).emit('alert:server_resolved', recoveryData);
}

/**
 * DESKRIPSI: Mapping parameter ke jenis alert
 */
function mapParameterToJenisAlert(parameter) {
  const mapping = {
    'cpu_usage': 'cpu_high',
    'memory_usage': 'memory_high',
    'disk_usage': 'disk_high',
    'network_io': 'network_issue',
    'system_load': 'load_high',
    'temperature': 'temperature_high',
    'server_uptime': 'service_down',
    'response_time': 'response_slow',
    'error_rate': 'error_high'
  };

  return mapping[parameter] || 'custom';
}

/**
 * DESKRIPSI: Evaluasi alert untuk semua server aktif
 *
 * @returns {Promise<Array>} Array hasil evaluasi per server
 */
async function evaluasiAlertSemuaServer() {
  try {
    const servers = await Server.find({ aktif: true }).select('_id nama');
    const hasilEvaluasi = [];

    for (const server of servers) {
      try {
        // Dapatkan metrics terbaru server
        const metricsTerbaru = await Metrik.findOne({ serverId: server._id })
          .sort({ timestamp: -1 });

        if (metricsTerbaru) {
          const alerts = await evaluasiKondisiAlert(server._id, metricsTerbaru.toObject());
          hasilEvaluasi.push({
            serverId: server._id,
            namaServer: server.nama,
            alertsDibuat: alerts.length
          });
        }
      } catch (error) {
        logger.logError('SERVER_ALERT_EVALUATION_FAILED', error, { serverId: server._id });
        hasilEvaluasi.push({
          serverId: server._id,
          namaServer: server.nama,
          error: error.message
        });
      }
    }

    return hasilEvaluasi;

  } catch (error) {
    logger.logError('ALL_SERVERS_ALERT_EVALUATION_FAILED', error);
    throw error;
  }
}

module.exports = {
  setSocketIO,
  evaluasiKondisiAlert,
  evaluasiAlertSemuaServer,
  mapParameterToJenisAlert
};


/**
 * DESKRIPSI: Evaluasi kondisi kesehatan server
 *
 * TUJUAN: Menentukan status kesehatan server berdasarkan metrics terbaru
 *
 * @param {Object} metrics - Data metrics server
 * @returns {Object} Status kesehatan dan detail
 */
function evaluasiKesehatanServer(metrics) {
  const threshold = {
    cpu: { warning: 80, critical: 90 },
    memori: { warning: 85, critical: 95 },
    disk: { warning: 85, critical: 95 }
  };

  let status = 'OK';
  let level = 'NORMAL';
  let pesan = 'Server dalam kondisi baik';
  const masalah = [];

  // Evaluasi CPU
  if (metrics.cpu >= threshold.cpu.critical) {
    status = 'CRITICAL';
    level = 'CRITICAL';
    masalah.push(`CPU usage ${metrics.cpu}% (Critical > ${threshold.cpu.critical}%)`);
  } else if (metrics.cpu >= threshold.cpu.warning) {
    if (status !== 'CRITICAL') status = 'WARNING';
    if (level !== 'CRITICAL') level = 'WARNING';
    masalah.push(`CPU usage ${metrics.cpu}% (Warning > ${threshold.cpu.warning}%)`);
  }

  // Evaluasi Memory
  if (metrics.memori >= threshold.memori.critical) {
    status = 'CRITICAL';
    level = 'CRITICAL';
    masalah.push(`Memory usage ${metrics.memori}% (Critical > ${threshold.memori.critical}%)`);
  } else if (metrics.memori >= threshold.memori.warning) {
    if (status !== 'CRITICAL') status = 'WARNING';
    if (level !== 'CRITICAL') level = 'WARNING';
    masalah.push(`Memory usage ${metrics.memori}% (Warning > ${threshold.memori.warning}%)`);
  }

  // Evaluasi Disk
  if (metrics.disk >= threshold.disk.critical) {
    status = 'CRITICAL';
    level = 'CRITICAL';
    masalah.push(`Disk usage ${metrics.disk}% (Critical > ${threshold.disk.critical}%)`);
  } else if (metrics.disk >= threshold.disk.warning) {
    if (status !== 'CRITICAL') status = 'WARNING';
    if (level !== 'CRITICAL') level = 'WARNING';
    masalah.push(`Disk usage ${metrics.disk}% (Warning > ${threshold.disk.warning}%)`);
  }

  // Jika ada masalah, update pesan
  if (masalah.length > 0) {
    pesan = `Server mengalami masalah: ${masalah.join(', ')}`;
  }

  return {
    status,
    level,
    pesan,
    masalah,
    threshold
  };
}

/**
 * DESKRIPSI: Cek apakah alert sudah dikirim sebelumnya
 *
 * TUJUAN: Mencegah spam alert yang berulang untuk kondisi yang sama
 *
 * @param {string} serverId - ID server
 * @param {string} alertType - Tipe alert
 * @param {number} cooldownMinutes - Cooldown dalam menit (default 30)
 * @returns {boolean} True jika boleh kirim alert
 */
async function bolehKirimAlert(serverId, alertType, cooldownMinutes = 30) {
  try {
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const recentAlert = await Alert.findOne({
      serverId,
      tipe: alertType,
      dibuatPada: { $gte: cooldownTime }
    }).sort({ dibuatPada: -1 });

    return !recentAlert; // Boleh kirim jika tidak ada alert recent

  } catch (error) {
    logger.logError('ALERT_COOLDOWN_CHECK_FAILED', error, { serverId, alertType });
    return true; // Jika error, izinkan kirim alert
  }
}

/**
 * DESKRIPSI: Simpan alert ke database
 *
 * TUJUAN: Tracking semua alert yang dikirim
 *
 * @param {Object} dataAlert - Data alert
 * @returns {Object} Alert yang disimpan
 */
async function simpanAlert(dataAlert) {
  try {
    const alert = new Alert({
      serverId: dataAlert.serverId,
      userId: dataAlert.userId,
      tipe: dataAlert.tipe,
      level: dataAlert.level,
      pesan: dataAlert.pesan,
      data: dataAlert.data,
      status: 'sent'
    });

    await alert.save();
    return alert;

  } catch (error) {
    logger.logError('ALERT_SAVE_FAILED', error, dataAlert);
    throw error;
  }
}

/**
 * DESKRIPSI: Kirim alert untuk kondisi server tidak sehat
 *
 * TUJUAN: Mendeteksi dan mengirim notifikasi ketika server bermasalah
 *
 * @param {string} serverId - ID server yang bermasalah
 * @param {Object} metrics - Data metrics terbaru
 * @returns {Promise<Object>} Hasil pengiriman alert
 */
async function kirimAlertServer(serverId, metrics) {
  try {
    // Ambil data server
    const server = await Server.findById(serverId);
    if (!server) {
      throw new Error(`Server dengan ID ${serverId} tidak ditemukan`);
    }

    // Evaluasi kesehatan server
    const evaluasi = evaluasiKesehatanServer(metrics);

    // Jika server sehat, skip
    if (evaluasi.status === 'OK') {
      return { success: true, message: 'Server dalam kondisi baik' };
    }

    // Cek cooldown alert
    const alertType = `server_${evaluasi.status.toLowerCase()}`;
    const bolehKirim = await bolehKirimAlert(serverId, alertType);

    if (!bolehKirim) {
      return { success: true, message: 'Alert cooldown aktif, skip pengiriman' };
    }

    // Ambil data user
    const user = await Pengguna.findById(server.pemilik);
    if (!user) {
      throw new Error(`User pemilik server tidak ditemukan`);
    }

    // Cek pengaturan email user
    if (!user.pengaturanEmail) {
      return { success: true, message: 'User tidak mengaktifkan notifikasi email' };
    }

    const emailSettings = user.pengaturanEmail;
    const shouldSendAlert = (evaluasi.level === 'CRITICAL' && emailSettings.alertKritis) ||
                           (evaluasi.level === 'WARNING' && emailSettings.alertPeringatan);

    if (!shouldSendAlert) {
      return { success: true, message: 'User tidak subscribe alert level ini' };
    }

    // Generate rekomendasi AI
    let rekomendasiAi = null;
    try {
      if (emailSettings.rekomendasiAi) {
        rekomendasiAi = await layananAi.generateRekomendasi(server, metrics, evaluasi);
      }
    } catch (aiError) {
      logger.logError('AI_RECOMMENDATION_GENERATION_FAILED', aiError, {
        serverId,
        metrics,
        evaluation: evaluasi
      });
    }

    // Data alert untuk email
    const dataAlert = {
      server: {
        _id: server._id,
        nama: server.nama,
        jenisServer: server.jenisServer
      },
      metrics,
      level: evaluasi.level,
      pesan: evaluasi.pesan,
      rekomendasiAi,
      waktuAlert: new Date()
    };

    // Kirim email alert
    const hasilEmail = await layananEmail.kirimEmailAlertServer(user.email, dataAlert);

    // Simpan alert ke database
    await simpanAlert({
      serverId,
      userId: user._id,
      tipe: alertType,
      level: evaluasi.level,
      pesan: evaluasi.pesan,
      data: {
        metrics,
        rekomendasiAi,
        emailSent: true,
        emailMessageId: hasilEmail.messageId
      }
    });

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log alert berhasil
    logger.logAlert('SERVER_ALERT_SENT', {
      serverId,
      serverName: server.nama,
      userId: user._id,
      userEmail: user.email,
      alertLevel: evaluasi.level,
      alertMessage: evaluasi.pesan,
      emailMessageId: hasilEmail.messageId,
      aiRecommendation: !!rekomendasiAi
    });

    return {
      success: true,
      alertLevel: evaluasi.level,
      emailSent: true,
      messageId: hasilEmail.messageId,
      aiRecommendation: !!rekomendasiAi
    };

  } catch (error) {
    // Log error
    logger.logError('SERVER_ALERT_SEND_FAILED', error, {
      serverId,
      metrics
    });

    // Simpan alert gagal ke database
    try {
      await simpanAlert({
        serverId,
        userId: null, // User tidak diketahui jika error di awal
        tipe: 'server_error',
        level: 'ERROR',
        pesan: `Gagal kirim alert: ${error.message}`,
        data: { metrics, error: error.message },
        status: 'failed'
      });
    } catch (saveError) {
      logger.logError('ALERT_SAVE_FAILED', saveError, { serverId });
    }

    throw new Error(`Gagal kirim alert server: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim alert recovery ketika server kembali normal
 *
 * TUJUAN: Memberitahu user bahwa server sudah kembali ke kondisi normal
 *
 * @param {string} serverId - ID server yang recovery
 * @param {Object} metrics - Metrics terbaru setelah recovery
 * @returns {Promise<Object>} Hasil pengiriman alert recovery
 */
async function kirimAlertRecovery(serverId, metrics) {
  try {
    // Ambil data server
    const server = await Server.findById(serverId);
    if (!server) {
      throw new Error(`Server dengan ID ${serverId} tidak ditemukan`);
    }

    // Ambil data user
    const user = await Pengguna.findById(server.pemilik);
    if (!user || !user.pengaturanEmail?.alertRecovery) {
      return { success: true, message: 'User tidak subscribe alert recovery' };
    }

    // Cari alert terakhir untuk server ini
    const lastAlert = await Alert.findOne({
      serverId,
      tipe: { $in: ['server_critical', 'server_warning'] }
    }).sort({ dibuatPada: -1 });

    if (!lastAlert) {
      return { success: true, message: 'Tidak ada alert sebelumnya untuk server ini' };
    }

    // Hitung durasi downtime
    const downtimeDuration = new Date() - lastAlert.dibuatPada;
    const durasiDown = formatDurasi(downtimeDuration);

    // Data recovery
    const dataRecovery = {
      server: {
        _id: server._id,
        nama: server.nama,
        jenisServer: server.jenisServer
      },
      waktuRecovery: new Date(),
      durasiDown,
      metricsTerakhir: metrics
    };

    // Kirim email recovery
    const hasilEmail = await layananEmail.kirimEmailRecoveryServer(
      user.email,
      user.namaPengguna,
      dataRecovery
    );

    // Simpan alert recovery ke database
    await simpanAlert({
      serverId,
      userId: user._id,
      tipe: 'server_recovery',
      level: 'INFO',
      pesan: `Server ${server.nama} kembali normal setelah ${durasiDown} downtime`,
      data: {
        recoveryData: dataRecovery,
        previousAlertId: lastAlert._id,
        emailSent: true,
        emailMessageId: hasilEmail.messageId
      }
    });

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log recovery berhasil
    logger.logAlert('SERVER_RECOVERY_ALERT_SENT', {
      serverId,
      serverName: server.nama,
      userId: user._id,
      userEmail: user.email,
      downtime: durasiDown,
      emailMessageId: hasilEmail.messageId
    });

    return {
      success: true,
      emailSent: true,
      messageId: hasilEmail.messageId,
      downtime: durasiDown
    };

  } catch (error) {
    logger.logError('SERVER_RECOVERY_ALERT_SEND_FAILED', error, { serverId });
    throw new Error(`Gagal kirim alert recovery: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim ringkasan harian kesehatan server
 *
 * TUJUAN: Memberikan laporan periodik kondisi semua server user
 *
 * @param {string} userId - ID user penerima ringkasan
 * @returns {Promise<Object>} Hasil pengiriman ringkasan
 */
async function kirimRingkasanHarian(userId) {
  try {
    // Ambil data user
    const user = await Pengguna.findById(userId);
    if (!user || !user.pengaturanEmail?.ringkasanHarian) {
      return { success: true, message: 'User tidak subscribe ringkasan harian' };
    }

    // Ambil semua server user
    const servers = await Server.find({ pemilik: userId });

    if (servers.length === 0) {
      return { success: true, message: 'User tidak memiliki server' };
    }

    // Ambil metrics terbaru untuk setiap server
    const dataServer = await Promise.all(
      servers.map(async (server) => {
        const metricsTerbaru = await Metrik.findOne({ serverId: server._id })
          .sort({ waktu: -1 });

        const evaluasi = metricsTerbaru ?
          evaluasiKesehatanServer(metricsTerbaru) :
          { status: 'UNKNOWN', level: 'UNKNOWN' };

        return {
          _id: server._id,
          nama: server.nama,
          jenisServer: server.jenisServer,
          status: evaluasi.status,
          metrics: metricsTerbaru || null,
          lastUpdate: metricsTerbaru?.waktu || null
        };
      })
    );

    // Kirim email ringkasan
    const hasilEmail = await layananEmail.kirimEmailRingkasanHarian(
      user.email,
      user.namaPengguna,
      dataServer
    );

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log ringkasan berhasil
    logger.logAlert('DAILY_SUMMARY_SENT', {
      userId,
      userEmail: user.email,
      serverCount: servers.length,
      emailMessageId: hasilEmail.messageId
    });

    return {
      success: true,
      emailSent: true,
      messageId: hasilEmail.messageId,
      serverCount: servers.length
    };

  } catch (error) {
    logger.logError('DAILY_SUMMARY_SEND_FAILED', error, { userId });
    throw new Error(`Gagal kirim ringkasan harian: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim rekomendasi AI ke user
 *
 * TUJUAN: Memberikan rekomendasi cerdas berdasarkan analisis performa
 *
 * @param {string} userId - ID user penerima rekomendasi
 * @param {Object} dataRekomendasi - Data rekomendasi dari AI
 * @returns {Promise<Object>} Hasil pengiriman rekomendasi
 */
async function kirimRekomendasiAI(userId, dataRekomendasi) {
  try {
    // Ambil data user
    const user = await Pengguna.findById(userId);
    if (!user || !user.pengaturanEmail?.rekomendasiAi) {
      return { success: true, message: 'User tidak subscribe rekomendasi AI' };
    }

    // Kirim email rekomendasi
    const hasilEmail = await layananEmail.kirimEmailRekomendasiAI(
      user.email,
      user.namaPengguna,
      dataRekomendasi
    );

    // Update statistik email user
    await layananEmail.updateStatistikEmail(user._id, true);

    // Log rekomendasi berhasil
    logger.logAlert('AI_RECOMMENDATION_SENT', {
      userId,
      userEmail: user.email,
      serverId: dataRekomendasi.server._id,
      recommendationCategory: dataRekomendasi.kategori,
      emailMessageId: hasilEmail.messageId
    });

    return {
      success: true,
      emailSent: true,
      messageId: hasilEmail.messageId
    };

  } catch (error) {
    logger.logError('AI_RECOMMENDATION_SEND_FAILED', error, {
      userId,
      recommendationData: dataRekomendasi
    });
    throw new Error(`Gagal kirim rekomendasi AI: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Format durasi dalam format yang mudah dibaca
 *
 * @param {number} milliseconds - Durasi dalam milliseconds
 * @returns {string} Durasi yang diformat
 */
function formatDurasi(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} hari ${hours % 24} jam ${minutes % 60} menit`;
  } else if (hours > 0) {
    return `${hours} jam ${minutes % 60} menit`;
  } else if (minutes > 0) {
    return `${minutes} menit ${seconds % 60} detik`;
  } else {
    return `${seconds} detik`;
  }
}

/**
 * DESKRIPSI: Membuat kondisi alert default untuk sistem
 *
 * TUJUAN: Setup kondisi alert default berdasarkan desain sistem
 * untuk semua parameter kesehatan server yang didukung.
 *
 * @returns {Promise<Array>} Array kondisi alert yang dibuat
 */
async function buatKondisiAlertDefault() {
  try {
    logger.info('Memulai pembuatan kondisi alert default');

    // Definisi kondisi alert default berdasarkan desain
    const kondisiDefault = [
      {
        parameter: 'cpu_usage',
        nama: 'CPU Usage Tinggi',
        deskripsi: 'Alert ketika penggunaan CPU melebihi threshold',
        thresholds: {
          warning: { nilai: 70, operator: '>', durasiMinimumMenit: 5 },
          critical: { nilai: 85, operator: '>', durasiMinimumMenit: 10 },
          recovery: { nilai: 60, operator: '<', durasiMinimumMenit: 5 }
        },
        alertType: 'temporary',
        antiSpam: {
          cooldownMenit: 30,
          stateBased: true,
          maxAlertPerJam: 3,
          thresholdBerulang: { jumlahMinimum: 3, dalamMenit: 60 }
        },
        notifikasi: { email: { aktif: true }, webhook: { aktif: false }, slack: { aktif: false } }
      },
      {
        parameter: 'memory_usage',
        nama: 'Memory Usage Tinggi',
        deskripsi: 'Alert ketika penggunaan memory melebihi threshold',
        thresholds: {
          warning: { nilai: 75, operator: '>', durasiMinimumMenit: 5 },
          critical: { nilai: 90, operator: '>', durasiMinimumMenit: 10 },
          recovery: { nilai: 70, operator: '<', durasiMinimumMenit: 5 }
        },
        alertType: 'temporary',
        antiSpam: {
          cooldownMenit: 30,
          stateBased: true,
          maxAlertPerJam: 3,
          thresholdBerulang: { jumlahMinimum: 3, dalamMenit: 60 }
        },
        notifikasi: { email: { aktif: true }, webhook: { aktif: false }, slack: { aktif: false } }
      },
      {
        parameter: 'disk_usage',
        nama: 'Disk Usage Tinggi',
        deskripsi: 'Alert ketika penggunaan disk melebihi threshold',
        thresholds: {
          warning: { nilai: 80, operator: '>', durasiMinimumMenit: 5 },
          critical: { nilai: 95, operator: '>', durasiMinimumMenit: 10 },
          recovery: { nilai: 75, operator: '<', durasiMinimumMenit: 5 }
        },
        alertType: 'recurring',
        antiSpam: {
          cooldownMenit: 60,
          stateBased: true,
          maxAlertPerJam: 2,
          thresholdBerulang: { jumlahMinimum: 2, dalamMenit: 120 }
        },
        notifikasi: { email: { aktif: true }, webhook: { aktif: false }, slack: { aktif: false } }
      },
      {
        parameter: 'network_io',
        nama: 'Network I/O Tinggi',
        deskripsi: 'Alert ketika network I/O melebihi threshold',
        thresholds: {
          warning: { nilai: 100, operator: '>', durasiMinimumMenit: 10 },
          critical: { nilai: 200, operator: '>', durasiMinimumMenit: 15 },
          recovery: { nilai: 80, operator: '<', durasiMinimumMenit: 5 }
        },
        unit: 'MB/s',
        alertType: 'temporary',
        antiSpam: {
          cooldownMenit: 15,
          stateBased: false,
          maxAlertPerJam: 5,
          thresholdBerulang: { jumlahMinimum: 5, dalamMenit: 60 }
        },
        notifikasi: { email: { aktif: false }, webhook: { aktif: false }, slack: { aktif: false } }
      },
      {
        parameter: 'system_load',
        nama: 'System Load Tinggi',
        deskripsi: 'Alert ketika system load average melebihi threshold',
        thresholds: {
          warning: { nilai: 2.0, operator: '>', durasiMinimumMenit: 5 },
          critical: { nilai: 5.0, operator: '>', durasiMinimumMenit: 10 },
          recovery: { nilai: 1.5, operator: '<', durasiMinimumMenit: 5 }
        },
        unit: 'load',
        alertType: 'temporary',
        antiSpam: {
          cooldownMenit: 20,
          stateBased: true,
          maxAlertPerJam: 4,
          thresholdBerulang: { jumlahMinimum: 3, dalamMenit: 60 }
        },
        notifikasi: { email: { aktif: true }, webhook: { aktif: false }, slack: { aktif: false } }
      },
      {
        parameter: 'temperature',
        nama: 'Temperature Tinggi',
        deskripsi: 'Alert ketika temperature CPU/server melebihi threshold',
        thresholds: {
          warning: { nilai: 70, operator: '>', durasiMinimumMenit: 5 },
          critical: { nilai: 85, operator: '>', durasiMinimumMenit: 10 },
          recovery: { nilai: 65, operator: '<', durasiMinimumMenit: 5 }
        },
        unit: '°C',
        alertType: 'temporary',
        antiSpam: {
          cooldownMenit: 30,
          stateBased: true,
          maxAlertPerJam: 3,
          thresholdBerulang: { jumlahMinimum: 2, dalamMenit: 60 }
        },
        notifikasi: { email: { aktif: true }, webhook: { aktif: false }, slack: { aktif: false } }
      },
      {
        parameter: 'server_uptime',
        nama: 'Server Downtime',
        deskripsi: 'Alert ketika server mengalami downtime',
        thresholds: {
          warning: { nilai: 300, operator: '<', durasiMinimumMenit: 5 }, // 5 menit downtime
          critical: { nilai: 600, operator: '<', durasiMinimumMenit: 10 }, // 10 menit downtime
          recovery: { nilai: 60, operator: '>', durasiMinimumMenit: 1 } // 1 menit uptime
        },
        unit: 'seconds',
        alertType: 'recurring',
        antiSpam: {
          cooldownMenit: 5,
          stateBased: true,
          maxAlertPerJam: 10,
          thresholdBerulang: { jumlahMinimum: 1, dalamMenit: 10 }
        },
        notifikasi: { email: { aktif: true }, webhook: { aktif: true }, slack: { aktif: true } }
      },
      {
        parameter: 'response_time',
        nama: 'Response Time Lambat',
        deskripsi: 'Alert ketika response time aplikasi melebihi threshold',
        thresholds: {
          warning: { nilai: 2000, operator: '>', durasiMinimumMenit: 5 }, // 2 detik
          critical: { nilai: 5000, operator: '>', durasiMinimumMenit: 10 }, // 5 detik
          recovery: { nilai: 1500, operator: '<', durasiMinimumMenit: 5 }
        },
        unit: 'ms',
        alertType: 'temporary',
        antiSpam: {
          cooldownMenit: 15,
          stateBased: false,
          maxAlertPerJam: 5,
          thresholdBerulang: { jumlahMinimum: 5, dalamMenit: 60 }
        },
        notifikasi: { email: { aktif: false }, webhook: { aktif: false }, slack: { aktif: false } }
      },
      {
        parameter: 'error_rate',
        nama: 'Error Rate Tinggi',
        deskripsi: 'Alert ketika error rate aplikasi melebihi threshold',
        thresholds: {
          warning: { nilai: 5, operator: '>', durasiMinimumMenit: 5 }, // 5%
          critical: { nilai: 10, operator: '>', durasiMinimumMenit: 10 }, // 10%
          recovery: { nilai: 2, operator: '<', durasiMinimumMenit: 5 } // 2%
        },
        unit: '%',
        alertType: 'temporary',
        antiSpam: {
          cooldownMenit: 10,
          stateBased: false,
          maxAlertPerJam: 6,
          thresholdBerulang: { jumlahMinimum: 3, dalamMenit: 30 }
        },
        notifikasi: { email: { aktif: true }, webhook: { aktif: false }, slack: { aktif: false } }
      }
    ];

    const kondisiDibuat = [];

    for (const kondisi of kondisiDefault) {
      try {
        // Cek apakah kondisi sudah ada
        const existing = await AlertCondition.findOne({
          parameter: kondisi.parameter,
          serverId: null, // Global conditions
          aktif: true
        });

        if (!existing) {
          const kondisiBaru = new AlertCondition({
            ...kondisi,
            serverId: null, // Global default
            metadata: {
              dibuatOleh: null, // System generated
              versi: 1
            }
          });

          await kondisiBaru.save();
          kondisiDibuat.push(kondisiBaru);
          logger.info(`Kondisi alert default dibuat: ${kondisi.parameter}`);
        } else {
          logger.debug(`Kondisi alert sudah ada: ${kondisi.parameter}`);
        }
      } catch (error) {
        logger.logError('DEFAULT_CONDITION_CREATE_FAILED', error, { parameter: kondisi.parameter });
      }
    }

    logger.info(`Pembuatan kondisi alert default selesai: ${kondisiDibuat.length} kondisi dibuat`);
    return kondisiDibuat;

  } catch (error) {
    logger.logError('DEFAULT_CONDITIONS_SETUP_FAILED', error);
    throw error;
  }
}

// Export semua fungsi
module.exports = {
  setSocketIO,
  evaluasiKondisiAlert,
  evaluasiAlertSemuaServer,
  mapParameterToJenisAlert,
  buatKondisiAlertDefault
};