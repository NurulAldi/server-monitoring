// Shared AI Service Layer untuk Sistem Monitoring Server
// Menyediakan komponen bersama untuk AI Chatbot dan AI Rekomendasi Email

const { logger } = require('../utilitas/logger');
const { OpenAI } = require('openai');

// Inisialisasi OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Shared AI Engine Core
 * Titik entry tunggal untuk semua interaksi OpenAI API
 */
class SharedAIEngine {
  constructor() {
    this.client = openai;
    this.defaultConfig = {
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      max_tokens: 1000,
      timeout: 30000
    };
  }

  /**
   * Execute AI completion dengan konfigurasi yang konsisten
   */
  async executeCompletion(messages, config = {}) {
    try {
      const completionConfig = {
        ...this.defaultConfig,
        ...config,
        messages
      };

      logger.debug('Executing AI completion', {
        messageCount: messages.length,
        model: completionConfig.model,
        temperature: completionConfig.temperature
      });

      const completion = await this.client.chat.completions.create(completionConfig);

      const response = completion.choices[0].message.content;
      const usage = completion.usage;

      logger.debug('AI completion successful', {
        responseLength: response.length,
        tokensUsed: usage?.total_tokens
      });

      return {
        response,
        usage,
        model: completionConfig.model
      };

    } catch (error) {
      logger.logError('AI_COMPLETION_ERROR', error, {
        messageCount: messages.length,
        config: { ...config, messages: undefined } // Exclude messages for security
      });
      throw new Error(`AI completion failed: ${error.message}`);
    }
  }
}

/**
 * Unified Knowledge Base
 * Pengetahuan bersama tentang server health, threshold, dan business rules
 */
class UnifiedKnowledgeBase {
  constructor() {
    this.serverHealthOntology = {
      parameters: {
        cpu: {
          name: 'CPU Usage',
          unit: '%',
          normalRange: [0, 70],
          warningRange: [70, 85],
          criticalRange: [85, 100],
          description: 'Persentase penggunaan CPU server'
        },
        memori: {
          name: 'Memory Usage',
          unit: '%',
          normalRange: [0, 75],
          warningRange: [75, 88],
          criticalRange: [88, 100],
          description: 'Persentase penggunaan RAM server'
        },
        disk: {
          name: 'Disk Usage',
          unit: '%',
          normalRange: [0, 80],
          warningRange: [80, 90],
          criticalRange: [90, 100],
          description: 'Persentase penggunaan penyimpanan disk'
        },
        jaringan: {
          name: 'Network I/O',
          unit: 'MB/s',
          normalRange: [0, 50],
          warningRange: [50, 100],
          criticalRange: [100, Infinity],
          description: 'Kecepatan transfer data jaringan'
        }
      },

      severityLevels: {
        normal: {
          label: 'Normal',
          color: 'green',
          description: 'Kondisi server dalam batas normal'
        },
        warning: {
          label: 'Peringatan',
          color: 'yellow',
          description: 'Perlu perhatian, monitor terus menerus'
        },
        critical: {
          label: 'Kritis',
          color: 'red',
          description: 'Perlu tindakan segera untuk mencegah downtime'
        },
        danger: {
          label: 'Bahaya',
          color: 'red',
          description: 'Risiko tinggi downtime server'
        }
      }
    };

    this.businessRules = {
      alertThresholds: {
        cpu: { warning: 70, critical: 85 },
        memori: { warning: 75, critical: 88 },
        disk: { warning: 80, critical: 90 }
      },

      recommendations: {
        cpu: {
          high: [
            'Identifikasi proses dengan CPU usage tinggi menggunakan top/htop',
            'Periksa aplikasi yang mengalami infinite loop atau memory leak',
            'Pertimbangkan penambahan CPU core atau vertical scaling',
            'Implementasi load balancing jika traffic tinggi'
          ]
        },
        memori: {
          high: [
            'Periksa memory usage per proses menggunakan ps aux --sort=-%mem',
            'Identifikasi dan restart aplikasi yang memory leak',
            'Pertimbangkan penambahan RAM atau horizontal scaling',
            'Optimalkan konfigurasi aplikasi untuk mengurangi memory usage'
          ]
        },
        disk: {
          high: [
            'Periksa penggunaan disk per direktori menggunakan du -h',
            'Bersihkan file log lama dan temporary files',
            'Archive data yang tidak aktif ke storage terpisah',
            'Pertimbangkan penambahan disk storage'
          ]
        }
      }
    };
  }

