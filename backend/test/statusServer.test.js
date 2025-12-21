// Test untuk utilitas status server
// Menguji logika penentuan status server

const {
  tentukanStatusParameter,
  hitungWeightedScore,
  tentukanStatusServer,
  evaluasiHysteresis,
  STATUS_LEVELS
} = require('../utilitas/statusServer');

describe('Status Server Utility Tests', () => {
  describe('tentukanStatusParameter', () => {
    test('CPU parameter status', () => {
      expect(tentukanStatusParameter('cpu', 45)).toBe('normal');
      expect(tentukanStatusParameter('cpu', 75)).toBe('warning');
      expect(tentukanStatusParameter('cpu', 85)).toBe('critical');
      expect(tentukanStatusParameter('cpu', 95)).toBe('danger');
    });

    test('Memory parameter status', () => {
      expect(tentukanStatusParameter('memori', 65)).toBe('normal');
      expect(tentukanStatusParameter('memori', 75)).toBe('warning');
      expect(tentukanStatusParameter('memori', 88)).toBe('critical');
      expect(tentukanStatusParameter('memori', 96)).toBe('danger');
    });

    test('Network latency status', () => {
      expect(tentukanStatusParameter('jaringan', 25, 'latensi')).toBe('normal');
      expect(tentukanStatusParameter('jaringan', 75, 'latensi')).toBe('warning');
      expect(tentukanStatusParameter('jaringan', 150, 'latensi')).toBe('critical');
      expect(tentukanStatusParameter('jaringan', 600, 'latensi')).toBe('danger');
    });

    test('Network throughput status', () => {
      expect(tentukanStatusParameter('jaringan', 80, 'throughput')).toBe('normal');
      expect(tentukanStatusParameter('jaringan', 20, 'throughput')).toBe('warning');
      expect(tentukanStatusParameter('jaringan', 5, 'throughput')).toBe('critical');
      expect(tentukanStatusParameter('jaringan', 0, 'throughput')).toBe('danger');
    });
  });

  describe('hitungWeightedScore', () => {
    test('Normal metrics score', () => {
      const metrics = {
        cpu: { persentase: 45 },
        memori: { persentase: 60 },
        disk: { persentase: 70 },
        jaringan: { latensiMs: 25, downloadMbps: 80 }
      };

      const result = hitungWeightedScore(metrics);
      expect(result.score).toBeLessThan(2); // Should be normal range
      expect(result.breakdown.cpu.status).toBe('normal');
      expect(result.breakdown.memori.status).toBe('normal');
    });

    test('Warning metrics score', () => {
      const metrics = {
        cpu: { persentase: 75 },
        memori: { persentase: 65 },
        disk: { persentase: 72 },
        jaringan: { latensiMs: 45, downloadMbps: 80 }
      };

      const result = hitungWeightedScore(metrics);
      expect(result.score).toBeGreaterThanOrEqual(2);
      expect(result.breakdown.cpu.status).toBe('warning');
    });
  });

  describe('tentukanStatusServer', () => {
    test('HEALTHY status', () => {
      const metrics = {
        cpu: { persentase: 45 },
        memori: { persentase: 60 },
        disk: { persentase: 70 },
        jaringan: { latensiMs: 25, downloadMbps: 80 },
        timestampPengumpulan: new Date()
      };

      const result = tentukanStatusServer(metrics);
      expect(result.status).toBe('HEALTHY');
      expect(result.confidence).toBeGreaterThan(90);
    });

    test('WARNING status - multiple warnings', () => {
      const metrics = {
        cpu: { persentase: 75 },
        memori: { persentase: 78 },
        disk: { persentase: 72 },
        jaringan: { latensiMs: 45, downloadMbps: 80 },
        timestampPengumpulan: new Date()
      };

      const result = tentukanStatusServer(metrics);
      expect(result.status).toBe('WARNING');
      expect(result.reason).toContain('parameter dalam kondisi warning');
    });

    test('CRITICAL status - CPU critical', () => {
      const metrics = {
        cpu: { persentase: 85 },
        memori: { persentase: 65 },
        disk: { persentase: 72 },
        jaringan: { latensiMs: 45, downloadMbps: 80 },
        timestampPengumpulan: new Date()
      };

      const result = tentukanStatusServer(metrics);
      expect(result.status).toBe('CRITICAL');
      expect(result.reason).toContain('CPU');
    });

    test('DANGER status - memory danger', () => {
      const metrics = {
        cpu: { persentase: 45 },
        memori: { persentase: 96 },
        disk: { persentase: 72 },
        jaringan: { latensiMs: 45, downloadMbps: 80 },
        timestampPengumpulan: new Date()
      };

      const result = tentukanStatusServer(metrics);
      expect(result.status).toBe('DANGER');
      expect(result.reason).toContain('danger');
    });

    test('OFFLINE status - old data', () => {
      const oldDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const metrics = {
        cpu: { persentase: 45 },
        memori: { persentase: 60 },
        disk: { persentase: 70 },
        jaringan: { latensiMs: 25, downloadMbps: 80 },
        timestampPengumpulan: oldDate
      };

      const result = tentukanStatusServer(metrics);
      expect(result.status).toBe('OFFLINE');
      expect(result.reason).toContain('15+ menit');
    });
  });

  describe('evaluasiHysteresis', () => {
    test('Immediate upgrade', () => {
      const result = evaluasiHysteresis('HEALTHY', 'CRITICAL', [], new Date());
      expect(result.shouldChange).toBe(true);
      expect(result.newStatus).toBe('CRITICAL');
      expect(result.reason).toContain('upgrade');
    });

    test('Downgrade with sufficient samples', () => {
      const recentStatuses = ['CRITICAL', 'CRITICAL', 'WARNING'];
      const lastChange = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago

      const result = evaluasiHysteresis('CRITICAL', 'WARNING', recentStatuses, lastChange);
      expect(result.shouldChange).toBe(true);
      expect(result.newStatus).toBe('WARNING');
    });

    test('Downgrade blocked by time delay', () => {
      const recentStatuses = ['CRITICAL', 'CRITICAL', 'WARNING'];
      const lastChange = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      const result = evaluasiHysteresis('CRITICAL', 'WARNING', recentStatuses, lastChange);
      expect(result.shouldChange).toBe(false);
      expect(result.reason).toContain('delay minimum');
    });

    test('Downgrade blocked by insufficient samples', () => {
      const recentStatuses = ['CRITICAL', 'WARNING'];
      const lastChange = new Date(Date.now() - 20 * 60 * 1000);

      const result = evaluasiHysteresis('CRITICAL', 'WARNING', recentStatuses, lastChange);
      expect(result.shouldChange).toBe(false);
      expect(result.reason).toContain('Belum cukup samples');
    });
  });

  describe('STATUS_LEVELS', () => {
    test('Status levels are properly defined', () => {
      expect(STATUS_LEVELS.HEALTHY.level).toBe(1);
      expect(STATUS_LEVELS.DANGER.level).toBe(4);
      expect(STATUS_LEVELS.OFFLINE.level).toBe(5);

      expect(STATUS_LEVELS.HEALTHY.emoji).toBe('🟢');
      expect(STATUS_LEVELS.DANGER.emoji).toBe('🔴');
    });
  });
});