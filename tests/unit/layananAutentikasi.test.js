const layananAutentikasi = require('../../backend/src/layanan/layananAutentikasi');
const Pengguna = require('../../backend/src/model/Pengguna');

describe('Layanan Autentikasi', () => {
  beforeEach(async () => {
    await Pengguna.deleteMany({});
  });

  test('registrasi -> login succeeds with correct password and fails with wrong password', async () => {
    const email = `test+${Date.now()}@example.com`;
    const kataSandi = 'Password123!';

    const reg = await layananAutentikasi.registrasi(email, kataSandi);
    expect(reg).toHaveProperty('pengguna');
    expect(reg.pengguna).toHaveProperty('email', email.toLowerCase());

    // Successful login
    const loginResult = await layananAutentikasi.login(email, kataSandi);
    expect(loginResult).toHaveProperty('token');
    expect(loginResult).toHaveProperty('pengguna');

    // Failed login with wrong password
    await expect(layananAutentikasi.login(email, 'wrongpass')).rejects.toThrow('Email atau password salah');
  });
});