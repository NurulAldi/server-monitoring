const { GoogleGenerativeAI } = require('@google/generative-ai'); // Menggunakan Gemini AI
const {
  getSystemPrompt,
  buildContext,
  renderPrompt,
  validateResponse,
  executeAICompletion
} = require('./sharedAIService');

class LayananChatbotAI {
  constructor() {
    // Inisialisasi AI client menggunakan Gemini
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Gunakan system prompt dari shared service
    this.systemPrompt = getSystemPrompt('chatbot');
  }

  /**
   * Menganalisis data kesehatan server berdasarkan metrik yang diberikan
   * @param {Object} dataMetrik - Data metrik server (CPU, memory, dll.)
   * @param {string} pertanyaanPengguna - Pertanyaan spesifik pengguna
   * @param {string} userId - ID pengguna yang bertanya
   * @param {string} serverId - ID server yang dianalisis
   * @returns {string} Analisis dan penjelasan
   */
  async analisisDataKesehatan(dataMetrik, pertanyaanPengguna, userId = null, serverId = null) {
    let logId = null;
    let sessionId = null;

    try {
      // Import AI logging service
      const aiLoggingService = require('./aiLoggingService');

      // Start logging chatbot interaction
      const loggingContext = await aiLoggingService.startChatbotInteractionLogging(
        userId,
        serverId,
        {
          prompt: pertanyaanPengguna,
          serverInfo: serverId ? { id: serverId } : null,
          metricsData: dataMetrik,
          historicalData: null,
          userContext: { questionType: 'server_analysis' }
        }
      );

      sessionId = loggingContext.sessionId;
      logId = loggingContext.logId;

      // Build context menggunakan shared service
      const context = await buildContext('chatbot', serverId, dataMetrik, pertanyaanPengguna);

      // Render prompt menggunakan shared service
      const prompt = renderPrompt('serverAnalysis', context);

      // Execute AI completion menggunakan shared service
      const result = await executeAICompletion([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ], {
        max_tokens: 500,
        temperature: 0.3
      });

      // Validate response menggunakan shared service
      const validation = validateResponse('chatbot', result.response);

      // Complete logging dengan output AI
      await aiLoggingService.completeChatbotInteractionLogging(
        sessionId,
        result.rawResponse || result.response,
        validation.standardized,
        {
          confidence: validation.confidence || 0.8,
          processingTime: result.processingTime || 0,
          tokensUsed: result.usage || { total: result.usage?.total_tokens || 0 },
          accuracy: 0.8,
          relevance: 0.9,
          actionability: 0.7,
          timeliness: 0.9
        }
      );

      return {
        jawaban: validation.standardized,
        tokensUsed: result.usage?.total_tokens || 0,
        model: result.model,
        isValid: validation.isValid,
        logId: logId
      };
    } catch (error) {
      // Log error jika ada logId
      if (logId && sessionId) {
        try {
          await aiLoggingService.logAIError(
            logId,
            'chatbot_analysis_error',
            error.message,
            'Fallback to standard error response'
          );
        } catch (logError) {
          console.error('AI_ERROR_LOGGING_FAILED', logError);
        }
      }

      console.error('Error dalam analisis AI:', error);
      return {
        jawaban: 'Maaf, terjadi kesalahan dalam analisis data. Silakan coba lagi atau hubungi administrator.',
        tokensUsed: 0,
        model: 'error',
        isValid: false,
        logId: null
      };
    }
  }

  /**
   * Menjawab pertanyaan umum tentang sistem monitoring
   * @param {string} pertanyaan - Pertanyaan pengguna
   * @param {string} userId - ID pengguna yang bertanya
   * @returns {string} Jawaban informatif
   */
  async jawabPertanyaanUmum(pertanyaan, userId = null) {
    let logId = null;
    let sessionId = null;

    try {
      // Import AI logging service
      const aiLoggingService = require('./aiLoggingService');

      // Start logging chatbot interaction
      const loggingContext = await aiLoggingService.startChatbotInteractionLogging(
        userId,
        null, // no specific server
        {
          prompt: pertanyaan,
          serverInfo: null,
          metricsData: null,
          historicalData: null,
          userContext: { questionType: 'general_question' }
        }
      );

      sessionId = loggingContext.sessionId;
      logId = loggingContext.logId;

      // Gunakan shared AI service untuk konsistensi
      const result = await executeAICompletion([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: `Jawab pertanyaan tentang sistem monitoring server: "${pertanyaan}"` }
      ], {
        max_tokens: 300,
        temperature: 0.2
      });

      // Validate response
      const validation = validateResponse('chatbot', result.response);

      // Complete logging dengan output AI
      await aiLoggingService.completeChatbotInteractionLogging(
        sessionId,
        result.rawResponse || result.response,
        validation.standardized,
        {
          confidence: validation.confidence || 0.8,
          processingTime: result.processingTime || 0,
          tokensUsed: result.usage || { total: result.usage?.total_tokens || 0 },
          accuracy: 0.8,
          relevance: 0.9,
          actionability: 0.6,
          timeliness: 0.9
        }
      );

      return {
        jawaban: validation.standardized,
        tokensUsed: result.usage?.total_tokens || 0,
        model: result.model,
        isValid: validation.isValid,
        logId: logId
      };
    } catch (error) {
      // Log error jika ada logId
      if (logId && sessionId) {
        try {
          await aiLoggingService.logAIError(
            logId,
            'chatbot_general_error',
            error.message,
            'Fallback to standard error response'
          );
        } catch (logError) {
          console.error('AI_ERROR_LOGGING_FAILED', logError);
        }
      }

      console.error('Error dalam menjawab pertanyaan:', error);
      return {
        jawaban: 'Maaf, saya tidak dapat menjawab pertanyaan tersebut saat ini.',
        tokensUsed: 0,
        model: 'error',
        isValid: false,
        logId: null
      };
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