// Layanan Email untuk Sistem Monitoring Server
// Mengelola semua aspek pengiriman email notifikasi dan komunikasi

const nodemailer = require('nodemailer');
const { logger } = require('../utilitas/logger');
const { EMAIL_DEFAULT, dapatkanTransporter, templateEmailAlertServerBermasalah } = require('../konfigurasi/email');
const Pengguna = require('../model/Pengguna');
const Server = require('../model/Server');
const Metrik = require('../model/Metrik');

/**
 * DESKRIPSI: Kirim email verifikasi akun saat registrasi
 *
 * TUJUAN: Mengirim link verifikasi ke email user yang baru registrasi
 *
 * @param {string} email - Email penerima
 * @param {string} namaPengguna - Nama user untuk personalisasi
 * @param {string} tokenVerifikasi - JWT token untuk verifikasi
 * @returns {Promise<Object>} Hasil pengiriman email
 */
async function kirimEmailVerifikasi(email, namaPengguna, tokenVerifikasi) {
  try {
    const transporter = dapatkanTransporter();

    // Derive display name from provided namaPengguna or fall back to email prefix
    const displayName = namaPengguna || (email ? email.split('@')[0] : 'Pengguna');

    // Buat link verifikasi
    const linkVerifikasi = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${tokenVerifikasi}`;

    // Template HTML untuk email verifikasi
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verifikasi Email - Monitoring Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: #007bff; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { padding: 20px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Verifikasi Email Anda</h2>
          </div>

          <div class="content">
            <h3>Halo ${displayName}!</h3>
            <p>Terima kasih telah mendaftar di Sistem Monitoring Server.</p>
            <p>Silakan klik tombol di bawah ini untuk memverifikasi email Anda:</p>

            <div style="text-align: center;">
              <a href="${linkVerifikasi}" class="button">Verifikasi Email Sekarang</a>
            </div>

            <p><strong>Link alternatif:</strong> <a href="${linkVerifikasi}">${linkVerifikasi}</a></p>

            <div class="warning">
              <strong>⚠️ PENTING:</strong> Link verifikasi akan expired dalam 24 jam.
              Jika link tidak berfungsi, silakan registrasi ulang.
            </div>

            <p>Jika Anda tidak mendaftar akun ini, abaikan email ini.</p>
          </div>

          <div class="footer">
            <p>Email ini dikirim otomatis oleh sistem monitoring server.</p>
            <p>Jangan reply email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: EMAIL_DEFAULT.from,
      to: email,
      subject: `${EMAIL_DEFAULT.subjectPrefix} Verifikasi Email Akun`,
      html: htmlTemplate,
      replyTo: EMAIL_DEFAULT.replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    // Log berhasil
    logger.logEmailActivity('VERIFICATION_EMAIL_SENT', {
      recipient: email,
      messageId: info.messageId,
      userName: displayName
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    // Log error
    logger.logError('EMAIL_VERIFICATION_SEND_FAILED', error, {
      recipient: email,
      userName: displayName
    });

    throw new Error(`Gagal kirim email verifikasi: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim email reset password
 *
 * TUJUAN: Mengirim link reset password ke email user
 *
 * @param {string} email - Email penerima
 * @param {string} namaPengguna - Nama user untuk personalisasi
 * @param {string} tokenReset - JWT token untuk reset password
 * @returns {Promise<Object>} Hasil pengiriman email
 */
async function kirimEmailResetPassword(email, namaPengguna, tokenReset) {
  try {
    const transporter = dapatkanTransporter();

    // Derive display name
    const displayName = namaPengguna || (email ? email.split('@')[0] : 'Pengguna');

    // Buat link reset password
    const linkReset = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${tokenReset}`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Password - Monitoring Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: #dc3545; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { padding: 20px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
          .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔑 Reset Password Akun</h2>
          </div>

          <div class="content">
            <h3>Halo ${displayName}!</h3>
            <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
            <p>Klik tombol di bawah ini untuk membuat password baru:</p>

            <div style="text-align: center;">
              <a href="${linkReset}" class="button">Reset Password Sekarang</a>
            </div>

            <p><strong>Link alternatif:</strong> <a href="${linkReset}">${linkReset}</a></p>

            <div class="warning">
              <strong>⚠️ KEAMANAN:</strong> Link reset password akan expired dalam 1 jam.
              Jangan bagikan link ini dengan siapapun.
            </div>

            <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
          </div>

          <div class="footer">
            <p>Email ini dikirim otomatis oleh sistem monitoring server.</p>
            <p>Jangan reply email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: EMAIL_DEFAULT.from,
      to: email,
      subject: `${EMAIL_DEFAULT.subjectPrefix} Reset Password Akun`,
      html: htmlTemplate,
      replyTo: EMAIL_DEFAULT.replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    // Log berhasil
    logger.logEmailActivity('PASSWORD_RESET_EMAIL_SENT', {
      recipient: email,
      messageId: info.messageId,
      userName: displayName
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    // Log error
    logger.logError('EMAIL_RESET_PASSWORD_SEND_FAILED', error, {
      recipient: email,
      userName: displayName
    });

    throw new Error(`Gagal kirim email reset password: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim email alert kondisi server tidak sehat
 *
 * TUJUAN: Memberitahu user tentang masalah kesehatan server dengan template komprehensif
 *
 * @param {string|string[]} penerima - Email penerima (single atau array)
 * @param {Object} dataAlert - Data alert yang akan dikirim
 * @param {Object} dataAlert.user - Info pengguna penerima
 * @param {Object} dataAlert.server - Info server
 * @param {Object} dataAlert.metrics - Data metrics saat alert
 * @param {string} dataAlert.level - Level alert (CRITICAL/WARNING)
 * @param {string[]} dataAlert.masalah - Array masalah yang terdeteksi
 * @param {string} dataAlert.penjelasanMasalah - Penjelasan singkat masalah
 * @param {string} dataAlert.rekomendasiAI - Rekomendasi dari AI (optional)
 * @param {Date} dataAlert.waktuAlert - Waktu terdeteksi alert
 * @param {string} dataAlert.dashboardUrl - URL dashboard (optional)
 * @returns {Promise<Object>} Hasil pengiriman email
 */
async function kirimEmailAlertServer(penerima, dataAlert) {
  try {
    const transporter = dapatkanTransporter();

    const {
      user,
      server,
      metrics,
      level,
      masalah = [],
      penjelasanMasalah,
      rekomendasiAI,
      waktuAlert,
      dashboardUrl
    } = dataAlert;

    // Gunakan template email baru dengan bahasa Indonesia formal
    const htmlTemplate = templateEmailAlertServerBermasalah({
      user,
      server,
      metrics,
      level,
      masalah,
      penjelasanMasalah,
      rekomendasiAI,
      waktuAlert,
      dashboardUrl
    });

    const mailOptions = {
      from: EMAIL_DEFAULT.from,
      to: Array.isArray(penerima) ? penerima.join(', ') : penerima,
      subject: `${EMAIL_DEFAULT.subjectPrefix} ALERT ${level === 'CRITICAL' ? 'KRITIS' : 'PERINGATAN'} - ${server.nama}: Kondisi Server Bermasalah`,
      html: htmlTemplate,
      replyTo: EMAIL_DEFAULT.replyTo,
      priority: level === 'CRITICAL' ? 'high' : 'normal'
    };

    const info = await transporter.sendMail(mailOptions);

    // Log berhasil
    logger.logEmailActivity('SERVER_ALERT_EMAIL_SENT', {
      recipients: Array.isArray(penerima) ? penerima : [penerima],
      messageId: info.messageId,
      serverId: server._id,
      serverName: server.nama,
      alertLevel: level,
      alertMessage: penjelasanMasalah,
      userId: user._id
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    // Log error
    logger.logError('EMAIL_SERVER_ALERT_SEND_FAILED', error, {
      recipients: penerima,
      serverData: dataAlert.server,
      alertLevel: dataAlert.level,
      userData: dataAlert.user
    });

    throw new Error(`Gagal kirim email alert server: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim email ringkasan harian kesehatan server
 *
 * TUJUAN: Memberikan laporan periodik kesehatan semua server user
 *
 * @param {string} email - Email penerima
 * @param {string} namaPengguna - Nama user
 * @param {Array} dataServer - Array data server dan metrics
 * @returns {Promise<Object>} Hasil pengiriman email
 */
async function kirimEmailRingkasanHarian(email, namaPengguna, dataServer) {
  try {
    const transporter = dapatkanTransporter();
    const displayName = namaPengguna || (email ? email.split('@')[0] : 'Pengguna');

    // Hitung statistik
    const totalServer = dataServer.length;
    const serverSehat = dataServer.filter(s => s.status === 'OK').length;
    const serverWarning = dataServer.filter(s => s.status === 'WARNING').length;
    const serverCritical = dataServer.filter(s => s.status === 'CRITICAL').length;

    // Template HTML untuk ringkasan harian
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ringkasan Harian Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 700px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: #28a745; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { padding: 20px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-box { text-align: center; padding: 15px; border-radius: 5px; flex: 1; margin: 0 5px; }
          .stat-healthy { background: #d4edda; border: 1px solid #c3e6cb; }
          .stat-warning { background: #fff3cd; border: 1px solid #ffeaa7; }
          .stat-critical { background: #f8d7da; border: 1px solid #f5c6cb; }
          .server-list { margin: 20px 0; }
          .server-item { border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 10px 0; }
          .server-healthy { border-left: 4px solid #28a745; }
          .server-warning { border-left: 4px solid #ffc107; }
          .server-critical { border-left: 4px solid #dc3545; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px; margin: 5px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📊 Ringkasan Harian Server</h2>
            <p>${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="content">
            <h3>Halo ${displayName}!</h3>
            <p>Berikut adalah ringkasan kondisi server Anda hari ini:</p>

            <div class="stats">
              <div class="stat-box stat-healthy">
                <h3>${serverSehat}</h3>
                <p>Server Sehat</p>
              </div>
              <div class="stat-box stat-warning">
                <h3>${serverWarning}</h3>
                <p>Server Warning</p>
              </div>
              <div class="stat-box stat-critical">
                <h3>${serverCritical}</h3>
                <p>Server Critical</p>
              </div>
            </div>

            <h4>Detail Kondisi Server:</h4>
            <div class="server-list">
              ${dataServer.map(server => `
                <div class="server-item server-${server.status.toLowerCase()}">
                  <h4>${server.nama} (${server.jenisServer})</h4>
                  <p><strong>Status:</strong> ${server.status}</p>
                  <p><strong>CPU:</strong> ${server.metrics?.cpu || 0}% |
                     <strong>Memory:</strong> ${server.metrics?.memori || 0}% |
                     <strong>Disk:</strong> ${server.metrics?.disk || 0}%</p>
                  <p><strong>Terakhir Update:</strong> ${server.lastUpdate ? new Date(server.lastUpdate).toLocaleString('id-ID') : 'Belum ada data'}</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/servers/${server._id}" class="action-button">Lihat Detail</a>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>Email ini dikirim otomatis setiap hari pukul 08:00 WIB.</p>
            <p>Jangan reply email ini. | Sistem Monitoring Server v1.0</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: EMAIL_DEFAULT.from,
      to: email,
      subject: `${EMAIL_DEFAULT.subjectPrefix} Ringkasan Harian Server - ${new Date().toLocaleDateString('id-ID')}`,
      html: htmlTemplate,
      replyTo: EMAIL_DEFAULT.replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    // Log berhasil
    logger.logEmailActivity('DAILY_SUMMARY_EMAIL_SENT', {
      recipient: email,
      messageId: info.messageId,
      userName: displayName,
      serverCount: totalServer,
      healthyCount: serverSehat,
      warningCount: serverWarning,
      criticalCount: serverCritical
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    // Log error
    logger.logError('EMAIL_DAILY_SUMMARY_SEND_FAILED', error, {
      recipient: email,
      userName: displayName,
      serverCount: dataServer.length
    });

    throw new Error(`Gagal kirim email ringkasan harian: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim email rekomendasi AI
 *
 * TUJUAN: Memberikan rekomendasi cerdas berdasarkan analisis AI
 *
 * @param {string} email - Email penerima
 * @param {string} namaPengguna - Nama user
 * @param {Object} dataRekomendasi - Data rekomendasi dari AI
 * @returns {Promise<Object>} Hasil pengiriman email
 */
async function kirimEmailRekomendasiAI(email, namaPengguna, dataRekomendasi) {
  try {
    const transporter = dapatkanTransporter();
    const displayName = namaPengguna || (email ? email.split('@')[0] : 'Pengguna');

    const { server, rekomendasi, prioritas, kategori } = dataRekomendasi;

    // Template HTML untuk rekomendasi AI
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rekomendasi AI - ${server.nama}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: #17a2b8; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { padding: 20px; }
          .recommendation { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .priority-high { background: #f8d7da; border: 1px solid #f5c6cb; }
          .priority-medium { background: #fff3cd; border: 1px solid #ffeaa7; }
          .priority-low { background: #d4edda; border: 1px solid #c3e6cb; }
          .action-items { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .action-item { margin: 8px 0; padding: 8px; background: white; border-radius: 3px; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🤖 Rekomendasi AI</h2>
            <p>Server: ${server.nama} | Prioritas: ${prioritas} | Kategori: ${kategori}</p>
          </div>

          <div class="content">
            <h3>Halo ${displayName}!</h3>
            <p>Sistem AI kami telah menganalisis performa server Anda dan memberikan rekomendasi berikut:</p>

            <div class="recommendation priority-${prioritas.toLowerCase()}">
              <h4>💡 Rekomendasi Utama:</h4>
              <p>${rekomendasi.deskripsi.replace(/\n/g, '<br>')}</p>
              ${rekomendasi.analisis ? `<p><strong>Analisis:</strong> ${rekomendasi.analisis}</p>` : ''}
              ${rekomendasi.dampak ? `<p><strong>Dampak:</strong> ${rekomendasi.dampak}</p>` : ''}
            </div>

            ${rekomendasi.actionItems && rekomendasi.actionItems.length > 0 ? `
            <div class="action-items">
              <h4>📋 Langkah Tindakan:</h4>
              ${rekomendasi.actionItems.map((item, index) => `
                <div class="action-item">
                  <strong>${index + 1}. ${item.judul}</strong>
                  <p>${item.deskripsi}</p>
                  ${item.prioritas ? `<span style="color: ${item.prioritas === 'high' ? '#dc3545' : item.prioritas === 'medium' ? '#ffc107' : '#28a745'};">Prioritas: ${item.prioritas}</span>` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/servers/${server._id}" class="action-button">
                🔍 Lihat Server
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/ai-insights" class="action-button">
                🤖 Lihat Semua Rekomendasi
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Rekomendasi ini dihasilkan oleh AI berdasarkan pola penggunaan dan performa server Anda.</p>
            <p>Email ini dikirim otomatis oleh sistem monitoring server.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: EMAIL_DEFAULT.from,
      to: email,
      subject: `${EMAIL_DEFAULT.subjectPrefix} 🤖 Rekomendasi AI - ${server.nama} (${kategori})`,
      html: htmlTemplate,
      replyTo: EMAIL_DEFAULT.replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    // Log berhasil
    logger.logEmailActivity('AI_RECOMMENDATION_EMAIL_SENT', {
      recipient: email,
      messageId: info.messageId,
      userName: displayName,
      serverId: server._id,
      serverName: server.nama,
      recommendationCategory: kategori,
      recommendationPriority: prioritas
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    // Log error
    logger.logError('EMAIL_AI_RECOMMENDATION_SEND_FAILED', error, {
      recipient: email,
      userName: displayName,
      serverData: dataRekomendasi.server
    });

    throw new Error(`Gagal kirim email rekomendasi AI: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Kirim email notifikasi recovery server
 *
 * TUJUAN: Memberitahu user bahwa server sudah kembali normal
 *
 * @param {string} email - Email penerima
 * @param {string} namaPengguna - Nama user
 * @param {Object} dataRecovery - Data recovery server
 * @returns {Promise<Object>} Hasil pengiriman email
 */
async function kirimEmailRecoveryServer(email, namaPengguna, dataRecovery) {
  try {
    const transporter = dapatkanTransporter();
    const displayName = namaPengguna || (email ? email.split('@')[0] : 'Pengguna');

    const { server, waktuRecovery, durasiDown, metricsTerakhir } = dataRecovery;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Server Recovery - ${server.nama}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: #28a745; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { padding: 20px; }
          .recovery-info { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Server Recovery Notification</h2>
            <p>${server.nama} kembali normal</p>
          </div>

          <div class="content">
            <h3>Halo ${displayName}!</h3>
            <p>Server Anda telah kembali ke kondisi normal.</p>

            <div class="recovery-info">
              <h4>📈 Detail Recovery:</h4>
              <p><strong>Server:</strong> ${server.nama} (${server.jenisServer})</p>
              <p><strong>Waktu Recovery:</strong> ${new Date(waktuRecovery).toLocaleString('id-ID')}</p>
              <p><strong>Durasi Down:</strong> ${durasiDown}</p>
              <p><strong>Status Saat Ini:</strong> Normal</p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/servers/${server._id}" class="action-button">
                🔍 Lihat Detail Server
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Email ini dikirim otomatis ketika server kembali normal.</p>
            <p>Sistem Monitoring Server v1.0</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: EMAIL_DEFAULT.from,
      to: email,
      subject: `${EMAIL_DEFAULT.subjectPrefix} ✅ RECOVERY - ${server.nama} Kembali Normal`,
      html: htmlTemplate,
      replyTo: EMAIL_DEFAULT.replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    // Log berhasil
    logger.logEmailActivity('SERVER_RECOVERY_EMAIL_SENT', {
      recipient: email,
      messageId: info.messageId,
      userName: displayName,
      serverId: server._id,
      serverName: server.nama,
      recoveryTime: waktuRecovery,
      downtime: durasiDown
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    // Log error
    logger.logError('EMAIL_SERVER_RECOVERY_SEND_FAILED', error, {
      recipient: email,
      userName: displayName,
      serverData: dataRecovery.server
    });

    throw new Error(`Gagal kirim email recovery server: ${error.message}`);
  }
}

/**
 * DESKRIPSI: Update statistik email user
 *
 * TUJUAN: Tracking jumlah email yang dikirim ke user
 *
 * @param {string} userId - ID user
 * @param {boolean} berhasil - Apakah pengiriman berhasil
 */
async function updateStatistikEmail(userId, berhasil = true) {
  try {
    const updateData = {
      'statistikEmail.emailTerakhirDikirim': new Date()
    };

    if (berhasil) {
      updateData.$inc = { 'statistikEmail.totalEmailTerkirim': 1 };
    } else {
      updateData.$inc = { 'statistikEmail.emailGagal': 1 };
    }

    await Pengguna.findByIdAndUpdate(userId, updateData);

  } catch (error) {
    logger.logError('EMAIL_STATISTICS_UPDATE_FAILED', error, { userId });
  }
}

// Export semua fungsi
module.exports = {
  kirimEmailVerifikasi,
  kirimEmailResetPassword,
  kirimEmailAlertServer,
  kirimEmailRingkasanHarian,
  kirimEmailRekomendasiAI,
  kirimEmailRecoveryServer,
  updateStatistikEmail
};