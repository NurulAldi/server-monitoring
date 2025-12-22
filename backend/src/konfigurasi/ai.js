// Konfigurasi AI service untuk chatbot analisis
// Mendukung OpenAI, Google Gemini, dan Ollama

const axios = require('axios');

// Konfigurasi AI dari environment variable
const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'openai', // openai, gemini, ollama
  apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY,
  model: process.env.AI_MODEL || 'gpt-4',
  baseUrl: process.env.AI_BASE_URL || null,
  timeout: parseInt(process.env.AI_TIMEOUT) || 30000, // 30 detik timeout
  maxRetries: parseInt(process.env.AI_MAX_RETRIES) || 3
};

// Validasi konfigurasi AI
function validasiKonfigurasiAI() {
  if (!AI_CONFIG.apiKey) {
    throw new Error('API key AI tidak ditemukan. Set OPENAI_API_KEY atau GEMINI_API_KEY di environment variable');
  }

  const validProviders = ['openai', 'gemini', 'ollama'];
  if (!validProviders.includes(AI_CONFIG.provider)) {
    throw new Error(`Provider AI tidak valid: ${AI_CONFIG.provider}. Pilih: ${validProviders.join(', ')}`);
  }

  console.log(`✅ Konfigurasi AI valid - Provider: ${AI_CONFIG.provider}, Model: ${AI_CONFIG.model}`);
}

// Default parameters untuk AI request
const AI_DEFAULTS = {
  temperature: 0.7, // Creativity level (0-1)
  maxTokens: 2000,   // Maximum response length
  topP: 0.9,         // Nucleus sampling
  frequencyPenalty: 0.0,
  presencePenalty: 0.0
};

// System prompts untuk berbagai use case
const SYSTEM_PROMPTS = {
  // Prompt untuk analisis server
  ANALISIS_SERVER: `Kamu adalah asisten AI ahli monitoring infrastruktur server.
Tugasmu adalah menganalisis data kesehatan server dan memberikan rekomendasi troubleshooting yang akurat.

INSTRUKSI:
- Analisis data metrics yang diberikan (CPU, Memory, Disk, Network, Latency)
- Identifikasi masalah potensial berdasarkan data
- Berikan rekomendasi troubleshooting yang spesifik dan actionable
- Gunakan bahasa Indonesia yang profesional
- Jika data tidak cukup, minta informasi tambahan
- Jangan berikan rekomendasi yang berbahaya atau tidak masuk akal

FORMAT OUTPUT:
1. Analisis masalah
2. Penyebab potensial
3. Rekomendasi langkah-langkah
4. Monitoring selanjutnya`,

  // Prompt untuk rekomendasi alert email
  REKOMENDASI_ALERT: `Kamu adalah spesialis monitoring server yang memberikan rekomendasi cepat untuk alert critical.

INSTRUKSI:
- Berikan rekomendasi singkat dan urgent untuk masalah server critical
- Fokus pada langkah-langkah immediate troubleshooting
- Gunakan bahasa Indonesia yang jelas dan tegas
- Prioritaskan keselamatan sistem dan data
- Jika memungkinkan, berikan estimasi waktu penyelesaian

FORMAT OUTPUT:
- Masalah: [ringkasan masalah]
- Prioritas: [tinggi/sedang/rendah]
- Rekomendasi: [langkah-langkah spesifik]
- Timeline: [estimasi waktu]`,

  // Prompt untuk chat interaktif
  CHAT_INTERAKTIF: `Kamu adalah asisten AI untuk monitoring kesehatan server.
Pengguna akan bertanya tentang status server, analisis masalah, atau troubleshooting.

INSTRUKSI:
- Jawab pertanyaan dengan informasi yang akurat berdasarkan data yang diberikan
- Jika data tidak cukup, jelaskan apa yang dibutuhkan
- Berikan penjelasan yang mudah dipahami
- Gunakan bahasa Indonesia yang profesional
- Jika pertanyaan di luar konteks monitoring server, arahkan kembali ke topik tersebut

KAPABILITAS:
- Analisis metrics server (CPU, Memory, Disk, Network)
- Troubleshooting masalah umum server
- Rekomendasi optimasi performa
- Penjelasan konsep monitoring`
};

