// Standalone script to drop stale namaPengguna index (if present)
require('dotenv').config();
const { connectDatabase, tutupKoneksiDatabase } = require('../src/konfigurasi/database');
const { dropNamaPenggunaIndexIfExists } = require('../src/konfigurasi/migrations');

(async () => {
  try {
    await connectDatabase();
    await dropNamaPenggunaIndexIfExists();
    await tutupKoneksiDatabase();
    console.log('Migration script completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration script failed:', err);
    process.exit(1);
  }
})();
