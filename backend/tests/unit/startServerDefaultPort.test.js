jest.mock('../../src/konfigurasi/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(),
  tutupKoneksiDatabase: jest.fn().mockResolvedValue()
}));

jest.mock('../../src/penjadwal/penjadwalGeneratorData', () => ({
  inisialisasiPenjadwal: jest.fn()
}));

jest.mock('../../src/penjadwal/penjadwalAgregasiMetrik', () => ({
  start: jest.fn().mockResolvedValue(),
  stop: jest.fn()
}));

jest.mock('../../src/layanan/layananStatusServer', () => ({
  start: jest.fn().mockResolvedValue(),
  stop: jest.fn(),
  setSocketIO: jest.fn()
}));

jest.mock('../../src/layanan/layananAlert', () => ({
  buatKondisiAlertDefault: jest.fn().mockResolvedValue([]),
  setSocketIO: jest.fn()
}));

const { server, startServer } = require('../../src/server');

describe('startServer default port behavior', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should use default START_PORT 5001 when PORT env is not set', async () => {
    const originalPort = process.env.PORT;
    delete process.env.PORT;

    let attemptedPort = null;

    server.listen = function(port) {
      attemptedPort = port;
      // Simulate successful listening
      process.nextTick(() => this.emit('listening'));
      return this;
    };

    await expect(startServer()).resolves.not.toThrow();
    expect(attemptedPort).toBe(5001);

    process.env.PORT = originalPort;
  });
});