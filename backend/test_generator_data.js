// Test Generator Data Dummy Health Server
// File untuk testing implementasi generator data metrik

const mongoose = require('mongoose');
const { generateDataMetrikServer, generateDataSemuaServer, forceServerCondition, resetServerState } = require('./src/layanan/layananGeneratorData');
const Server = require('./src/model/Server');
const Metrik = require('./src/model/Metrik');
const { logger } = require('./src/utilitas/logger');

/**
 * Test generate data untuk satu server
 */
async function testGenerateSingleServer() {
  console.log('\n🧪 Testing Generate Data Single Server');

  try {
    // Cari server pertama yang aktif
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      console.log('❌ Tidak ada server aktif untuk testing');
      return;
    }

    console.log(`📊 Generating data untuk server: ${server.nama} (${server._id})`);

    const result = await generateDataMetrikServer(server._id);

    if (result.success) {
      console.log('✅ Data berhasil dihasilkan');
      console.log(`   - Kondisi: ${result.kondisi}`);
      console.log(`   - Status: ${result.statusKesehatan}`);
      console.log(`   - CPU: ${result.data.cpu.persentase}%`);
      console.log(`   - Memory: ${result.data.memori.persentase}%`);
      console.log(`   - Disk: ${result.data.disk.persentase}%`);
      console.log(`   - Latency: ${result.data.jaringan.latensiMs}ms`);
    } else {
      console.log('❌ Gagal generate data');
    }

  } catch (error) {
    console.error('❌ Error testing single server:', error.message);
  }
}

/**
 * Test generate data untuk semua server
 */
async function testGenerateAllServers() {
  console.log('\n🧪 Testing Generate Data All Servers');

  try {
    const result = await generateDataSemuaServer();

    console.log(`📊 Batch generation completed:`);
    console.log(`   - Total servers: ${result.totalServers}`);
    console.log(`   - Success: ${result.results.filter(r => r.success).length}`);
    console.log(`   - Errors: ${result.results.filter(r => !r.success).length}`);

    if (result.results.length > 0) {
      const sampleResult = result.results[0];
      console.log(`\n📈 Sample result:`);
      console.log(`   - Server: ${sampleResult.data.cpu ? 'Valid' : 'Invalid'}`);
      console.log(`   - Kondisi: ${sampleResult.kondisi}`);
      console.log(`   - CPU: ${sampleResult.data.cpu?.persentase || 'N/A'}%`);
    }

  } catch (error) {
    console.error('❌ Error testing all servers:', error.message);
  }
}

/**
 * Test force condition
 */
async function testForceCondition() {
  console.log('\n🧪 Testing Force Server Condition');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      console.log('❌ Tidak ada server aktif untuk testing');
      return;
    }

    console.log(`🔧 Force server ${server.nama} ke kondisi CRITICAL`);

    // Force ke critical
    forceServerCondition(server._id, 'CRITICAL');

    // Generate data
    const result = await generateDataMetrikServer(server._id);

    if (result.success) {
      console.log('✅ Data critical berhasil dihasilkan');
      console.log(`   - Kondisi: ${result.kondisi} (harus CRITICAL)`);
      console.log(`   - CPU: ${result.data.cpu.persentase}% (harus > 85%)`);
      console.log(`   - Memory: ${result.data.memori.persentase}% (harus > 90%)`);
      console.log(`   - Disk: ${result.data.disk.persentase}% (harus > 95%)`);

      // Validasi threshold
      const isValidCritical = (
        result.data.cpu.persentase >= 85 &&
        result.data.memori.persentase >= 90 &&
        result.data.disk.persentase >= 95 &&
        result.kondisi === 'CRITICAL'
      );

      console.log(`   - Validasi: ${isValidCritical ? '✅ PASSED' : '❌ FAILED'}`);
    }

  } catch (error) {
    console.error('❌ Error testing force condition:', error.message);
  }
}

/**
 * Test state persistence
 */
async function testStatePersistence() {
  console.log('\n🧪 Testing State Persistence');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      console.log('❌ Tidak ada server aktif untuk testing');
      return;
    }

    console.log(`🔄 Testing state persistence untuk ${server.nama}`);

    // Reset state
    resetServerState(server._id);
    console.log('   - State direset');

    // Generate beberapa data
    for (let i = 0; i < 3; i++) {
      const result = await generateDataMetrikServer(server._id);
      console.log(`   - Iteration ${i + 1}: ${result.kondisi} (${result.data.cpu.persentase}% CPU)`);

      // Delay kecil
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ State persistence test completed');

  } catch (error) {
    console.error('❌ Error testing state persistence:', error.message);
  }
}