// Fungsi untuk request ke OpenAI API
async function requestOpenAI(messages, options = {}) {
  const config = {
    ...AI_DEFAULTS,
    ...options
  };

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: AI_CONFIG.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty
    }, {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: AI_CONFIG.timeout
    });

    return {
      success: true,
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model
    };

  } catch (error) {
    console.error('❌ Error request OpenAI:', error.message);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// Fungsi untuk request ke Google Gemini API
async function requestGemini(prompt, options = {}) {
  const config = {
    ...AI_DEFAULTS,
    ...options
  };

  try {
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.apiKey}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: config.topP
      }
    }, {
      timeout: AI_CONFIG.timeout
    });

    return {
      success: true,
      content: response.data.candidates[0].content.parts[0].text,
      usage: response.data.usageMetadata,
      model: AI_CONFIG.model
    };

  } catch (error) {
    console.error('❌ Error request Gemini:', error.message);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

// Fungsi untuk request ke Ollama (local AI)
async function requestOllama(prompt, options = {}) {
  const config = {
    ...AI_DEFAULTS,
    ...options
  };

  const baseUrl = AI_CONFIG.baseUrl || 'http://localhost:11434';

  try {
    const response = await axios.post(`${baseUrl}/api/generate`, {
      model: AI_CONFIG.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
        top_p: config.topP
      }
    }, {
      timeout: AI_CONFIG.timeout
    });

    return {
      success: true,
      content: response.data.response,
      usage: {
        total_tokens: response.data.eval_count || 0
      },
      model: AI_CONFIG.model
    };

  } catch (error) {
    console.error('❌ Error request Ollama:', error.message);
    throw new Error(`Ollama API error: ${error.message}`);
  }
}

// Fungsi utama untuk request AI (routing berdasarkan provider)
async function requestAI(messages, promptType = 'CHAT_INTERAKTIF', options = {}) {
  try {
    validasiKonfigurasiAI();

    // Prepare messages berdasarkan provider
    let requestData;
    let response;

    switch (AI_CONFIG.provider) {
      case 'openai':
        // OpenAI menggunakan format messages array
        requestData = Array.isArray(messages) ? messages : [
          { role: 'system', content: SYSTEM_PROMPTS[promptType] },
          { role: 'user', content: messages }
        ];
        response = await requestOpenAI(requestData, options);
        break;

      case 'gemini':
        // Gemini menggunakan single prompt
        const geminiPrompt = Array.isArray(messages)
          ? messages.map(m => m.content).join('\n\n')
          : messages;
        requestData = `${SYSTEM_PROMPTS[promptType]}\n\n${geminiPrompt}`;
        response = await requestGemini(requestData, options);
        break;

      case 'ollama':
        // Ollama menggunakan single prompt
        const ollamaPrompt = Array.isArray(messages)
          ? messages.map(m => m.content).join('\n\n')
          : messages;
        requestData = `${SYSTEM_PROMPTS[promptType]}\n\n${ollamaPrompt}`;
        response = await requestOllama(requestData, options);
        break;

      default:
        throw new Error(`Provider AI tidak didukung: ${AI_CONFIG.provider}`);
    }

    return response;

  } catch (error) {
    console.error('❌ Error request AI:', error.message);
    throw error;
  }
}

// Fungsi untuk generate rekomendasi alert
async function generateRekomendasiAlert(metrics, serverInfo) {
  try {
    const prompt = `Server: ${serverInfo.nama}
Status: CRITICAL
Metrics:
- CPU: ${metrics.cpu}%
- Memory: ${metrics.memori}%
- Disk: ${metrics.disk}%
- Network: ${metrics.jaringan?.downloadMbps || 0} Mbps ↓ / ${metrics.jaringan?.uploadMbps || 0} Mbps ↑
- Latency: ${metrics.jaringan?.latensiMs || 0} ms

Berikan rekomendasi troubleshooting singkat untuk alert critical ini.`;

    const response = await requestAI(prompt, 'REKOMENDASI_ALERT', {
      temperature: 0.3, // Lebih konsisten untuk alert
      maxTokens: 500
    });

    return response.content;

  } catch (error) {
    console.error('❌ Error generate rekomendasi alert:', error.message);
    return 'Tidak dapat generate rekomendasi AI. Periksa konfigurasi AI service.';
  }
}

