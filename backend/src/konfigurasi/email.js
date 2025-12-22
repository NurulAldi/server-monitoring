// Konfigurasi email menggunakan NodeMailer
// Mendukung SMTP untuk kirim email notifikasi

const nodemailer = require('nodemailer');

// Ambil konfigurasi email dari environment variable
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true untuk 465, false untuk 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Opsi tambahan untuk reliability
  tls: {
    rejectUnauthorized: false // Untuk development, terima self-signed certificate
  },
  pool: true, // Gunakan connection pool untuk performa
  maxConnections: 5, // Maksimal 5 koneksi simultan
  maxMessages: 100 // Maksimal 100 email per koneksi
};

// Validasi konfigurasi email
function validasiKonfigurasiEmail() {
  const requiredFields = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

  for (const field of requiredFields) {
    if (!process.env[field]) {
      throw new Error(`Konfigurasi email tidak lengkap: ${field} tidak ditemukan di environment variable`);
    }
  }

  // Validasi port
  const port = parseInt(process.env.SMTP_PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT tidak valid. Gunakan port antara 1-65535');
  }

  console.log('✅ Konfigurasi email valid');
}

// Buat transporter NodeMailer
let transporter = null;

function buatTransporter() {
  try {
    validasiKonfigurasiEmail();

    transporter = nodemailer.createTransporter(SMTP_CONFIG);

    // Test koneksi saat inisialisasi
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Error koneksi SMTP:', error.message);
        throw new Error('Gagal koneksi ke SMTP server');
      } else {
        console.log('✅ Koneksi SMTP berhasil');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Error membuat transporter email:', error.message);
    throw error;
  }
}

// Fungsi untuk mendapatkan transporter (lazy initialization)
function dapatkanTransporter() {
  if (!transporter) {
    transporter = buatTransporter();
  }
  return transporter;
}

// Konfigurasi email default
const EMAIL_DEFAULT = {
  from: `"Monitoring Server" <${process.env.SMTP_USER}>`,
  subjectPrefix: '[Monitoring Server]',
  replyTo: process.env.SMTP_USER
};

