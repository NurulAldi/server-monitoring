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

describe('startServer error handling', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should reject when server listen emits EACCES', async () => {
    // Replace listen behavior to emit EACCES
    server.listen = function(port, cb) {
      process.nextTick(() => {
        const err = new Error('EACCES: permission denied');
        err.code = 'EACCES';
        server.emit('error', err);
      });
      if (typeof cb === 'function') cb();
    };

    await expect(startServer()).rejects.toHaveProperty('code', 'EACCES');
  });
});