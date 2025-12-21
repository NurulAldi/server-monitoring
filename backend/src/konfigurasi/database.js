// Konfigurasi koneksi database MongoDB
// Menggunakan Mongoose sebagai ODM untuk MongoDB

const mongoose = require('mongoose');

// Fungsi untuk menghubungkan ke database MongoDB
async function koneksiDatabase() {
  try {
    // Ambil URI database dari environment variable
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI tidak ditemukan di environment variable');
    }

    // Opsi koneksi untuk performa dan reliability
    const opsiKoneksi = {
      // Connection pool settings
      maxPoolSize: 10, // Maksimal 10 koneksi dalam pool
      serverSelectionTimeoutMS: 5000, // Timeout 5 detik untuk memilih server
      socketTimeoutMS: 45000, // Timeout 45 detik untuk socket

      // Retry settings
      retryWrites: true, // Retry operasi write jika gagal
      retryReads: true, // Retry operasi read jika gagal

      // Buffer settings
      bufferCommands: false, // Jangan buffer command jika disconnect
      bufferMaxEntries: 0, // Maksimal buffer entries
    };

    // Koneksi ke MongoDB
    await mongoose.connect(mongoUri, opsiKoneksi);

    console.log('✅ Database MongoDB berhasil terkoneksi');

    // Event listeners untuk monitoring koneksi
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose terkoneksi ke MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Error koneksi MongoDB:', error.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 Mongoose terputus dari MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('📊 Menutup koneksi MongoDB...');
      await mongoose.connection.close();
      console.log('📊 Koneksi MongoDB ditutup');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Gagal koneksi ke database:', error.message);
    process.exit(1); // Exit dengan error code 1
  }
}

// Fungsi untuk menutup koneksi database (untuk testing atau shutdown manual)
async function tutupKoneksiDatabase() {
  try {
    await mongoose.connection.close();
    console.log('📊 Koneksi database berhasil ditutup');
  } catch (error) {
    console.error('❌ Error menutup koneksi database:', error.message);
  }
}

// Export fungsi dan instance mongoose
module.exports = {
  koneksiDatabase,
  tutupKoneksiDatabase,
  mongoose // Export mongoose instance untuk digunakan di model
};