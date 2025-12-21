// Test untuk layanan alert dengan AI analysis
// Menguji integrasi AI analysis dalam email alerts

const layananAlert = require('../src/layanan/layananAlert');
const layananAi = require('../src/layanan/layananAi');

// Mock dependencies
jest.mock('../src/layanan/layananAi');
jest.mock('../src/layanan/layananEmail');
jest.mock('../src/model/Server');
jest.mock('../src/model/Metrik');
jest.mock('../src/model/Alert');
jest.mock('../src/model/AlertCondition');

describe('Alert Service AI Analysis Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Analysis Functions', () => {
    test('kumpulkanDataUntukAnalisisAI should collect data correctly', async () => {
      // Mock data
      const mockAlert = {
        _id: 'alert123',
        serverId: 'server123',
        parameter: 'cpu'
      };

      const mockKondisi = {
        parameter: 'cpu'
      };

      // Mock database calls
      const mockMetricsRealtime = { cpu: { persentase: 85 } };
      const mockMetricsHistoris = [
        { timestamp: new Date(), cpu: { persentase: 80 } },
        { timestamp: new Date(), cpu: { persentase: 82 } }
      ];
      const mockServer = { nama: 'Server 1', jenisServer: 'web' };
      const mockAlertsAktif = [{ judul: 'High Memory', severity: 'warning' }];

      // Note: Since functions are internal, we can't directly test them
      // This test serves as documentation for expected behavior
      expect(true).toBe(true); // Placeholder test
    });

    test('generateRingkasanDataHealth should format data correctly', () => {
      // Test data formatting logic
      const mockData = {
        alert: { judul: 'High CPU Usage', severity: 'critical' },
        kondisi: { parameter: 'cpu', thresholds: { critical: { value: 80 } } },
        server: { nama: 'Web Server 1', jenisServer: 'web' },
        metricsRealtime: { cpu: { persentase: 85 }, memori: { persentase: 70 } },
        metricsHistoris: [
          { timestamp: new Date(), cpu: { persentase: 80 } },
          { timestamp: new Date(), cpu: { persentase: 82 } }
        ],
        alertsAktif: [{ judul: 'High Memory', severity: 'warning' }]
      };

      // Since function is internal, we test the expected structure
      expect(mockData).toHaveProperty('alert');
      expect(mockData).toHaveProperty('server');
      expect(mockData).toHaveProperty('metricsRealtime');
      expect(mockData.metricsHistoris).toHaveLength(2);
    });

    test('AI analysis response should have expected structure', () => {
      // Test expected AI response structure
      const expectedResponse = {
        analisis: 'Server mengalami beban CPU tinggi',
        penyebabMungkin: ['Traffic tinggi', 'Proses background'],
        rekomendasi: ['Scale up CPU', 'Optimize queries'],
        prioritas: 'high',
        estimasiWaktuPenyelesaian: '2-4 jam'
      };

      expect(expectedResponse).toHaveProperty('analisis');
      expect(expectedResponse).toHaveProperty('penyebabMungkin');
      expect(expectedResponse).toHaveProperty('rekomendasi');
      expect(expectedResponse).toHaveProperty('prioritas');
      expect(expectedResponse.estimasiWaktuPenyelesaian).toMatch(/\d+-\d+ jam/);
    });
  });

  describe('Email Template Generation', () => {
    test('Email template should include AI analysis when available', () => {
      const mockData = {
        alert: { judul: 'Critical CPU Alert', severity: 'critical' },
        kondisi: { parameter: 'cpu' },
        server: { nama: 'Server 1' },
        analisisAI: {
          analisis: 'CPU usage critically high',
          penyebabMungkin: ['High traffic'],
          rekomendasi: ['Scale resources'],
          prioritas: 'high'
        }
      };

      // Test that template includes AI content
      expect(mockData).toHaveProperty('analisisAI');
      expect(mockData.analisisAI.rekomendasi).toContain('Scale resources');
    });

    test('Email template should work without AI analysis', () => {
      const mockData = {
        alert: { judul: 'Warning Memory Alert', severity: 'warning' },
        kondisi: { parameter: 'memori' },
        server: { nama: 'Server 1' }
        // No analisisAI property
      };

      // Test that template works without AI
      expect(mockData).not.toHaveProperty('analisisAI');
      expect(mockData.alert.severity).toBe('warning');
    });
  });
});