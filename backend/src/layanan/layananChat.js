// Layanan untuk mengelola operasi chat dengan AI
// Business logic untuk komunikasi dengan AI dan manajemen riwayat chat

const RiwayatChat = require('../model/RiwayatChat');
const Server = require('../model/Server');
const { generateResponseAi } = require('../konfigurasi/ai');
const { logger } = require('../utilitas/logger');
const { ERROR_CODE } = require('../utilitas/konstanta');

/**
 * DESKRIPSI: Proses pertanyaan user ke AI dan generate response
 *
 * TUJUAN: Memungkinkan user berkomunikasi dengan AI untuk analisis
 * kondisi server, troubleshooting, atau rekomendasi optimasi.
 *
 * ALUR:
 * 1. Validasi pertanyaan dan cek server jika ada ID server
 * 2. Ambil data server terkini jika diperlukan untuk konteks
 * 3. Generate prompt yang comprehensive untuk AI
 * 4. Call AI service untuk generate response
 * 5. Simpan riwayat chat ke database
 * 6. Return response dengan metadata
 *
 * ALASAN DESIGN:
 * - Riwayat chat disimpan untuk audit trail dan konteks future
 * - AI mendapat konteks server untuk jawaban lebih akurat
 * - Response time di-track untuk monitoring performa AI
 *
 * @param {string} userId - ID user yang bertanya
 * @param {string} pertanyaan - Pertanyaan user ke AI
 * @param {string} idServer - ID server (optional) untuk konteks
 * @returns {Object} Response AI dengan metadata
 * @throws {Error} Jika pertanyaan invalid atau server tidak ditemukan
 *
 * NOTES:
 * - Pertanyaan dibatasi 1000 karakter untuk prevent abuse
 * - AI response di-cache untuk pertanyaan yang sama (future feature)
 * - Support multiple AI providers (OpenAI, Gemini, Ollama)
 */
async function prosesPertanyaanAi(userId, pertanyaan, idServer = null) {
  try {
    // Validasi panjang pertanyaan
    if (pertanyaan.length > 1000) {
      throw new Error('Pertanyaan terlalu panjang. Maksimal 1000 karakter.');
    }

    if (pertanyaan.length < 5) {
      throw new Error('Pertanyaan terlalu pendek. Minimal 5 karakter.');
    }

    // Jika ada ID server, ambil data server untuk konteks
    let dataServer = null;
    let sumberData = 'general';

    if (idServer) {
      // Validasi ownership server
      const server = await Server.findOne({
        _id: idServer,
        pemilik: userId
      });

      if (!server) {
        throw new Error('Server tidak ditemukan atau akses ditolak.');
      }

      // Ambil data server untuk konteks AI
      dataServer = {
        id: server._id,
        nama: server.nama,
        jenisServer: server.jenisServer,
        status: server.status,
        spesifikasi: server.spesifikasi,
        metrikTerbaru: server.metrikTerbaru,
        alertAktif: server.alertAktif
      };

      sumberData = 'server_specific';
    }

    // Generate prompt untuk AI
    const promptAi = buatPromptAi(pertanyaan, dataServer);

    // Track waktu response
    const waktuMulai = Date.now();

    // Call AI service
    const jawabanAi = await generateResponseAi(promptAi);

    const waktuResponse = Date.now() - waktuMulai;

    // Simpan riwayat chat ke database
    const riwayatBaru = new RiwayatChat({
      pengguna: userId,
      pertanyaan: pertanyaan,
      jawaban: jawabanAi,
      idServer: idServer,
      sumberData: sumberData,
      waktuResponse: waktuResponse,
      timestamp: new Date()
    });

    await riwayatBaru.save();

    return {
      jawaban: jawabanAi,
      idServer: idServer,
      waktuResponse: waktuResponse,
      sumberData: sumberData,
      idRiwayat: riwayatBaru._id
    };

  } catch (error) {
    logger.logSystemError('CHAT_SERVICE_PROCESS_ERROR', error, {
      userId: userId,
      pertanyaan: pertanyaan?.substring(0, 100),
      idServer: idServer
    });
    throw error;
  }
}