  /**
   * Get parameter definition
   */
  getParameterDefinition(parameter) {
    return this.serverHealthOntology.parameters[parameter] || null;
  }

  /**
   * Get severity level info
   */
  getSeverityInfo(severity) {
    return this.serverHealthOntology.severityLevels[severity] || null;
  }

  /**
   * Get recommendations for parameter and condition
   */
  getRecommendations(parameter, condition = 'high') {
    return this.businessRules.recommendations[parameter]?.[condition] || [];
  }

  /**
   * Evaluate severity based on value and parameter
   */
  evaluateSeverity(parameter, value) {
    const paramDef = this.getParameterDefinition(parameter);
    if (!paramDef) return 'unknown';

    const { normalRange, warningRange, criticalRange } = paramDef;

    if (value >= criticalRange[0]) return 'critical';
    if (value >= warningRange[0]) return 'warning';
    if (value >= normalRange[0] && value <= normalRange[1]) return 'normal';

    return 'unknown';
  }
}

/**
 * Centralized Prompt Manager
 * Mengelola semua prompt templates dan system prompts
 */
class CentralizedPromptManager {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.prompts = {
      system: {
        chatbot: this.buildChatbotSystemPrompt(),
        emailAnalysis: this.buildEmailAnalysisSystemPrompt(),
        generalAnalysis: this.buildGeneralAnalysisSystemPrompt()
      },

