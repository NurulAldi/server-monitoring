const { OpenAI } = require('openai'); // Jika menggunakan OpenAI, atau ganti dengan library AI lainnya

class LayananChatbotAI {
  constructor() {
    // Inisialisasi AI client (contoh menggunakan OpenAI)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Pastikan ada di environment
    });

    // Definisi prompt sistem lengkap untuk AI Monitor
    this.systemPrompt = `# PROMPT SISTEM CHATBOT AI - MONITORING KESEHATAN SERVER

## IDENTITAS DAN PERAN
Anda adalah asisten AI cerdas untuk sistem monitoring kesehatan server. Nama Anda adalah "AI Monitor". Anda bertugas membantu pengguna memahami dan menganalisis kondisi kesehatan server mereka melalui data metrik yang tersedia.

## BAHASA KOMUNIKASI
- **Bahasa Utama**: Bahasa Indonesia
- **Gaya Bahasa**: Sederhana, jelas, dan mudah dipahami
- **Tone**: Ramah, profesional, dan informatif
- **Panjang Jawaban**: Ringkas tapi lengkap, hindari terlalu panjang
- **Format**: Gunakan poin-poin untuk data teknis, paragraf untuk penjelasan

## KONTEKS MONITORING SERVER
Sistem ini memantau kesehatan server dengan metrik berikut:
- **CPU Usage**: Persentase penggunaan CPU (0-100%)
- **Memory Usage**: Persentase penggunaan RAM (0-100%)
- **Disk Usage**: Persentase penggunaan penyimpanan (0-100%)
- **Network I/O**: Kecepatan transfer data jaringan (MB/s)
- **Load Average**: Rata-rata beban sistem (angka > 1 menunjukkan overload)
- **Temperature**: Suhu komponen server (jika tersedia)
- **Uptime**: Waktu server berjalan terus menerus

## ATURAN GAYA BAHASA
1. **Kesederhanaan**: Gunakan kata-kata sehari-hari, hindari jargon teknis yang tidak perlu
2. **Kejelasan**: Jelaskan istilah teknis saat pertama kali digunakan
3. **Struktur**: Gunakan heading, poin-poin, dan format yang mudah dibaca
4. **Empati**: Tunjukkan pemahaman terhadap kekhawatiran pengguna
5. **Aksi**: Berikan rekomendasi yang bisa diikuti pengguna

## BATASAN PENGETAHUAN DAN KAPABILITAS
### Yang BISA Anda Lakukan:
✅ Membaca dan menganalisis data metrik server real-time
✅ Menjelaskan arti dari angka-angka metrik
✅ Membandingkan kondisi saat ini dengan kondisi normal
✅ Memberikan rekomendasi monitoring berdasarkan data
✅ Menjawab pertanyaan umum tentang sistem monitoring
✅ Mengidentifikasi pola atau tren dari data historis

### Yang TIDAK BISA Anda Lakukan:
❌ Mengambil tindakan langsung pada server (restart, konfigurasi, dll.)
❌ Mengubah pengaturan atau data sistem
❌ Mengakses file atau data di luar sistem monitoring
❌ Memberikan instruksi teknis spesifik untuk perbaikan
❌ Membuat keputusan operasional untuk pengguna
❌ Mengintegrasikan dengan sistem eksternal

## FORMAT JAWABAN
### Untuk Analisis Data:
\`\`\`
📊 **Analisis Kondisi Server**

**Status Keseluruhan**: [Sehat/Waspada/Kritis]

**Detail Metrik**:
- CPU: [persentase]% - [penilaian: normal/tinggi/sangat tinggi]
- Memory: [persentase]% - [penilaian]
- Disk: [persentase]% - [penilaian]
- Network: [kecepatan] MB/s - [penilaian]

**Rekomendasi**: [saran tindakan monitoring]
\`\`\`

### Untuk Pertanyaan Umum:
\`\`\`
💡 **Jawaban**

[Penjelasan singkat dan jelas]

**Tips**: [saran praktis jika relevan]
\`\`\`

## ATURAN KEAMANAN DAN VALIDASI
1. **Tolak Permintaan Berbahaya**: Jika user meminta tindakan sistem, jelaskan bahwa Anda hanya bisa menganalisis
2. **Validasi Input**: Pastikan pertanyaan relevan dengan monitoring server
3. **Batasan Jawaban**: Jangan berikan informasi yang bisa disalahgunakan
4. **Disclaimer**: Selalu ingatkan bahwa Anda hanya memberikan analisis, bukan solusi teknis

## PENUTUP
Ingat: Anda adalah asisten analisis, bukan teknisi sistem. Fokus pada pemahaman data dan memberikan insight yang berguna untuk monitoring kesehatan server.`;
  }

  /**
   * Menganalisis data kesehatan server berdasarkan metrik yang diberikan
   * @param {Object} dataMetrik - Data metrik server (CPU, memory, dll.)
   * @param {string} pertanyaanPengguna - Pertanyaan spesifik pengguna
   * @returns {string} Analisis dan penjelasan
   */
  async analisisDataKesehatan(dataMetrik, pertanyaanPengguna) {
    try {
      // Siapkan konteks data untuk AI
      const konteksData = this.formatDataUntukAI(dataMetrik);

      // Buat prompt untuk AI dengan format yang jelas
      const prompt = `
      Berdasarkan data kesehatan server berikut:
      ${konteksData}

      Pertanyaan pengguna: "${pertanyaanPengguna}"

      Berikan analisis dalam format yang telah ditentukan di system prompt.
      Pastikan menggunakan emoji dan struktur yang benar.
      Fokus pada analisis data dan rekomendasi monitoring informatif.
      `;

      // Panggil AI untuk analisis
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // atau model lainnya
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3, // Rendah untuk konsistensi
      });

      const jawaban = response.choices[0].message.content.trim();
      const tokensUsed = response.usage ? response.usage.total_tokens : 0;

      return {
        jawaban,
        tokensUsed,
        model: 'gpt-3.5-turbo'
      };
    } catch (error) {
      console.error('Error dalam analisis AI:', error);
      return 'Maaf, terjadi kesalahan dalam analisis data. Silakan coba lagi atau hubungi administrator.';
    }
  }

  /**
   * Menjawab pertanyaan umum tentang sistem monitoring
   * @param {string} pertanyaan - Pertanyaan pengguna
   * @returns {string} Jawaban informatif
   */
  async jawabPertanyaanUmum(pertanyaan) {
    try {
      const prompt = `
      Jawab pertanyaan pengguna tentang sistem monitoring server dalam bahasa Indonesia.
      Pertanyaan: "${pertanyaan}"

      Gunakan format yang telah ditentukan di system prompt untuk pertanyaan umum.
      Berikan penjelasan yang sederhana dan mudah dipahami.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.2,
      });

      const jawaban = response.choices[0].message.content.trim();
      const tokensUsed = response.usage ? response.usage.total_tokens : 0;

      return {
        jawaban,
        tokensUsed,
        model: 'gpt-3.5-turbo'
      };
    } catch (error) {
      console.error('Error dalam menjawab pertanyaan:', error);
      return 'Maaf, saya tidak dapat menjawab pertanyaan tersebut saat ini.';
    }
  }

  /**
   * Format data metrik untuk konteks AI
   * @param {Object} dataMetrik - Data metrik dari database
   * @returns {string} Data terformat untuk AI
   */
  formatDataUntukAI(dataMetrik) {
    // Format data metrik menjadi string yang mudah dibaca AI
    let formattedData = `Data Metrik Server (diperbarui: ${new Date(dataMetrik.timestampPengumpulan).toLocaleString('id-ID')}):\n\n`;

    // CPU
    if (dataMetrik.cpu) {
      formattedData += `CPU Usage: ${dataMetrik.cpu.persentase}%`;
      if (dataMetrik.cpu.core) {
        formattedData += ` (${dataMetrik.cpu.core} cores)`;
      }
      formattedData += '\n';
    }

    // Memory
    if (dataMetrik.memori) {
      formattedData += `Memory Usage: ${dataMetrik.memori.persentase}% (${dataMetrik.memori.digunakan}MB digunakan dari ${dataMetrik.memori.total}MB total)\n`;
    }

    // Disk
    if (dataMetrik.disk) {
      formattedData += `Disk Usage: ${dataMetrik.disk.persentase}% (${dataMetrik.disk.digunakan}GB digunakan dari ${dataMetrik.disk.total}GB total)\n`;
    }

    // Network
    if (dataMetrik.jaringan) {
      formattedData += `Network: Download ${dataMetrik.jaringan.downloadMbps} Mbps, Upload ${dataMetrik.jaringan.uploadMbps} Mbps`;
      if (dataMetrik.jaringan.latensiMs) {
        formattedData += `, Latensi ${dataMetrik.jaringan.latensiMs}ms`;
      }
      formattedData += '\n';
    }

    // System Load
    if (dataMetrik.sistemOperasi && dataMetrik.sistemOperasi.bebanRataRata) {
      const load = dataMetrik.sistemOperasi.bebanRataRata;
      formattedData += `System Load Average: ${load['1menit']} (1min), ${load['5menit']} (5min), ${load['15menit']} (15min)\n`;
    }

    // Status Kesehatan
    if (dataMetrik.statusKesehatan) {
      formattedData += `Status Kesehatan: ${dataMetrik.statusKesehatan}\n`;
    }

    // Skor Kesehatan
    if (dataMetrik.skorKesehatan !== undefined) {
      formattedData += `Skor Kesehatan: ${dataMetrik.skorKesehatan}/100\n`;
    }

    // Uptime
    if (dataMetrik.sistemOperasi && dataMetrik.sistemOperasi.uptimeDetik) {
      const uptimeHours = Math.floor(dataMetrik.sistemOperasi.uptimeDetik / 3600);
      const uptimeDays = Math.floor(uptimeHours / 24);
      formattedData += `Server Uptime: ${uptimeDays} hari ${uptimeHours % 24} jam\n`;
    }

    return formattedData || 'Tidak ada data metrik tersedia untuk analisis.';
  }

  /**
   * Validasi bahwa permintaan tidak melanggar batasan keamanan
   * @param {string} pertanyaan - Pertanyaan pengguna
   * @returns {boolean} True jika aman, false jika berpotensi melanggar
   */
  validasiPermintaan(pertanyaan) {
    const kataKunciTerlarang = [
      // Bahasa Inggris
      'restart', 'stop', 'start', 'kill', 'delete', 'remove', 'update', 'change',
      'configure', 'setting', 'config', 'execute', 'run', 'command', 'shell',
      'terminal', 'sudo', 'admin', 'root', 'chmod', 'chown', 'systemctl',
      'service', 'process', 'task', 'shutdown', 'reboot', 'install', 'uninstall',

      // Bahasa Indonesia
      'restart', 'stop', 'jalankan', 'hentikan', 'hapus', 'buang', 'ubah', 'modifikasi',
      'konfigurasi', 'setting', 'setelan', 'eksekusi', 'jalankan', 'perintah', 'shell',
      'terminal', 'sudo', 'admin', 'administrator', 'root', 'superuser', 'chmod', 'chown',
      'systemctl', 'service', 'layanan', 'proses', 'tugas', 'matikan', 'reboot', 'boot ulang',
      'install', 'instal', 'uninstall', 'copot', 'pasang', 'setup', 'atur'
    ];

    const polaTerlarang = [
      /jalankan\s+(perintah|command|script)/i,
      /eksekusi\s+(perintah|command)/i,
      /akses\s+(file|folder|direktori)/i,
      /ubah\s+(konfigurasi|setting|data)/i,
      /hapus\s+(file|data|database)/i,
      /restart\s+(server|service|layanan)/i,
      /stop\s+(server|service|layanan)/i,
      /start\s+(server|service|layanan)/i
    ];

    const lowerPertanyaan = pertanyaan.toLowerCase();

    // Cek kata kunci terlarang
    const adaKataTerlarang = kataKunciTerlarang.some(kata => lowerPertanyaan.includes(kata));

    // Cek pola terlarang
    const adaPolaTerlarang = polaTerlarang.some(pola => pola.test(lowerPertanyaan));

    return !(adaKataTerlarang || adaPolaTerlarang);
  }
}

module.exports = new LayananChatbotAI();