/**
 * DESKRIPSI: Buat prompt yang comprehensive untuk AI
 *
 * TUJUAN: Memberikan konteks yang cukup ke AI agar bisa memberikan
 * jawaban yang akurat dan berguna tentang kondisi server.
 *
 * ALUR:
 * 1. Buat base prompt dengan role AI sebagai server monitoring assistant
 * 2. Tambahkan data server jika ada
 * 3. Tambahkan instruksi untuk format response
 * 4. Combine dengan pertanyaan user
 *
 * @param {string} pertanyaan - Pertanyaan user
 * @param {Object} dataServer - Data server (optional)
 * @returns {string} Prompt lengkap untuk AI
 */
function buatPromptAi(pertanyaan, dataServer = null) {
  let prompt = `Anda adalah AI Assistant untuk sistem monitoring kesehatan server.
Tugas Anda adalah membantu user menganalisis kondisi server, memberikan rekomendasi troubleshooting, dan menjelaskan metrics server.

`;

  // Tambahkan data server jika ada
  if (dataServer) {
    prompt += `DATA SERVER TERKAIT:
- Nama Server: ${dataServer.nama}
- Jenis Server: ${dataServer.jenisServer}
- Status Saat Ini: ${dataServer.status}
- Spesifikasi CPU: ${dataServer.spesifikasi?.cpu?.core || 'N/A'} core
- RAM Total: ${dataServer.spesifikasi?.memoriTotal || 'N/A'} GB
- Disk Total: ${dataServer.spesifikasi?.diskTotal || 'N/A'} GB

`;

    // Tambahkan metrics terbaru jika ada
    if (dataServer.metrikTerbaru) {
      prompt += `METRICS TERBARU:
- CPU Usage: ${dataServer.metrikTerbaru.cpu || 'N/A'}%
- Memory Usage: ${dataServer.metrikTerbaru.memori || 'N/A'}%
- Disk Usage: ${dataServer.metrikTerbaru.disk || 'N/A'}%
- Waktu Update: ${dataServer.metrikTerbaru.timestamp || 'N/A'}

`;
    }

    // Tambahkan alert aktif jika ada
    if (dataServer.alertAktif && dataServer.alertAktif.length > 0) {
      prompt += `ALERT AKTIF:
${dataServer.alertAktif.map(alert => `- ${alert.tingkatKeparahan}: ${alert.pesan}`).join('\n')}

`;
    }
  }

  prompt += `INSTRUKSI RESPONSE:
1. Berikan jawaban dalam Bahasa Indonesia yang mudah dipahami
2. Jika ada data teknis, jelaskan dengan bahasa sederhana
3. Berikan rekomendasi spesifik jika ada masalah
4. Jika tidak ada data server, beri jawaban general tapi tetap berguna
5. Jaga kerahasiaan data - jangan sebutkan detail sensitif

PERTANYAAN USER: ${pertanyaan}

JAWABAN:`;

  return prompt;
}

/**
 * DESKRIPSI: Ambil riwayat chat user dengan pagination
 *
 * TUJUAN: Menampilkan percakapan sebelumnya untuk referensi
 * dan melacak aktivitas chat user dengan AI.
 *
 * ALUR:
 * 1. Query riwayat chat berdasarkan user ID
 * 2. Sort berdasarkan timestamp terbaru
 * 3. Apply pagination
 * 4. Populate data server jika ada
 * 5. Format response
 *
 * @param {string} userId - ID user
 * @param {Object} options - Options pagination
 * @param {number} options.halaman - Halaman (default: 1)
 * @param {number} options.limit - Item per halaman (default: 20)
 * @returns {Object} Riwayat chat dengan pagination info
 */