// Fungsi untuk analisis server interaktif
async function analisisServer(dataMetrics, historiMetrics, pertanyaanUser) {
  try {
    const context = `
DATA METRICS TERKINI:
${JSON.stringify(dataMetrics, null, 2)}

HISTORI METRICS (2 jam terakhir):
${JSON.stringify(historiMetrics, null, 2)}

PERTANYAAN USER: ${pertanyaanUser}

`;

    const response = await requestAI(context, 'ANALISIS_SERVER', {
      temperature: 0.7,
      maxTokens: 1500
    });

    return response.content;

  } catch (error) {
    console.error('❌ Error analisis server:', error.message);
    return 'Maaf, terjadi kesalahan saat menganalisis data server. Silakan coba lagi.';
  }
}

// Fungsi untuk generate response AI untuk chat interaktif
/**
 * Fungsi utama untuk menghasilkan respons AI dalam chat interaktif
 * Menggunakan sistem prompt CHAT_INTERAKTIF untuk komunikasi dengan user
 *
 * @param {string|Array} pesanInput - Pesan input dari user atau array riwayat chat
 * @param {Object} opsi - Opsi konfigurasi untuk request AI (opsional)
 * @returns {Promise<string>} - Respons AI yang dihasilkan
 *
 * Alur Kerja:
 * 1. Validasi input pesan
 * 2. Siapkan konteks chat berdasarkan format input
 * 3. Request ke AI service dengan prompt CHAT_INTERAKTIF
 * 4. Return respons yang dihasilkan atau fallback error
 *
 * Error Handling:
 * - Jika AI service error, return pesan fallback
 * - Logging error untuk debugging
 * - Tidak throw error agar chat tetap berfungsi
 */
async function generateResponseAi(pesanInput, opsi = {}) {
  try {
    // Validasi input
    if (!pesanInput || (typeof pesanInput !== 'string' && !Array.isArray(pesanInput))) {
      throw new Error('Input pesan tidak valid');
    }

    // Konfigurasi default untuk chat
    const konfigurasiChat = {
      temperature: 0.7, // Lebih kreatif untuk chat
      maxTokens: 1000,  // Respons yang cukup panjang
      ...opsi
    };

    // Request ke AI service
    const respons = await requestAI(pesanInput, 'CHAT_INTERAKTIF', konfigurasiChat);

    return respons.content;

  } catch (error) {
    console.error('❌ Error generate response AI:', error.message);

    // Return pesan fallback agar chat tetap responsif
    return 'Maaf, saya mengalami kesulitan memproses pesan Anda saat ini. Silakan coba lagi dalam beberapa saat.';
  }
}

/**
 * DESKRIPSI: Test koneksi ke provider AI
 * TUJUAN: Memverifikasi apakah API key dan endpoint AI berfungsi
 * RETURN: { success: boolean, model?: string, message?: string }
 */
async function testKoneksiAI() {
  try {
    // Gunakan requestAI dengan prompt singkat untuk verifikasi
    const respons = await requestAI('Tes koneksi: balas dengan kata OK', 'CHAT_INTERAKTIF', { maxTokens: 5 });
    return {
      success: true,
      model: respons.model,
      message: respons.content
    };
  } catch (error) {
    console.error('❌ testKoneksiAI failed:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

// Export semua fungsi dan konstanta
module.exports = {
  requestAI,
  generateResponseAi,
  generateRekomendasiAlert,
  analisisServer,
  testKoneksiAI,
  SYSTEM_PROMPTS,
  AI_CONFIG,
  AI_DEFAULTS
};