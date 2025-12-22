const db = require('../../src/konfigurasi/database');

describe('Database configuration exports', () => {
  test('should export connectDatabase alias', () => {
    expect(typeof db.connectDatabase).toBe('function');
    expect(db.connectDatabase).toBe(db.koneksiDatabase);
  });

  test('should export function to close connection', () => {
    expect(typeof db.tutupKoneksiDatabase).toBe('function');
    expect(typeof db.closeDatabaseConnection).toBe('function');
  });
});