async function ambilRiwayatChat(userId, options = {}) {
  try {
    const { halaman = 1, limit = 20 } = options;

    // Hitung total untuk pagination
    const totalRiwayat = await RiwayatChat.countDocuments({ pengguna: userId });

    // Query dengan pagination
    const daftarRiwayat = await RiwayatChat.find({ pengguna: userId })
      .populate('idServer', 'nama jenisServer status')
      .sort({ timestamp: -1 }) // Terbaru dulu
      .skip((halaman - 1) * limit)
      .limit(limit)
      .lean();

    // Format response
    const riwayatFormatted = daftarRiwayat.map(riwayat => ({
      id: riwayat._id,
      pertanyaan: riwayat.pertanyaan,
      jawaban: riwayat.jawaban.substring(0, 200) + (riwayat.jawaban.length > 200 ? '...' : ''), // Preview
      idServer: riwayat.idServer ? {
        id: riwayat.idServer._id,
        nama: riwayat.idServer.nama,
        jenisServer: riwayat.idServer.jenisServer,
        status: riwayat.idServer.status
      } : null,
      sumberData: riwayat.sumberData,
      waktuResponse: riwayat.waktuResponse,
      timestamp: riwayat.timestamp
    }));

    return {
      riwayatChat: riwayatFormatted,
      pagination: {
        halaman: halaman,
        limit: limit,
        total: totalRiwayat,
        totalHalaman: Math.ceil(totalRiwayat / limit)
      }
    };

  } catch (error) {
    logger.logSystemError('CHAT_SERVICE_HISTORY_ERROR', error, {
      userId: userId,
      options: options
    });
    throw error;
  }
}

/**
 * DESKRIPSI: Hapus riwayat chat tertentu
 *
 * TUJUAN: Memungkinkan user menghapus percakapan lama untuk
 * privasi atau mengelola storage database.
 *
 * ALUR:
 * 1. Cari riwayat chat berdasarkan ID
 * 2. Validasi ownership (hanya pemilik yang bisa hapus)
 * 3. Soft delete atau hard delete
 * 4. Log aktivitas
 *
 * @param {string} userId - ID user yang request hapus
 * @param {string} idRiwayat - ID riwayat chat yang akan dihapus
 * @returns {Promise<void>}
 * @throws {Error} Jika riwayat tidak ditemukan atau akses ditolak
 */
async function hapusRiwayatChat(userId, idRiwayat) {
  try {
    // Cari dan validasi ownership
    const riwayat = await RiwayatChat.findOne({
      _id: idRiwayat,
      pengguna: userId
    });

    if (!riwayat) {
      throw new Error('Riwayat chat tidak ditemukan atau akses ditolak.');
    }

    // Hard delete riwayat chat
    await RiwayatChat.findByIdAndDelete(idRiwayat);

    return { success: true };

  } catch (error) {
    logger.logSystemError('CHAT_SERVICE_DELETE_ERROR', error, {
      userId: userId,
      idRiwayat: idRiwayat
    });
    throw error;
  }
}

/**
 * DESKRIPSI: Bersihkan riwayat chat lama secara otomatis
 *
 * TUJUAN: Mengelola storage database dengan menghapus riwayat
 * chat yang sudah terlalu lama untuk mencegah database membengkak.
 *
 * ALUR:
 * 1. Tentukan threshold waktu (misal 90 hari)
 * 2. Query riwayat chat yang lebih lama dari threshold
 * 3. Bulk delete riwayat lama
 * 4. Log jumlah yang dihapus
 *
 * @param {number} hariThreshold - Threshold dalam hari (default: 90)
 * @returns {Object} Summary penghapusan
 */
async function bersihkanRiwayatLama(hariThreshold = 90) {
  try {
    const tanggalThreshold = new Date();
    tanggalThreshold.setDate(tanggalThreshold.getDate() - hariThreshold);

    // Query riwayat lama
    const hasilDelete = await RiwayatChat.deleteMany({
      timestamp: { $lt: tanggalThreshold }
    });

    logger.logSystemActivity('CHAT_HISTORY_CLEANUP', {
      jumlahDihapus: hasilDelete.deletedCount,
      hariThreshold: hariThreshold,
      tanggalThreshold: tanggalThreshold.toISOString()
    });

    return {
      jumlahDihapus: hasilDelete.deletedCount,
      hariThreshold: hariThreshold
    };

  } catch (error) {
    logger.logSystemError('CHAT_SERVICE_CLEANUP_ERROR', error, {
      hariThreshold: hariThreshold
    });
    throw error;
  }
}

// Export semua fungsi layanan
module.exports = {
  prosesPertanyaanAi,
  ambilRiwayatChat,
  hapusRiwayatChat,
  bersihkanRiwayatLama
};