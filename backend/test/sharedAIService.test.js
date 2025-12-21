// Test untuk Shared AI Service
// Memverifikasi konsistensi antara AI Chatbot dan AI Rekomendasi Email

const {
  UnifiedKnowledgeBase,
  CentralizedPromptManager,
  UnifiedContextBuilder,
  ResponseValidator,
  getSystemPrompt,
  buildContext,
  renderPrompt,
  validateResponse
} = require('../src/layanan/sharedAIService');

describe('Shared AI Service Tests', () => {
  let knowledgeBase;
  let promptManager;
  let contextBuilder;
  let responseValidator;

  beforeEach(() => {
    knowledgeBase = new UnifiedKnowledgeBase();
    promptManager = new CentralizedPromptManager(knowledgeBase);
    contextBuilder = new UnifiedContextBuilder(knowledgeBase);
    responseValidator = new ResponseValidator(knowledgeBase);
  });

  describe('Unified Knowledge Base', () => {
    test('should have correct parameter definitions', () => {
      const cpuDef = knowledgeBase.getParameterDefinition('cpu');
      expect(cpuDef).toBeDefined();
      expect(cpuDef.name).toBe('CPU Usage');
      expect(cpuDef.unit).toBe('%');
      expect(cpuDef.criticalRange).toEqual([85, 100]);
    });

    test('should evaluate severity correctly', () => {
      expect(knowledgeBase.evaluateSeverity('cpu', 50)).toBe('normal');
      expect(knowledgeBase.evaluateSeverity('cpu', 80)).toBe('warning');
      expect(knowledgeBase.evaluateSeverity('cpu', 90)).toBe('critical');
    });

    test('should provide recommendations', () => {
      const recommendations = knowledgeBase.getRecommendations('cpu', 'high');
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Centralized Prompt Manager', () => {
    test('should generate consistent system prompts', () => {
      const chatbotPrompt = promptManager.getSystemPrompt('chatbot');
      const emailPrompt = promptManager.getSystemPrompt('emailAnalysis');

      // Both should contain technical context
      expect(chatbotPrompt).toContain('CPU Usage');
      expect(emailPrompt).toContain('CPU Usage');

      // But they should be different for their specific use cases
      expect(chatbotPrompt).toContain('AI MONITOR');
      expect(emailPrompt).toContain('AI ANALYST');
    });

    test('should render prompt templates correctly', () => {
      const template = promptManager.getUserPromptTemplate('serverAnalysis');
      const data = {
        METRICS_DATA: 'CPU: 85% (critical)',
        USER_QUESTION: 'Why is CPU high?'
      };

      const rendered = promptManager.renderPrompt(template, data);
      expect(rendered).toContain('CPU: 85% (critical)');
      expect(rendered).toContain('Why is CPU high?');
    });
  });

  describe('Unified Context Builder', () => {
    test('should build chatbot context', async () => {
      const mockMetrics = {
        cpu: { persentase: 85 },
        memori: { persentase: 70 }
      };

      // Mock the database call
      const originalGetServerInfo = contextBuilder.getServerInfo;
      contextBuilder.getServerInfo = jest.fn().mockResolvedValue({
        nama: 'Test Server',
        jenisServer: 'web',
        lokasi: 'DC1'
      });

      const context = await contextBuilder.buildChatbotContext(
        'server123',
        mockMetrics,
        'Why is CPU high?'
      );

      expect(context).toHaveProperty('serverInfo');
      expect(context).toHaveProperty('metricsData');
      expect(context).toHaveProperty('userQuestion');
      expect(context.userQuestion).toBe('Why is CPU high?');

      // Restore original method
      contextBuilder.getServerInfo = originalGetServerInfo;
    });

    test('should build email alert context', async () => {
      const mockAlertData = {
        alert: { judul: 'High CPU', severity: 'critical', nilai: 85 },
        kondisi: { parameter: 'cpu', unit: '%' },
        server: { nama: 'Test Server', jenisServer: 'web' },
        metricsRealtime: { cpu: { persentase: 85 } },
        metricsHistoris: [],
        alertsAktif: []
      };

      const context = await contextBuilder.buildEmailAlertContext(mockAlertData);

      expect(context).toHaveProperty('alertTitle', 'High CPU');
      expect(context).toHaveProperty('parameter', 'cpu');
      expect(context).toHaveProperty('severity', 'critical');
      expect(context).toHaveProperty('value', 85);
    });
  });

  describe('Response Validator', () => {
    test('should validate chatbot response', () => {
      const validResponse = '📊 **Analisis Kondisi Server**\n\n**Status**: Critical\n- CPU: 85% (tinggi)';
      const validation = responseValidator.validateChatbotResponse(validResponse);

      expect(validation.isValid).toBe(true);
      expect(validation.hasEmoji).toBe(true);
    });

    test('should validate email analysis response', () => {
      const validJson = JSON.stringify({
        analisis: 'CPU sangat tinggi',
        penyebabMungkin: ['Traffic tinggi'],
        rekomendasi: ['Scale up CPU'],
        prioritas: 'high',
        estimasiWaktuPenyelesaian: '2-4 jam'
      });

      const validation = responseValidator.validateEmailAnalysisResponse(validJson);

      expect(validation.isValid).toBe(true);
      expect(validation.parsed).toHaveProperty('analisis');
      expect(validation.parsed.rekomendasi).toContain('Scale up CPU');
    });

    test('should handle invalid JSON in email response', () => {
      const invalidJson = 'This is not JSON';
      const validation = responseValidator.validateEmailAnalysisResponse(invalidJson);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('JSON parse error');
      expect(validation.standardized).toHaveProperty('analisis'); // Should be fallback
    });
  });

  describe('Integration Tests', () => {
    test('chatbot and email should use same knowledge base', () => {
      // Both should reference the same CPU threshold
      const chatbotPrompt = getSystemPrompt('chatbot');
      const emailPrompt = getSystemPrompt('emailAnalysis');

      // Both should contain the same technical context about CPU
      expect(chatbotPrompt).toContain('CPU Usage');
      expect(emailPrompt).toContain('CPU Usage');
    });

    test('should maintain consistent terminology', () => {
      const cpuDef = knowledgeBase.getParameterDefinition('cpu');

      // Check that terminology is consistent across prompts
      const chatbotPrompt = getSystemPrompt('chatbot');
      const emailPrompt = getSystemPrompt('emailAnalysis');

      // Both should use the same terminology
      expect(chatbotPrompt).toContain('CPU Usage');
      expect(emailPrompt).toContain('CPU Usage');
    });
  });
});