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

// Template HTML untuk email alert
function templateEmailAlert(data) {
  const { server, metrics, rekomendasi, waktu } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Alert Monitoring Server</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { background: #dc3545; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .metrics { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .metric-item { margin: 5px 0; }
        .recommendation { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
        .critical { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 ALERT MONITORING SERVER</h2>
          <p>Status: <span class="critical">CRITICAL</span></p>
        </div>

        <div class="content">
          <h3>Server: ${server.nama}</h3>
          <p><strong>Waktu Alert:</strong> ${new Date(waktu).toLocaleString('id-ID')}</p>

          <div class="metrics">
            <h4>📊 Data Metrics Saat Alert:</h4>
            <div class="metric-item">CPU: ${metrics.cpu}%</div>
            <div class="metric-item">Memory: ${metrics.memori}%</div>
            <div class="metric-item">Disk: ${metrics.disk}%</div>
            <div class="metric-item">Network: ${metrics.jaringan?.downloadMbps || 0} Mbps ↓ / ${metrics.jaringan?.uploadMbps || 0} Mbps ↑</div>
            <div class="metric-item">Latency: ${metrics.jaringan?.latensiMs || 0} ms</div>
          </div>

          ${rekomendasi ? `
          <div class="recommendation">
            <h4>💡 Rekomendasi AI:</h4>
            <p>${rekomendasi.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          <p>
            <strong>Link Dashboard:</strong>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/servers/${server._id}">
              Lihat Detail Server
            </a>
          </p>
        </div>

        <div class="footer">
          <p>Email ini dikirim otomatis oleh sistem monitoring server.</p>
          <p>Jangan reply email ini.</p>
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
      html: templateEmailAlert(data),
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
  templateEmailAlert,
  EMAIL_DEFAULT,
  SMTP_CONFIG
};