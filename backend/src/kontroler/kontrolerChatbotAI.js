const layananChatbotAI = require('../layanan/layananChatbotAI');
const Metrik = require('../model/Metrik');
const RiwayatChatAI = require('../model/RiwayatChatAI');
const { emitAIResponse, emitAIThinking } = require('../socket/index');

class KontrolerChatbotAI {
  /**
   * Menangani pertanyaan chatbot dengan analisis data
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async tanyaChatbot(req, res) {
    const startTime = Date.now();
    let chatSession = null;

    try {
      const { pertanyaan, serverId, sessionId } = req.body;
      const userId = req.user?.id; // Dari middleware autentikasi
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validasi input
      if (!pertanyaan || pertanyaan.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Pertanyaan tidak boleh kosong'
        });
      }

      // Validasi batasan - cegah permintaan yang berpotensi berbahaya
      const isValid = layananChatbotAI.validasiPermintaan(pertanyaan);
      if (!isValid) {
        // Log blocked request
        await this.logBlockedRequest(userId, pertanyaan, clientIP, userAgent, 'validation_failed');

        return res.status(403).json({
          success: false,
          message: 'Pertanyaan mengandung instruksi yang tidak diperbolehkan. AI hanya dapat menganalisis data dan menjawab pertanyaan informatif.',
          batasan: 'AI tidak boleh mengambil tindakan langsung, mengubah data, atau membuat keputusan sistem.'
        });
      }

      // Cari atau buat sesi chat
      chatSession = await this.cariAtauBuatSesiChat(userId, sessionId, serverId, clientIP, userAgent);

      // Generate unique question ID
      const questionId = Date.now().toString();

      // Simpan pesan user ke database
      await chatSession.tambahPesan({
        id: questionId,
        tipe: 'user',
        konten: pertanyaan.trim(),
        questionId: questionId
      });

      // Emit Socket.IO event: AI mulai thinking
      emitAIThinking(userId, questionId);

      let dataMetrik = null;

      // Jika pertanyaan melibatkan analisis data, ambil data terbaru
      if (this.perluAnalisisData(pertanyaan)) {
        dataMetrik = await this.ambilDataMetrikTerbaru(serverId);

        if (!dataMetrik) {
          // Simpan error ke sesi chat
          await chatSession.logError('data_not_found', 'Data metrik server tidak tersedia untuk analisis');

          // Emit error via Socket.IO
          const aiSocket = require('../socket/index');
          global.io?.of('/ai').to(`ai_user_${userId}`).emit('ai:status:error', {
            questionId,
            error: 'DATA_NOT_FOUND',
            message: 'Data metrik server tidak tersedia untuk analisis',
            timestamp: new Date().toISOString()
          });

          return res.status(404).json({
            success: false,
            message: 'Data metrik server tidak tersedia untuk analisis'
          });
        }
      }

      // Proses AI analysis (async, tidak blocking response)
      this.prosesAnalisisAI(userId, questionId, pertanyaan, dataMetrik, serverId, chatSession);

      // Return immediate response bahwa request diterima
      res.json({
        success: true,
        questionId,
        sessionId: chatSession.sessionId,
        status: 'processing',
        message: 'Pertanyaan Anda sedang diproses oleh AI',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error dalam kontroler chatbot:', error);

      // Log error ke sesi chat jika ada
      if (chatSession) {
        await chatSession.logError('internal_error', error.message, error.stack);
      }

      // Emit error via Socket.IO jika ada userId
      if (req.user?.id) {
        const aiSocket = require('../socket/index');
        global.io?.of('/ai').to(`ai_user_${req.user.id}`).emit('ai:status:error', {
          questionId: Date.now().toString(),
          error: 'INTERNAL_ERROR',
          message: 'Terjadi kesalahan internal',
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan dalam memproses pertanyaan AI',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Proses analisis AI secara asynchronous
   * @param {string} userId - ID user
   * @param {string} questionId - ID pertanyaan
   * @param {string} pertanyaan - Pertanyaan user
   * @param {Object} dataMetrik - Data metrik (opsional)
   * @param {string} serverId - ID server (opsional)
   * @param {Object} chatSession - Sesi chat dari database
   */
  async prosesAnalisisAI(userId, questionId, pertanyaan, dataMetrik, serverId, chatSession) {
    const aiStartTime = Date.now();

    try {
      let jawaban;
      let tokensUsed = 0;
      let confidence = 0.95; // Default confidence

      if (dataMetrik) {
        // Analisis data kesehatan server
        const result = await layananChatbotAI.analisisDataKesehatan(dataMetrik, pertanyaan);
        jawaban = result.jawaban;
        tokensUsed = result.tokensUsed || 0;
      } else {
        // Jawab pertanyaan umum
        const result = await layananChatbotAI.jawabPertanyaanUmum(pertanyaan);
        jawaban = result.jawaban;
        tokensUsed = result.tokensUsed || 0;
      }

      const aiProcessingTime = Date.now() - aiStartTime;

      // Siapkan data response
      const responseData = {
        questionId,
        answer: jawaban,
        dataUsed: dataMetrik ? this.ekstrakDataDigunakan(dataMetrik) : [],
        confidence: confidence,
        timestamp: new Date().toISOString(),
        serverId,
        processingTimeMs: aiProcessingTime,
        tokensUsed: tokensUsed
      };

      // Simpan pesan AI ke database
      await chatSession.tambahPesan({
        id: questionId + '_ai',
        tipe: 'ai',
        konten: jawaban,
        questionId: questionId,
        dataUsed: responseData.dataUsed,
        confidence: confidence,
        timestamp: new Date()
      });

      // Update AI metadata
      await chatSession.updateAIMetadata({
        tokensDigunakan: (chatSession.aiMetadata?.tokensDigunakan || 0) + tokensUsed,
        totalProcessingTimeMs: (chatSession.aiMetadata?.totalProcessingTimeMs || 0) + aiProcessingTime
      });

      // Update analisis data
      const kategori = this.kategorikanPertanyaan(pertanyaan);
      await this.updateAnalisisData(chatSession, kategori, dataMetrik);

      // Emit response via Socket.IO
      emitAIResponse(userId, responseData);

      // Selesaikan sesi jika ini pertanyaan terakhir atau timeout
      // (Bisa diatur berdasarkan business logic)

      console.log(`Chatbot AI - User ${userId}: ${pertanyaan.substring(0, 100)}... - Completed`);

    } catch (aiError) {
      console.error('Error dalam AI analysis:', aiError);

      const aiProcessingTime = Date.now() - aiStartTime;

      // Simpan error message ke database
      await chatSession.tambahPesan({
        id: questionId + '_error',
        tipe: 'system',
        konten: `❌ Error: AI gagal memproses pertanyaan. Silakan coba lagi.`,
        questionId: questionId,
        timestamp: new Date()
      });

      // Log error ke sesi
      await chatSession.logError('ai_processing_failed', aiError.message, aiError.stack);

      // Update AI metadata dengan error
      await chatSession.updateAIMetadata({
        totalProcessingTimeMs: (chatSession.aiMetadata?.totalProcessingTimeMs || 0) + aiProcessingTime
      });

      // Emit error via Socket.IO
      const aiSocket = require('../socket/index');
      global.io?.of('/ai').to(`ai_user_${userId}`).emit('ai:status:error', {
        questionId,
        error: 'AI_PROCESSING_FAILED',
        message: 'AI gagal memproses pertanyaan. Silakan coba lagi.',
        details: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Cari sesi chat yang ada atau buat sesi baru
   * @param {string} userId - ID user
   * @param {string} sessionId - ID sesi (opsional)
   * @param {string} serverId - ID server (opsional)
   * @param {string} clientIP - IP client
   * @param {string} userAgent - User agent
   * @returns {Object} Sesi chat
   */
  async cariAtauBuatSesiChat(userId, sessionId, serverId, clientIP, userAgent) {
    try {
      let chatSession;

      if (sessionId) {
        // Cari sesi yang ada
        chatSession = await RiwayatChatAI.findOne({
          sessionId: sessionId,
          userId: userId,
          status: 'active'
        });

        if (chatSession) {
          // Update audit info
          chatSession.auditInfo.apiCalls = (chatSession.auditInfo.apiCalls || 0) + 1;
          await chatSession.save();
          return chatSession;
        }
      }

      // Buat sesi baru
      const newSessionId = `chat_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      chatSession = new RiwayatChatAI({
        sessionId: newSessionId,
        userId: userId,
        serverId: serverId || null,
        timestampMulai: new Date(),
        status: 'active',
        pesan: [],
        aiMetadata: {
          model: 'gpt-3.5-turbo',
          tokensDigunakan: 0,
          confidenceRataRata: 0,
          totalProcessingTimeMs: 0,
          errorCount: 0
        },
        analisisData: {
          kategoriPertanyaan: [],
          metrikDigunakan: [],
          skorKesehatanSaatAnalisis: 0,
          rekomendasiDiberikan: [],
          totalPertanyaan: 0,
          totalJawabanAI: 0
        },
        auditInfo: {
          ipAddress: clientIP,
          userAgent: userAgent,
          zonaWaktu: 'Asia/Jakarta',
          validasiStatus: 'passed',
          apiCalls: 1
        }
      });

      await chatSession.save();
      return chatSession;

    } catch (error) {
      console.error('Error dalam mencari/membuat sesi chat:', error);
      throw new Error('Gagal membuat sesi chat');
    }
  }

  /**
   * Log request yang diblokir untuk audit
   * @param {string} userId - ID user
   * @param {string} pertanyaan - Pertanyaan yang diblokir
   * @param {string} clientIP - IP client
   * @param {string} userAgent - User agent
   * @param {string} reason - Alasan pemblokiran
   */
  async logBlockedRequest(userId, pertanyaan, clientIP, userAgent, reason) {
    try {
      const blockedSession = new RiwayatChatAI({
        sessionId: `blocked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        timestampMulai: new Date(),
        timestampSelesai: new Date(),
        status: 'error',
        durasiDetik: 0,
        pesan: [{
          id: Date.now().toString(),
          tipe: 'user',
          konten: pertanyaan,
          timestamp: new Date()
        }],
        auditInfo: {
          ipAddress: clientIP,
          userAgent: userAgent,
          validasiStatus: 'blocked',
          blockedReason: reason,
          apiCalls: 1
        },
        errorInfo: {
          type: 'validation',
          message: `Request blocked: ${reason}`,
          timestamp: new Date()
        }
      });

      await blockedSession.save();
      console.log(`Blocked request logged for user ${userId}: ${reason}`);

    } catch (error) {
      console.error('Error logging blocked request:', error);
    }
  }

  /**
   * Kategorikan pertanyaan berdasarkan konten
   * @param {string} pertanyaan - Pertanyaan user
   * @returns {string} Kategori pertanyaan
   */
  kategorikanPertanyaan(pertanyaan) {
    const lowerPertanyaan = pertanyaan.toLowerCase();

    // Kata kunci untuk setiap kategori
    const kategoriKeywords = {
      status: ['bagaimana', 'kondisi', 'status', 'sehat', 'baik', 'normal'],
      analisis: ['analisis', 'apa', 'kenapa', 'mengapa', 'penyebab', 'tren', 'perubahan'],
      troubleshooting: ['masalah', 'error', 'problem', 'issue', 'bantu', 'perbaiki', 'solusi'],
      edukasi: ['apa itu', 'bagaimana cara', 'jelaskan', 'definisi', 'maksud', 'arti'],
      umum: ['halo', 'hi', 'help', 'bantuan', 'terima kasih', 'thanks']
    };

    for (const [kategori, keywords] of Object.entries(kategoriKeywords)) {
      if (keywords.some(keyword => lowerPertanyaan.includes(keyword))) {
        return kategori;
      }
    }

    return 'umum'; // Default kategori
  }

  /**
   * Update data analisis sesi chat
   * @param {Object} chatSession - Sesi chat
   * @param {string} kategori - Kategori pertanyaan
   * @param {Object} dataMetrik - Data metrik yang digunakan
   */
  async updateAnalisisData(chatSession, kategori, dataMetrik) {
    try {
      // Tambah kategori jika belum ada
      if (!chatSession.analisisData.kategoriPertanyaan.includes(kategori)) {
        chatSession.analisisData.kategoriPertanyaan.push(kategori);
      }

      // Tambah metrik yang digunakan
      if (dataMetrik && dataMetrik._id) {
        if (!chatSession.analisisData.metrikDigunakan.includes(dataMetrik._id)) {
          chatSession.analisisData.metrikDigunakan.push(dataMetrik._id);
        }

        // Update skor kesehatan
        if (dataMetrik.skorKesehatan !== undefined) {
          chatSession.analisisData.skorKesehatanSaatAnalisis = dataMetrik.skorKesehatan;
        }
      }

      await chatSession.save();

    } catch (error) {
      console.error('Error updating analisis data:', error);
    }
  }

  /**
   * Mengambil riwayat chat user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async dapatkanRiwayatChat(req, res) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi'
        });
      }

      // Build query
      const query = { userId };

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.timestampMulai = {};
        if (startDate) query.timestampMulai.$gte = new Date(startDate);
        if (endDate) query.timestampMulai.$lte = new Date(endDate);
      }

      // Get data with pagination
      const riwayat = await RiwayatChatAI.find(query)
        .populate('serverId', 'nama hostname')
        .sort({ timestampMulai: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-auditInfo.ipAddress -auditInfo.userAgent'); // Exclude sensitive data

      // Get total count
      const total = await RiwayatChatAI.countDocuments(query);

      res.json({
        success: true,
        data: riwayat,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Error mengambil riwayat chat:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat chat',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mengambil statistik chat user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async dapatkanStatistikChat(req, res) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi'
        });
      }

      const statistik = await RiwayatChatAI.statistikUser(userId, startDate, endDate);

      res.json({
        success: true,
        data: statistik[0] || {
          totalSesi: 0,
          totalPesan: 0,
          rataDurasi: 0,
          totalTokens: 0,
          errorRate: 0,
          kategoriPopuler: {}
        }
      });

    } catch (error) {
      console.error('Error mengambil statistik chat:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik chat',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mengambil detail sesi chat tertentu
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async dapatkanDetailSesi(req, res) {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi'
        });
      }

      const sesi = await RiwayatChatAI.findOne({
        sessionId,
        userId
      })
        .populate('serverId', 'nama hostname')
        .populate('analisisData.metrikDigunakan', 'timestampPengumpulan skorKesehatan')
        .select('-auditInfo.ipAddress -auditInfo.userAgent'); // Exclude sensitive data

      if (!sesi) {
        return res.status(404).json({
          success: false,
          message: 'Sesi chat tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: sesi
      });

    } catch (error) {
      console.error('Error mengambil detail sesi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail sesi',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Menghapus sesi chat (soft delete dengan status)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async hapusSesiChat(req, res) {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi'
        });
      }

      const sesi = await RiwayatChatAI.findOne({
        sessionId,
        userId
      });

      if (!sesi) {
        return res.status(404).json({
          success: false,
          message: 'Sesi chat tidak ditemukan'
        });
      }

      // Soft delete dengan mengubah status
      await sesi.selesaikanSesi('cancelled');

      res.json({
        success: true,
        message: 'Sesi chat berhasil dihapus'
      });

    } catch (error) {
      console.error('Error menghapus sesi chat:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus sesi chat',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mengambil data metrik terbaru untuk server tertentu
   * @param {string} serverId - ID server
   * @returns {Object|null} Data metrik terbaru
   */
  async ambilDataMetrikTerbaru(serverId) {
    try {
      const query = serverId ? { serverId } : {};
      const metrikTerbaru = await Metrik.find(query)
        .sort({ timestamp: -1 })
        .limit(1)
        .populate('serverId', 'nama hostname');

      if (metrikTerbaru.length === 0) return null;

      return metrikTerbaru[0];
    } catch (error) {
      console.error('Error mengambil data metrik:', error);
      return null;
    }
  }

  /**
   * Mengekstrak data yang digunakan untuk analisis
   * @param {Object} dataMetrik - Data metrik
   * @returns {Array} Array data yang digunakan
   */
  ekstrakDataDigunakan(dataMetrik) {
    return [
      {
        type: 'cpu_usage',
        value: dataMetrik.cpuUsage,
        unit: '%',
        timestamp: dataMetrik.timestamp
      },
      {
        type: 'memory_usage',
        value: dataMetrik.memoryUsage,
        unit: '%',
        timestamp: dataMetrik.timestamp
      },
      {
        type: 'disk_usage',
        value: dataMetrik.diskUsage,
        unit: '%',
        timestamp: dataMetrik.timestamp
      },
      {
        type: 'network_in',
        value: dataMetrik.networkIn,
        unit: 'MB/s',
        timestamp: dataMetrik.timestamp
      },
      {
        type: 'network_out',
        value: dataMetrik.networkOut,
        unit: 'MB/s',
        timestamp: dataMetrik.timestamp
      },
      {
        type: 'load_average',
        value: dataMetrik.loadAverage,
        unit: '',
        timestamp: dataMetrik.timestamp
      }
    ];
  }

  /**
   * Menentukan apakah pertanyaan memerlukan analisis data
   * @param {string} pertanyaan - Pertanyaan pengguna
   * @returns {boolean} True jika perlu analisis data
   */
  perluAnalisisData(pertanyaan) {
    const kataKunciAnalisis = [
      'cpu', 'memory', 'ram', 'disk', 'storage', 'network', 'load', 'temperature',
      'health', 'status', 'performance', 'usage', 'utilization', 'trend',
      'analyze', 'analisis', 'check', 'monitor', 'metrics', 'data'
    ];

    const lowerPertanyaan = pertanyaan.toLowerCase();
    return kataKunciAnalisis.some(kata => lowerPertanyaan.includes(kata));
  }

  /**
   * Mendapatkan informasi tentang batasan AI
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async dapatkanInfoBatasan(req, res) {
    res.json({
      success: true,
      peran: [
        'Menjawab pertanyaan pengguna tentang sistem monitoring',
        'Menganalisis data kesehatan server',
        'Menjelaskan makna perubahan data dan tren'
      ],
      batasan: [
        'TIDAK BOLEH mengambil tindakan langsung pada sistem',
        'TIDAK BOLEH mengubah atau memodifikasi data',
        'TIDAK BOLEH membuat keputusan sistem',
        'TIDAK BOLEH menjalankan perintah atau konfigurasi'
      ],
      catatan: 'AI hanya memberikan analisis informatif dan rekomendasi non-eksekusi'
    });
  }
}

module.exports = new KontrolerChatbotAI();