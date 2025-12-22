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
  logger.info('Testing Generate Data Single Server');

  try {
    // Cari server pertama yang aktif
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      logger.warn('No active server found for testing');
      return;
    }

    logger.info(`Generating data for server: ${server.nama} (${server._id})`);

    const result = await generateDataMetrikServer(server._id);

    if (result.success) {
      logger.info('Data generated successfully', {
        condition: result.kondisi,
        healthStatus: result.statusKesehatan,
        cpu: result.data.cpu.persentase,
        memory: result.data.memori.persentase,
        disk: result.data.disk.persentase,
        latency: result.data.jaringan.latensiMs
      });
    } else {
      logger.error('Failed to generate data', { error: result.error });
    }

  } catch (error) {
    logger.error('Error testing single server', { error: error.message });
  }
}

/**
 * Test generate data untuk semua server
 */
async function testGenerateAllServers() {
  logger.info('Testing Generate Data All Servers');

  try {
    const result = await generateDataSemuaServer();

    logger.info('Batch generation completed', {
      totalServers: result.totalServers,
      successCount: result.results.filter(r => r.success).length,
      errorCount: result.results.filter(r => !r.success).length
    });

    if (result.results.length > 0) {
      const sampleResult = result.results[0];
      logger.info('Sample result', {
        server: sampleResult.data.cpu ? 'Valid' : 'Invalid',
        condition: sampleResult.kondisi,
        cpu: sampleResult.data.cpu?.persentase || 'N/A'
      });
    }

  } catch (error) {
    logger.error('Error testing all servers', { error: error.message });
  }
}

/**
 * Test force condition
 */
async function testForceCondition() {
  logger.info('Testing Force Server Condition');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      logger.warn('No active server found for testing');
      return;
    }

    logger.info(`Force server ${server.nama} to CRITICAL condition`);

    // Force ke critical
    forceServerCondition(server._id, 'CRITICAL');

    // Generate data
    const result = await generateDataMetrikServer(server._id);

    if (result.success) {
      logger.info('Critical data generated successfully', {
        condition: result.kondisi,
        cpu: result.data.cpu.persentase,
        memory: result.data.memori.persentase,
        disk: result.data.disk.persentase
      });

      // Validasi threshold
      const isValidCritical = (
        result.data.cpu.persentase >= 85 &&
        result.data.memori.persentase >= 90 &&
        result.data.disk.persentase >= 95 &&
        result.kondisi === 'CRITICAL'
      );

      logger.info('Validation result', {
        isValid: isValidCritical,
        expected: 'CRITICAL condition with high metrics',
        actual: `Condition: ${result.kondisi}, CPU: ${result.data.cpu.persentase}%, Memory: ${result.data.memori.persentase}%, Disk: ${result.data.disk.persentase}%`
      });
    }

  } catch (error) {
    logger.error('Error testing force condition', { error: error.message });
  }
}

/**
 * Test state persistence
 */
async function testStatePersistence() {
  logger.info('Testing State Persistence');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      logger.warn('No active server found for testing');
      return;
    }

    logger.info(`Testing state persistence for ${server.nama}`);

    // Reset state
    resetServerState(server._id);
    logger.info('State reset');

    // Generate beberapa data
    const iterations = [];
    for (let i = 0; i < 3; i++) {
      const result = await generateDataMetrikServer(server._id);
      iterations.push({
        iteration: i + 1,
        condition: result.kondisi,
        cpu: result.data.cpu.persentase
      });

      // Delay kecil
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info('State persistence test completed', { iterations });

  } catch (error) {
    logger.error('Error testing state persistence', { error: error.message });
  }
}

/**
 * Test data validation
 */
async function testDataValidation() {
  logger.info('Testing Data Validation');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      logger.warn('No active server found for testing');
      return;
    }

    logger.info(`Validating data for ${server.nama}`);

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
      const validationResults = validations.map(v => {
        const valid = v.value >= v.min && v.value <= v.max;
        if (!valid) allValid = false;
        return { field: v.field, value: v.value, valid };
      });

      logger.info('Range validation results', {
        overallValid: allValid,
        validations: validationResults
      });

      // Validasi kondisi vs threshold
      const kondisiExpected = result.kondisi;
      let kondisiValid = true;

      if (kondisiExpected === 'CRITICAL') {
        kondisiValid = data.cpu.persentase >= 85 && data.memori.persentase >= 90;
      } else if (kondisiExpected === 'WARNING') {
        kondisiValid = data.cpu.persentase >= 60 || data.memori.persentase >= 70;
      }

      logger.info('Condition validation', {
        condition: kondisiExpected,
        isValid: kondisiValid,
        cpu: data.cpu.persentase,
        memory: data.memori.persentase
      });

    } else {
      logger.warn('No data available for validation');
    }

  } catch (error) {
    logger.error('Error testing data validation', { error: error.message });
  }
}

/**
 * Test performance
 */
async function testPerformance() {
  logger.info('Testing Performance');

  try {
    const server = await Server.findOne({ statusAktif: true });
    if (!server) {
      logger.warn('No active server found for testing');
      return;
    }

    logger.info(`Performance test for ${server.nama}`);

    const iterations = 10;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await generateDataMetrikServer(server._id);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    const performanceMetrics = {
      iterations,
      totalTimeMs: totalTime,
      avgTimeMs: parseFloat(avgTime.toFixed(2)),
      ratePerSecond: parseFloat((1000 / avgTime).toFixed(2)),
      performanceOk: avgTime < 500
    };

    logger.info('Performance test results', performanceMetrics);

  } catch (error) {
    logger.error('Error testing performance', { error: error.message });
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  logger.info('Starting Generator Data Dummy Tests');

  try {
    // Connect to database if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monitoring-server');
      logger.info('Connected to database');
    }

    // Run all tests
    await testGenerateSingleServer();
    await testGenerateAllServers();
    await testForceCondition();
    await testStatePersistence();
    await testDataValidation();
    await testPerformance();

    logger.info('All tests completed successfully');

  } catch (error) {
    logger.error('Test runner failed', { error: error.message });
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
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