      user: {
        serverAnalysis: this.buildServerAnalysisPrompt(),
        alertRecommendation: this.buildAlertRecommendationPrompt(),
        healthSummary: this.buildHealthSummaryPrompt()
      }
    };
  }

  /**
   * Build system prompt for chatbot
   */
  buildChatbotSystemPrompt() {
    return `# AI MONITOR - SISTEM MONITORING KESEHATAN SERVER

## IDENTITAS DAN PERAN
Anda adalah asisten AI cerdas untuk sistem monitoring kesehatan server. Nama Anda adalah "AI Monitor". Anda bertugas membantu pengguna memahami dan menganalisis kondisi kesehatan server mereka.

## KONTEKS TEKNIS
${this.buildTechnicalContext()}

## ATURAN KOMUNIKASI
- Bahasa: Indonesia formal dan profesional
- Tone: Ramah, informatif, dan actionable
- Format: Struktur dengan emoji dan heading yang jelas
- Fokus: Analisis data dan rekomendasi monitoring

## BATASAN KAPABILITAS
✅ Analisis data metrik real-time
✅ Jelaskan arti parameter kesehatan
✅ Berikan rekomendasi monitoring
✅ Identifikasi pola dan tren
✅ Jawab pertanyaan tentang sistem monitoring

❌ Tidak bisa mengambil tindakan langsung pada server
❌ Tidak bisa mengubah konfigurasi sistem
❌ Tidak bisa mengakses file di luar monitoring system`;
  }

  /**
   * Build system prompt for email analysis
   */
  buildEmailAnalysisSystemPrompt() {
    return `# AI ANALYST - ANALISIS ALERT EMAIL SERVER

## PERAN
Anda adalah AI analis kesehatan server untuk sistem monitoring. Tugas Anda menganalisis kondisi server saat alert terjadi dan memberikan rekomendasi terstruktur untuk email.

## KONTEKS TEKNIS
${this.buildTechnicalContext()}

## FORMAT OUTPUT
Respons harus dalam format JSON dengan struktur:
{
  "analisis": "Analisis singkat kondisi server",
  "penyebabMungkin": ["Penyebab 1", "Penyebab 2"],
  "rekomendasi": ["Rekomendasi 1", "Rekomendasi 2"],
  "prioritas": "high|medium|low",
  "estimasiWaktuPenyelesaian": "X-Y jam"
}

## ATURAN ANALISIS
- Fokus pada data teknis dan evidence-based
- Berikan rekomendasi actionable dan spesifik
- Prioritas berdasarkan dampak potensial
- Estimasi waktu realistis berdasarkan kompleksitas`;
  }

  /**
   * Build general analysis system prompt
   */
  buildGeneralAnalysisSystemPrompt() {
    return `# AI ANALYST - ANALISIS KESEHATAN SERVER

## PERAN
Anda adalah AI analis untuk sistem monitoring kesehatan server. Tugas Anda menganalisis performa server dan memberikan rekomendasi berdasarkan data metrik.

## KONTEKS TEKNIS
${this.buildTechnicalContext()}

## ATURAN ANALISIS
- Analisis berdasarkan data konkret dan threshold yang ditentukan
- Berikan rekomendasi yang spesifik dan dapat diimplementasikan
- Gunakan bahasa Indonesia yang profesional
- Fokus pada troubleshooting dan preventive maintenance`;
  }

  /**
   * Build technical context shared across all prompts
   */
  buildTechnicalContext() {
    const params = Object.entries(this.knowledgeBase.serverHealthOntology.parameters)
      .map(([key, param]) => {
        return `${param.name} (${param.unit}):
- Normal: ${param.normalRange[0]}-${param.normalRange[1]}
- Warning: ${param.warningRange[0]}-${param.warningRange[1]}
- Critical: ${param.criticalRange[0]}-${param.criticalRange[1]}
- ${param.description}`;
      }).join('\n\n');

    return `PARAMETER KESEHATAN SERVER:

${params}

LEVEL SEVERITY:
- Normal: Kondisi optimal, tidak perlu tindakan
- Warning: Perlu monitoring intensif, persiapkan tindakan
- Critical: Perlu tindakan segera untuk mencegah downtime
- Danger: Risiko tinggi, tindakan emergency diperlukan`;
  }

  /**
   * Build server analysis prompt template
   */
  buildServerAnalysisPrompt() {
    return `Berdasarkan data kesehatan server berikut:

METRIK REAL-TIME:
{{METRICS_DATA}}

KONDISI SERVER:
{{SERVER_INFO}}

PERTANYAAN PENGGUNA: {{USER_QUESTION}}

Berikan analisis yang:
1. Menjelaskan kondisi saat ini berdasarkan threshold
2. Identifikasi parameter yang bermasalah
3. Berikan rekomendasi monitoring yang spesifik
4. Sarankan tindakan preventif jika diperlukan

Gunakan format yang jelas dan mudah dipahami.`;
  }

  /**
   * Build alert recommendation prompt template
   */
  buildAlertRecommendationPrompt() {
    return `ALERT TERDETEKSI:

JUDUL: {{ALERT_TITLE}}
PARAMETER: {{PARAMETER}}
SEVERITY: {{SEVERITY}}
NILAI: {{VALUE}} {{UNIT}}

DATA KONTEKS:
{{CONTEXT_DATA}}

DATA HISTORIS (2 jam terakhir):
{{HISTORICAL_DATA}}

Analisis kondisi server dan berikan rekomendasi dalam format JSON yang ditentukan.
Fokus pada:
- Root cause analysis berdasarkan data
- Rekomendasi actionable dengan prioritas
- Estimasi waktu penyelesaian yang realistis
- Dampak potensial jika tidak ditangani`;
  }

  /**
   * Build health summary prompt template
   */
  buildHealthSummaryPrompt() {
    return `RINGKASAN KESEHATAN SERVER:

SERVER: {{SERVER_NAME}}
WAKTU ANALISIS: {{TIMESTAMP}}

METRIK RINGKASAN:
{{METRICS_SUMMARY}}

ALERT AKTIF:
{{ACTIVE_ALERTS}}

DATA HISTORIS:
{{HISTORICAL_TRENDS}}

Berikan analisis komprehensif kondisi server dan rekomendasi maintenance.`;
  }

  /**
   * Get system prompt by type
   */
  getSystemPrompt(type) {
    return this.prompts.system[type] || this.prompts.system.generalAnalysis;
  }

  /**
   * Get user prompt template by type
   */
  getUserPromptTemplate(type) {
    return this.prompts.user[type] || '';
  }

  /**
   * Render prompt template with data
   */
  renderPrompt(template, data) {
    let rendered = template;
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key.toUpperCase()}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    });
    return rendered;
  }
}

