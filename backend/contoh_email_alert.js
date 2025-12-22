// Contoh Penggunaan Template Email Alert Server Bermasalah
// File ini menunjukkan bagaimana menggunakan template email baru dengan bahasa Indonesia formal

const { kirimEmailAlertServer } = require('./layanan/layananEmail');

// Contoh data untuk testing template email
const contohDataAlert = {
  user: {
    _id: 'user123',
    namaPengguna: 'Dr. Ahmad Santoso, S.Kom.',
    email: 'ahmad.santoso@university.edu'
  },
  server: {
    _id: 'server456',
    nama: 'Server Database Utama',
    jenisServer: 'Database Server',
    alamatIP: '192.168.1.100',
    sistemOperasi: 'Ubuntu 20.04 LTS'
  },
  metrics: {
    cpu: 95,
    memori: 88,
    disk: 92,
    jaringan: {
      downloadMbps: 45.2,
      uploadMbps: 12.8,
      latensiMs: 25
    }
  },
  level: 'CRITICAL',
  masalah: [
    'Penggunaan CPU melebihi 90% selama 15 menit terakhir',
    'Penggunaan memori mencapai 88% dengan tren meningkat',
    'Beberapa query database mengalami timeout',
    'Load average server meningkat signifikan'
  ],
  penjelasanMasalah: 'Server database utama mengalami beban berat yang menyebabkan penurunan performa signifikan. Hal ini dapat mempengaruhi layanan akademik dan administrasi universitas.',
  rekomendasiAI: `
    <p><strong>Analisis Otomatis:</strong> Sistem AI mendeteksi anomali performa server database yang memerlukan intervensi segera.</p>

    <p><strong>Rekomendasi Tindakan Prioritas:</strong></p>
    <ol>
      <li><strong>Segera:</strong> Lakukan restart layanan database non-kritis untuk mengurangi beban</li>
      <li><strong>Evaluasi:</strong> Periksa query yang sedang berjalan dan identifikasi bottleneck</li>
      <li><strong>Optimasi:</strong> Pertimbangkan penambahan indeks pada tabel yang sering diakses</li>
      <li><strong>Monitoring:</strong> Tingkatkan frekuensi monitoring selama 24 jam ke depan</li>
      <li><strong>Persiapan:</strong> Siapkan rencana failover jika diperlukan</li>
    </ol>

    <p><em>Rekomendasi ini dihasilkan berdasarkan analisis pola performa historis dan kondisi saat ini.</em></p>
  `,
  waktuAlert: new Date(),
  dashboardUrl: 'https://monitoring.university.edu/dashboard'
};

// Contoh penggunaan fungsi
async function testKirimEmailAlert() {
  try {
    const { logger } = require('./src/utilitas/logger');
    logger.info('Sending email alert for problematic server...');

    const hasil = await kirimEmailAlertServer(
      contohDataAlert.user.email,
      contohDataAlert
    );

    logger.info('Email alert sent successfully', { result: hasil });

  } catch (error) {
    const { logger } = require('./src/utilitas/logger');
    logger.error('Failed to send email alert', { error: error.message });
  }
}

// Export untuk testing
module.exports = {
  contohDataAlert,
  testKirimEmailAlert
};

// Uncomment baris di bawah untuk menjalankan test
// testKirimEmailAlert();