// Template HTML untuk email alert server bermasalah (Bahasa Indonesia Formal)
function templateEmailAlertServerBermasalah(data) {
  const {
    user,
    server,
    metrics,
    level,
    masalah,
    penjelasanMasalah,
    rekomendasiAI,
    waktuAlert,
    dashboardUrl
  } = data;

  // Tentukan warna header berdasarkan level
  const headerColor = level === 'CRITICAL' ? '#dc3545' : '#ffc107';
  const levelText = level === 'CRITICAL' ? 'KRITIS' : 'PERINGATAN';
  const levelIcon = level === 'CRITICAL' ? '🚨' : '⚠️';

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notifikasi Kondisi Server Bermasalah</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
          color: #212529;
          line-height: 1.6;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd);
          color: white;
          padding: 30px 25px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header .level-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          margin-top: 10px;
        }
        .content {
          padding: 30px 25px;
        }
        .user-info {
          background: #e9ecef;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #6c757d;
        }
        .user-info h3 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 16px;
        }
        .server-summary {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .server-summary h3 {
          margin: 0 0 15px 0;
          color: #856404;
          font-size: 18px;
        }
        .server-detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .server-name {
          font-size: 20px;
          font-weight: 600;
          color: #212529;
        }
        .server-type {
          background: #6c757d;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          text-transform: uppercase;
        }
        .alert-time {
          color: #6c757d;
          font-size: 14px;
        }
        .problem-section {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .problem-section h3 {
          margin: 0 0 15px 0;
          color: #721c24;
          font-size: 18px;
        }
        .problem-list {
          margin: 0;
          padding-left: 20px;
        }
        .problem-item {
          margin-bottom: 8px;
          color: #721c24;
        }
        .explanation {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border-left: 3px solid #dc3545;
          margin-top: 15px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .metric-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .metric-label {
          color: #6c757d;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-critical { color: #dc3545; }
        .metric-warning { color: #ffc107; }
        .metric-normal { color: #28a745; }
        .ai-recommendation {
          background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
          border: 1px solid #bbdefb;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .ai-recommendation h3 {
          margin: 0 0 15px 0;
          color: #1976d2;
          font-size: 18px;
          display: flex;
          align-items: center;
        }
        .ai-recommendation h3:before {
          content: '🤖';
          margin-right: 10px;
        }
        .recommendation-content {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e3f2fd;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .action-button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 0 10px;
          font-weight: 500;
          transition: background-color 0.3s;
        }
        .action-button:hover {
          background: #0056b3;
        }
        .action-button.secondary {
          background: #6c757d;
        }
        .action-button.secondary:hover {
          background: #545b62;
        }
        .footer {
          background: #f8f9fa;
          padding: 25px;
          text-align: center;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 13px;
        }
        .footer p {
          margin: 5px 0;
        }
        .disclaimer {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
          font-size: 12px;
          color: #856404;
        }
        @media (max-width: 600px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          .server-detail {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .action-button {
            display: block;
            margin: 10px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>${levelIcon} Notifikasi Kondisi Server Bermasalah</h1>
          <div class="level-badge">Status: ${levelText}</div>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- User Identity -->
          <div class="user-info">
            <h3>👤 Identitas Pengguna</h3>
            <p><strong>Nama:</strong> ${user.namaPengguna}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Waktu Penerimaan:</strong> ${new Date().toLocaleString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}</p>
          </div>

          <!-- Server Summary -->
          <div class="server-summary">
            <h3>📊 Ringkasan Kondisi Server</h3>
            <div class="server-detail">
              <div>
                <div class="server-name">${server.nama}</div>
                <div class="alert-time">
                  Waktu Deteksi Masalah: ${new Date(waktuAlert).toLocaleString('id-ID')}
                </div>
              </div>
              <div class="server-type">${server.jenisServer}</div>
            </div>
          </div>

          <!-- Problem Explanation -->
          <div class="problem-section">
            <h3>🔍 Penjelasan Singkat Masalah</h3>
            <div class="explanation">
              <p>${penjelasanMasalah}</p>
            </div>

            ${masalah && masalah.length > 0 ? `
            <h4 style="margin-top: 20px; color: #721c24;">Detail Masalah Terdeteksi:</h4>
            <ul class="problem-list">
              ${masalah.map(item => `<li class="problem-item">${item}</li>`).join('')}
            </ul>
            ` : ''}
          </div>

          <!-- Current Metrics -->
          <h3 style="margin-bottom: 15px; color: #495057;">📈 Metrik Saat Ini</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value metric-${metrics.cpu > 90 ? 'critical' : metrics.cpu > 80 ? 'warning' : 'normal'}">
                ${metrics.cpu}%
              </div>
              <div class="metric-label">Penggunaan CPU</div>
            </div>
            <div class="metric-card">
              <div class="metric-value metric-${metrics.memori > 95 ? 'critical' : metrics.memori > 85 ? 'warning' : 'normal'}">
                ${metrics.memori}%
              </div>
              <div class="metric-label">Penggunaan Memori</div>
            </div>
            <div class="metric-card">
              <div class="metric-value metric-${metrics.disk > 95 ? 'critical' : metrics.disk > 85 ? 'warning' : 'normal'}">
                ${metrics.disk}%
              </div>
              <div class="metric-label">Penggunaan Disk</div>
            </div>
            ${metrics.jaringan ? `
            <div class="metric-card">
              <div class="metric-value metric-normal">
                ${metrics.jaringan.latensiMs || 0}ms
              </div>
              <div class="metric-label">Latensi Jaringan</div>
            </div>
            ` : ''}
          </div>

          <!-- AI Recommendation -->
          <div class="ai-recommendation">
            <h3>Rekomendasi Sistem AI</h3>
            <div class="recommendation-content">
              ${rekomendasiAI || `
              <p><strong>Analisis Otomatis:</strong> Sistem AI mendeteksi anomali pada performa server yang memerlukan perhatian segera.</p>

              <p><strong>Rekomendasi Tindakan:</strong></p>
              <ol>
                <li>Lakukan pemeriksaan menyeluruh terhadap proses yang menggunakan sumber daya tinggi</li>
                <li>Evaluasi konfigurasi server dan aplikasi yang berjalan</li>
                <li>Periksa log sistem untuk mencari indikasi error atau warning</li>
                <li>Pertimbangkan optimalisasi atau penambahan sumber daya jika diperlukan</li>
              </ol>

              <p><em>Rekomendasi ini dihasilkan berdasarkan analisis data performa server secara otomatis.</em></p>
              `}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <a href="${dashboardUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`}" class="action-button">
              🔍 Akses Dashboard Monitoring
            </a>
            <a href="${`${process.env.FRONTEND_URL || 'http://localhost:3000'}/servers/${server._id}`}" class="action-button secondary">
              📊 Lihat Detail Server
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Sistem Monitoring Server Akademik</strong></p>
          <p>Email ini dikirim secara otomatis sebagai notifikasi kondisi server bermasalah.</p>
          <p>Silakan jangan membalas email ini secara langsung.</p>

          <div class="disclaimer">
            <strong>Catatan:</strong> Notifikasi ini dikirim berdasarkan threshold yang telah ditentukan dalam sistem monitoring.
            Untuk mengubah pengaturan notifikasi, silakan akses menu pengaturan di dashboard Anda.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Fungsi untuk kirim email alert
async function kirimEmailAlert(penerima, subjek, data) {
  try {
    const transporter = dapatkanTransporter();

    // Siapkan email options
    const mailOptions = {
      from: EMAIL_DEFAULT.from,
      to: Array.isArray(penerima) ? penerima.join(', ') : penerima,
      subject: `${EMAIL_DEFAULT.subjectPrefix} ${subjek}`,
      html: templateEmailAlertServerBermasalah(data),
      replyTo: EMAIL_DEFAULT.replyTo
    };

    // Kirim email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email alert berhasil dikirim:', info.messageId);
    console.log('📧 Penerima:', penerima);

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    console.error('❌ Error kirim email alert:', error.message);
    throw new Error(`Gagal kirim email alert: ${error.message}`);
  }
}

// Fungsi untuk test koneksi email
async function testKoneksiEmail() {
  try {
    const transporter = dapatkanTransporter();
    await transporter.verify();
    console.log('✅ Test koneksi email berhasil');
    return { success: true, message: 'Koneksi email OK' };
  } catch (error) {
    console.error('❌ Test koneksi email gagal:', error.message);
    return { success: false, error: error.message };
  }
}

// Export semua fungsi dan konstanta
module.exports = {
  buatTransporter,
  dapatkanTransporter,
  kirimEmailAlert,
  testKoneksiEmail,
  templateEmailAlertServerBermasalah,
  // Backwards-compatible alias
  templateEmailAlert: templateEmailAlertServerBermasalah,
  EMAIL_DEFAULT,
  SMTP_CONFIG
};