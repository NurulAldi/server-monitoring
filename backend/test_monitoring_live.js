// Test script untuk Monitoring Live Service
// Demonstrasi manual override untuk alert testing

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace dengan token valid

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Test 1: Get current health status
 */
async function testGetHealth() {
  console.log('\n=== Test 1: Get Health Status ===');
  try {
    const response = await api.get('/api/monitoring-live/health');
    console.log('✅ Success:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test 2: Inject danger values (CPU 99%, Temp 90°C)
 */
async function testInjectDanger() {
  console.log('\n=== Test 2: Inject Danger Values ===');
  try {
    const response = await api.post('/api/monitoring-live/override', {
      serverId: 'test-server-1',
      cpu: 99,
      temperature: 90,
      ram: 95,
      lockDuration: 120000 // 2 minutes
    });
    console.log('✅ Override Applied:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test 3: Get health after override
 */
async function testGetHealthAfterOverride() {
  console.log('\n=== Test 3: Get Health After Override ===');
  try {
    const response = await api.get('/api/monitoring-live/health?serverId=test-server-1');
    console.log('✅ Current State:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test 4: Clear override
 */
async function testClearOverride() {
  console.log('\n=== Test 4: Clear Override ===');
  try {
    const response = await api.delete('/api/monitoring-live/override/test-server-1');
    console.log('✅ Override Cleared:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test 5: Get service status
 */
async function testGetStatus() {
  console.log('\n=== Test 5: Get Service Status ===');
  try {
    const response = await api.get('/api/monitoring-live/status');
    console.log('✅ Service Status:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Demo Scenario: Professor Presentation
 */
async function demoScenario() {
  console.log('\n\n========================================');
  console.log('DEMO SCENARIO: Professor Presentation');
  console.log('========================================');

  // Step 1: Show normal state
  console.log('\n📊 Step 1: Show normal state');
  await testGetHealth();
  await sleep(2000);

  // Step 2: Inject critical values RIGHT BEFORE showing dashboard
  console.log('\n🚨 Step 2: Inject critical values');
  await testInjectDanger();
  await sleep(2000);

  // Step 3: Get current state (should show danger values)
  console.log('\n📊 Step 3: Dashboard now shows alerts');
  await testGetHealthAfterOverride();
  await sleep(2000);

  // Step 4: Get service status
  console.log('\n🔧 Step 4: Check service status');
  await testGetStatus();
  await sleep(2000);

  // Step 5: Clear override after demo
  console.log('\n✨ Step 5: Clear override after demo');
  await testClearOverride();
  await sleep(2000);

  // Step 6: Verify back to automated
  console.log('\n📊 Step 6: Verify automated loop resumed');
  await testGetHealthAfterOverride();

  console.log('\n========================================');
  console.log('✅ Demo scenario completed!');
  console.log('========================================\n');
}

/**
 * Test threshold levels
 */
async function testThresholds() {
  console.log('\n\n========================================');
  console.log('TEST: Alert Threshold Levels');
  console.log('========================================');

  const thresholds = [
    { name: 'Normal', cpu: 50 },
    { name: 'Warning', cpu: 75 },
    { name: 'Critical', cpu: 90 },
    { name: 'Danger', cpu: 99 }
  ];

  for (const threshold of thresholds) {
    console.log(`\n🧪 Testing ${threshold.name} threshold (CPU: ${threshold.cpu}%)`);
    try {
      await api.post('/api/monitoring-live/override', {
        serverId: 'test-server-1',
        cpu: threshold.cpu,
        lockDuration: 30000 // 30 seconds
      });
      console.log(`✅ ${threshold.name} level applied`);
      await sleep(5000); // Wait 5 seconds
    } catch (error) {
      console.error(`❌ Error:`, error.response?.data || error.message);
    }
  }

  console.log('\n========================================');
  console.log('✅ Threshold testing completed!');
  console.log('========================================\n');
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
async function main() {
  console.log('🚀 Starting Monitoring Live Service Tests\n');
  console.log('Base URL:', BASE_URL);
  console.log('Make sure backend server is running!\n');

  // Run demo scenario
  await demoScenario();

  // Optional: Run threshold tests
  // await testThresholds();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testGetHealth,
  testInjectDanger,
  testGetHealthAfterOverride,
  testClearOverride,
  testGetStatus,
  demoScenario,
  testThresholds
};