/**
 * Unified Context Builder
 * Membangun konteks yang konsisten untuk semua AI operations
 */
class UnifiedContextBuilder {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
  }

  /**
   * Build context for chatbot analysis
   */
  async buildChatbotContext(serverId, metrics, userQuestion) {
    const server = await this.getServerInfo(serverId);
    const formattedMetrics = this.formatMetricsForChatbot(metrics);

    return {
      serverInfo: this.formatServerInfo(server),
      metricsData: formattedMetrics,
      userQuestion: userQuestion,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build context for email alert analysis
   */
  async buildEmailAlertContext(alertData) {
    const { alert, kondisi, server, metricsRealtime, metricsHistoris, alertsAktif } = alertData;

    return {
      alertTitle: alert.judul,
      parameter: kondisi.parameter,
      severity: alert.severity,
      value: alert.nilai,
      unit: kondisi.unit,
      contextData: this.formatServerContext(server, metricsRealtime),
      historicalData: this.formatHistoricalData(metricsHistoris),
      activeAlerts: this.formatActiveAlerts(alertsAktif),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build context for general server analysis
   */
  async buildGeneralAnalysisContext(serverId, metrics, historicalData = []) {
    const server = await this.getServerInfo(serverId);

    return {
      serverName: server.nama,
      timestamp: new Date().toISOString(),
      metricsSummary: this.formatMetricsSummary(metrics),
      activeAlerts: await this.getActiveAlerts(serverId),
      historicalTrends: this.formatHistoricalTrends(historicalData)
    };
  }

  /**
   * Get server information
   */
  async getServerInfo(serverId) {
    const Server = require('../model/Server');
    return await Server.findById(serverId).select('nama jenisServer spesifikasi lokasi');
  }

  /**
   * Get active alerts for server
   */
  async getActiveAlerts(serverId) {
    const Alert = require('../model/Alert');
    const alerts = await Alert.find({
      serverId,
      statusAlert: { $in: ['new', 'acknowledged'] }
    }).select('judul severity kondisiPemicu').limit(5);

    return alerts.map(alert => ({
      title: alert.judul,
      severity: alert.severity,
      trigger: alert.kondisiPemicu
    }));
  }

  /**
   * Format metrics for chatbot
   */
  formatMetricsForChatbot(metrics) {
    const formatted = [];

    Object.entries(metrics).forEach(([param, data]) => {
      const paramDef = this.knowledgeBase.getParameterDefinition(param);
      if (paramDef && data.persentase !== undefined) {
        const severity = this.knowledgeBase.evaluateSeverity(param, data.persentase);
        const severityInfo = this.knowledgeBase.getSeverityInfo(severity);

        formatted.push(`${paramDef.name}: ${data.persentase}${paramDef.unit} (${severityInfo?.label || 'Unknown'})`);
      }
    });

    return formatted.join('\n');
  }

  /**
   * Format server info
   */
  formatServerInfo(server) {
    return `Server: ${server.nama}
Jenis: ${server.jenisServer}
Lokasi: ${server.lokasi || 'N/A'}
Spesifikasi: ${server.spesifikasi || 'N/A'}`;
  }

  /**
   * Format server context for email
   */
  formatServerContext(server, metrics) {
    const context = [`Server: ${server.nama} (${server.jenisServer})`];

    if (server.lokasi) context.push(`Lokasi: ${server.lokasi}`);
    if (server.spesifikasi) context.push(`Spesifikasi: ${server.spesifikasi}`);

    context.push('\nMetrik Saat Ini:');
    Object.entries(metrics).forEach(([param, data]) => {
      const paramDef = this.knowledgeBase.getParameterDefinition(param);
      if (paramDef && data.persentase !== undefined) {
        context.push(`${paramDef.name}: ${data.persentase}${paramDef.unit}`);
      }
    });

    return context.join('\n');
  }

  /**
   * Format historical data
   */
  formatHistoricalData(historicalData) {
    if (!historicalData || historicalData.length === 0) {
      return 'Tidak ada data historis tersedia';
    }

    const formatted = ['Data Historis (2 jam terakhir):'];
    historicalData.slice(0, 10).forEach((data, index) => {
      const timestamp = new Date(data.timestamp).toLocaleTimeString('id-ID');
      formatted.push(`\n${timestamp}:`);

      Object.entries(data).forEach(([param, value]) => {
        if (param !== 'timestamp' && param !== '_id' && param !== 'serverId') {
          const paramDef = this.knowledgeBase.getParameterDefinition(param);
          if (paramDef && value.persentase !== undefined) {
            formatted.push(`  ${paramDef.name}: ${value.persentase}${paramDef.unit}`);
          }
        }
      });
    });

    return formatted.join('\n');
  }

  /**
   * Format active alerts
   */
  formatActiveAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
      return 'Tidak ada alert aktif lainnya';
    }

    const formatted = ['Alert Aktif Lainnya:'];
    alerts.forEach(alert => {
      formatted.push(`- ${alert.judul} (${alert.severity})`);
    });

    return formatted.join('\n');
  }

  /**
   * Format metrics summary
   */
  formatMetricsSummary(metrics) {
    const summary = [];

    Object.entries(metrics).forEach(([param, data]) => {
      const paramDef = this.knowledgeBase.getParameterDefinition(param);
      if (paramDef && data.persentase !== undefined) {
        const severity = this.knowledgeBase.evaluateSeverity(param, data.persentase);
        summary.push(`${paramDef.name}: ${data.persentase}${paramDef.unit} (${severity})`);
      }
    });

    return summary.join('\n');
  }

  /**
   * Format historical trends
   */
  formatHistoricalTrends(historicalData) {
    if (!historicalData || historicalData.length === 0) {
      return 'Tidak ada data tren tersedia';
    }

    // Simple trend analysis - could be enhanced
    const trends = {};
    historicalData.forEach(data => {
      Object.entries(data).forEach(([param, value]) => {
        if (param !== 'timestamp' && param !== '_id' && param !== 'serverId') {
          if (!trends[param]) trends[param] = [];
          if (value.persentase !== undefined) {
            trends[param].push(value.persentase);
          }
        }
      });
    });

    const formatted = ['Tren Historis:'];
    Object.entries(trends).forEach(([param, values]) => {
      if (values.length > 1) {
        const paramDef = this.knowledgeBase.getParameterDefinition(param);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const trend = values[values.length - 1] > values[0] ? 'meningkat' : 'menurun';

        formatted.push(`${paramDef?.name || param}: Rata-rata ${avg.toFixed(1)}%, Min ${min}%, Max ${max}%, Tren: ${trend}`);
      }
    });

    return formatted.join('\n');
  }
}

/**
 * Response Validator & Standardizer
 * Memastikan response AI konsisten dan valid
 */
class ResponseValidator {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
  }

  /**
   * Validate and standardize chatbot response
   */
  validateChatbotResponse(response) {
    // Basic validation - ensure response is not empty and reasonable length
    if (!response || response.length < 10) {
      return {
        isValid: false,
        error: 'Response too short or empty',
        standardized: 'Maaf, saya tidak dapat memberikan analisis saat ini. Silakan coba lagi.'
      };
    }

    // Check for required elements (emoji, structure)
    const hasEmoji = /📊|💡|⚠️|✅|❌/.test(response);
    const hasStructure = response.includes('**') || response.includes('\n-');

    return {
      isValid: true,
      hasEmoji,
      hasStructure,
      standardized: this.standardizeChatbotFormat(response)
    };
  }

  /**
   * Validate and standardize email analysis response
   */
  validateEmailAnalysisResponse(response) {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);

      // Validate required fields
      const requiredFields = ['analisis', 'penyebabMungkin', 'rekomendasi', 'prioritas'];
      const missingFields = requiredFields.filter(field => !parsed[field]);

      if (missingFields.length > 0) {
        return {
          isValid: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          standardized: this.createFallbackEmailResponse()
        };
      }

      // Validate data types
      if (!Array.isArray(parsed.penyebabMungkin) || !Array.isArray(parsed.rekomendasi)) {
        return {
          isValid: false,
          error: 'penyebabMungkin and rekomendasi must be arrays',
          standardized: this.createFallbackEmailResponse()
        };
      }

      // Validate priority
      const validPriorities = ['high', 'medium', 'low'];
      if (!validPriorities.includes(parsed.prioritas)) {
        parsed.prioritas = 'medium'; // Default to medium
      }

      return {
        isValid: true,
        parsed,
        standardized: parsed
      };

    } catch (error) {
      return {
        isValid: false,
        error: `JSON parse error: ${error.message}`,
        standardized: this.createFallbackEmailResponse()
      };
    }
  }

  /**
   * Standardize chatbot response format
   */
  standardizeChatbotFormat(response) {
    // Ensure response has proper structure
    if (!response.includes('📊') && !response.includes('💡')) {
      return `💡 **Jawaban AI Monitor**\n\n${response}`;
    }

    return response;
  }

  /**
   * Create fallback email response
   */
  createFallbackEmailResponse() {
    return {
      analisis: 'Terjadi kesalahan dalam analisis otomatis. Perlu investigasi manual.',
      penyebabMungkin: ['Kesalahan sistem analisis AI', 'Data tidak lengkap'],
      rekomendasi: [
        'Periksa kondisi server secara manual',
        'Investigasi log sistem untuk detail lebih lanjut',
        'Hubungi tim teknis untuk analisis mendalam'
      ],
      prioritas: 'high',
      estimasiWaktuPenyelesaian: '2-4 jam'
    };
  }
}

