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

describe('startServer port fallback', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should try next port when initial port returns EACCES and then succeed', async () => {
    let callCount = 0;

    // Replace listen behavior to simulate EACCES on first call and success on second
    server.listen = function(port) {
      const self = this;
      callCount++;
      if (callCount === 1) {
        process.nextTick(() => {
          const err = new Error('EACCES: permission denied');
          err.code = 'EACCES';
          self.emit('error', err);
        });
      } else {
        // Simulate successful listening
        process.nextTick(() => {
          self.emit('listening');
        });
      }
      return self;
    };

    // startServer should resolve and bind to START_PORT + 1 (5002)
    const originalPort = process.env.PORT;
    process.env.PORT = '5001';

    await expect(startServer()).resolves.not.toThrow();

    process.env.PORT = originalPort;
  });
});