/**
 * Test data validation
 */
async function testDataValidation() {
  console.log('\n🧪 Testing Data Validation');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      console.log('❌ Tidak ada server aktif untuk testing');
      return;
    }

    console.log(`🔍 Validating data untuk ${server.nama}`);

    const result = await generateDataMetrikServer(server._id);

    if (result.success) {
      const data = result.data;

      // Validasi range
      const validations = [
        { field: 'CPU %', value: data.cpu.persentase, min: 0, max: 100 },
        { field: 'Memory %', value: data.memori.persentase, min: 0, max: 100 },
        { field: 'Disk %', value: data.disk.persentase, min: 0, max: 100 },
        { field: 'Latency ms', value: data.jaringan.latensiMs, min: 0, max: 10000 },
        { field: 'Load Average', value: data.sistemOperasi.bebanRataRata['1menit'], min: 0, max: 100 },
        { field: 'Throughput Mbps', value: data.jaringan.downloadMbps, min: 0, max: 1000 },
        { field: 'Packet Loss %', value: data.jaringan.paketHilangPersen, min: 0, max: 100 },
        { field: 'Processes', value: data.sistemOperasi.prosesAktif, min: 0, max: 2000 },
        { field: 'Connections', value: data.jaringan.koneksiAktif, min: 0, max: 5000 }
      ];

      let allValid = true;
      validations.forEach(v => {
        const valid = v.value >= v.min && v.value <= v.max;
        console.log(`   - ${v.field}: ${v.value} ${valid ? '✅' : '❌'}`);
        if (!valid) allValid = false;
      });

      console.log(`\n📊 Overall validation: ${allValid ? '✅ PASSED' : '❌ FAILED'}`);

      // Validasi kondisi vs threshold
      const kondisiExpected = result.kondisi;
      let kondisiValid = true;

      if (kondisiExpected === 'CRITICAL') {
        kondisiValid = data.cpu.persentase >= 85 && data.memori.persentase >= 90;
      } else if (kondisiExpected === 'WARNING') {
        kondisiValid = data.cpu.persentase >= 60 || data.memori.persentase >= 70;
      }

      console.log(`🔍 Kondisi validation: ${kondisiValid ? '✅ PASSED' : '❌ FAILED'}`);

    } else {
      console.log('❌ Tidak ada data untuk divalidasi');
    }

  } catch (error) {
    console.error('❌ Error testing data validation:', error.message);
  }
}

/**
 * Test performance
 */
async function testPerformance() {
  console.log('\n🧪 Testing Performance');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      console.log('❌ Tidak ada server aktif untuk testing');
      return;
    }

    console.log(`⚡ Performance test untuk ${server.nama}`);

    const iterations = 10;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await generateDataMetrikServer(server._id);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`📈 Performance results:`);
    console.log(`   - Iterations: ${iterations}`);
    console.log(`   - Total time: ${totalTime}ms`);
    console.log(`   - Average time: ${avgTime.toFixed(2)}ms per generation`);
    console.log(`   - Rate: ${(1000 / avgTime).toFixed(2)} generations per second`);

    // Performance threshold
    const performanceOk = avgTime < 500; // < 500ms per generation
    console.log(`   - Performance: ${performanceOk ? '✅ GOOD' : '❌ SLOW'}`);

  } catch (error) {
    console.error('❌ Error testing performance:', error.message);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Generator Data Dummy Tests');
  console.log('=====================================');

  try {
    // Connect to database if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monitoring-server');
      console.log('📡 Connected to database');
    }

    // Run all tests
    await testGenerateSingleServer();
    await testGenerateAllServers();
    await testForceCondition();
    await testStatePersistence();
    await testDataValidation();
    await testPerformance();

    console.log('\n🎉 All tests completed!');
    console.log('========================');

  } catch (error) {
    console.error('💥 Test runner failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📪 Database connection closed');
  }
}

// Export untuk penggunaan eksternal
module.exports = {
  runAllTests,
  testGenerateSingleServer,
  testGenerateAllServers,
  testForceCondition,
  testStatePersistence,
  testDataValidation,
  testPerformance
};

// Run tests jika file dijalankan langsung
if (require.main === module) {
  runAllTests();
}