// Initialize shared components
const aiEngine = new SharedAIEngine();
const knowledgeBase = new UnifiedKnowledgeBase();
const promptManager = new CentralizedPromptManager(knowledgeBase);
const contextBuilder = new UnifiedContextBuilder(knowledgeBase);
const responseValidator = new ResponseValidator(knowledgeBase);

// Export shared components
module.exports = {
  SharedAIEngine: aiEngine,
  UnifiedKnowledgeBase: knowledgeBase,
  CentralizedPromptManager: promptManager,
  UnifiedContextBuilder: contextBuilder,
  ResponseValidator: responseValidator,

  // Convenience methods for common operations
  async executeAICompletion(messages, config = {}) {
    return await aiEngine.executeCompletion(messages, config);
  },

  getSystemPrompt(type) {
    return promptManager.getSystemPrompt(type);
  },

  async buildContext(contextType, ...args) {
    switch (contextType) {
      case 'chatbot':
        return await contextBuilder.buildChatbotContext(...args);
      case 'emailAlert':
        return await contextBuilder.buildEmailAlertContext(...args);
      case 'generalAnalysis':
        return await contextBuilder.buildGeneralAnalysisContext(...args);
      default:
        throw new Error(`Unknown context type: ${contextType}`);
    }
  },

  renderPrompt(templateType, data) {
    const template = promptManager.getUserPromptTemplate(templateType);
    return promptManager.renderPrompt(template, data);
  },

  validateResponse(responseType, response) {
    switch (responseType) {
      case 'chatbot':
        return responseValidator.validateChatbotResponse(response);
      case 'emailAnalysis':
        return responseValidator.validateEmailAnalysisResponse(response);
      default:
        return { isValid: true, standardized: response };
    }
  }
};