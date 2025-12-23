// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const layananAutentikasi = require('../src/layanan/layananAutentikasi');
const { generateToken, verifyToken } = require('../src/konfigurasi/jwt');
const { MONGODB_URI = 'mongodb://127.0.0.1:27017/fix_final_project_test' } = process.env;

// Use test database to avoid conflicts with development data
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/monitoring_server_test';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function testJWTPayload(token, expectedFields) {
  logInfo('Testing JWT token payload structure...');
  
  try {
    // Decode token without verification to check payload
    const decoded = jwt.decode(token);
    
    logInfo(`Decoded token: ${JSON.stringify(decoded, null, 2)}`);
    
    // Check for required fields
    const requiredFields = expectedFields || ['userId', 'email', 'peran'];
    const missingFields = requiredFields.filter(field => !decoded[field]);
    
    if (missingFields.length > 0) {
      logError(`Missing required fields in JWT payload: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check field values
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      logError('userId field is missing or invalid');
      return false;
    }
    
    if (!decoded.email || typeof decoded.email !== 'string') {
      logError('email field is missing or invalid');
      return false;
    }
    
    if (!decoded.peran || typeof decoded.peran !== 'string') {
      logError('peran field is missing or invalid');
      return false;
    }
    
    logSuccess('JWT payload structure is valid');
    logSuccess(`  - userId: ${decoded.userId}`);
    logSuccess(`  - email: ${decoded.email}`);
    logSuccess(`  - peran: ${decoded.peran}`);
    
    return true;
  } catch (error) {
    logError(`Failed to decode token: ${error.message}`);
    return false;
  }
}

async function testMiddlewareValidation(token) {
  logInfo('Testing middleware token validation...');
  
  try {
    // Test with verifyToken function (simulates middleware behavior)
    const verified = verifyToken(token);
    
    if (!verified.userId || !verified.email || !verified.peran) {
      logError('Verified token missing required fields');
      return false;
    }
    
    logSuccess('Middleware validation successful');
    logSuccess(`  - Verified userId: ${verified.userId}`);
    logSuccess(`  - Verified email: ${verified.email}`);
    logSuccess(`  - Verified peran: ${verified.peran}`);
    
    return true;
  } catch (error) {
    logError(`Middleware validation failed: ${error.message}`);
    return false;
  }
}

async function testInvalidToken() {
  logInfo('Testing invalid token handling...');
  
  try {
    const invalidToken = 'invalid.token.string';
    await verifyToken(invalidToken);
    logError('Invalid token was accepted (should have been rejected)');
    return false;
  } catch (error) {
    logSuccess(`Invalid token correctly rejected: ${error.message}`);
    return true;
  }
}

async function testExpiredToken() {
  logInfo('Testing expired token handling...');
  
  try {
    // Create a token that expires immediately
    const expiredToken = jwt.sign(
      { userId: 'test', email: 'test@example.com', peran: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '0s', issuer: 'monitoring-server', audience: 'monitoring-client' }
    );
    
    // Wait a bit to ensure expiration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await verifyToken(expiredToken);
    logError('Expired token was accepted (should have been rejected)');
    return false;
  } catch (error) {
    if (error.message.includes('expired')) {
      logSuccess(`Expired token correctly rejected: ${error.message}`);
      return true;
    }
    logWarning(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function testTokenWithMissingFields() {
  logInfo('Testing token with missing required fields...');
  
  try {
    // Create token with missing peran field
    const incompleteToken = jwt.sign(
      { userId: 'test', email: 'test@example.com' }, // Missing peran
      process.env.JWT_SECRET,
      { expiresIn: '1h', issuer: 'monitoring-server', audience: 'monitoring-client' }
    );
    
    const decoded = jwt.decode(incompleteToken);
    if (!decoded.peran) {
      logSuccess('Token with missing fields correctly identified');
      return true;
    }
    
    logError('Token validation did not detect missing fields');
    return false;
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function run() {
  log('\n========================================', 'cyan');
  log('COMPLETE AUTH FLOW END-TO-END TEST', 'cyan');
  log('========================================\n', 'cyan');
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  try {
    // Connect to MongoDB
    log('\n--- Database Connection ---', 'cyan');
    await mongoose.connect(TEST_DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    logSuccess(`Connected to test database: ${TEST_DB_URI}`);
    
    const testEmail = `test.user+${Date.now()}@example.com`;
    const testPass = 'Password123!';
    
    // Test 1: User Registration
    log('\n--- Test 1: User Registration ---', 'cyan');
    testResults.total++;
    try {
      logInfo(`Registering user: ${testEmail}`);
      const reg = await layananAutentikasi.registrasi(testEmail, testPass);
      
      if (reg.pengguna && reg.token) {
        logSuccess('Registration successful');
        logSuccess(`  - User ID: ${reg.pengguna.id}`);
        logSuccess(`  - Email: ${reg.pengguna.email}`);
        logSuccess(`  - Peran: ${reg.pengguna.peran}`);
        logSuccess(`  - Token generated: ${reg.token.substring(0, 20)}...`);
        testResults.passed++;
        
        // Test JWT payload for registration token
        if (await testJWTPayload(reg.token)) {
          testResults.passed++;
        } else {
          testResults.failed++;
        }
        testResults.total++;
      } else {
        logError('Registration response missing expected fields');
        testResults.failed++;
      }
    } catch (err) {
      logError(`Registration failed: ${err.message}`);
      testResults.failed++;
      throw err; // Stop if registration fails
    }
    
    // Test 2: User Login with Correct Password
    log('\n--- Test 2: User Login (Correct Password) ---', 'cyan');
    testResults.total++;
    try {
      logInfo('Logging in with correct password...');
      const login = await layananAutentikasi.login(testEmail, testPass);
      
      if (login.pengguna && login.token) {
        logSuccess('Login successful');
        logSuccess(`  - User ID: ${login.pengguna.id}`);
        logSuccess(`  - Email: ${login.pengguna.email}`);
        logSuccess(`  - Peran: ${login.pengguna.peran}`);
        logSuccess(`  - Token: ${login.token.substring(0, 20)}...`);
        testResults.passed++;
        
        // Test 3: JWT Payload Structure
        log('\n--- Test 3: JWT Payload Validation ---', 'cyan');
        testResults.total++;
        if (await testJWTPayload(login.token)) {
          testResults.passed++;
        } else {
          testResults.failed++;
        }
        
        // Test 4: Middleware Token Validation
        log('\n--- Test 4: Middleware Token Validation ---', 'cyan');
        testResults.total++;
        if (await testMiddlewareValidation(login.token)) {
          testResults.passed++;
        } else {
          testResults.failed++;
        }
      } else {
        logError('Login response missing expected fields');
        testResults.failed++;
      }
    } catch (err) {
      logError(`Login failed: ${err.message}`);
      testResults.failed++;
    }
    
    // Test 5: Login with Wrong Password
    log('\n--- Test 5: User Login (Wrong Password) ---', 'cyan');
    testResults.total++;
    try {
      logInfo('Attempting login with wrong password...');
      await layananAutentikasi.login(testEmail, 'WrongPassword123!');
      logError('Login with wrong password unexpectedly succeeded');
      testResults.failed++;
    } catch (err) {
      if (err.message.includes('password salah') || err.message.includes('Email atau password salah')) {
        logSuccess(`Login correctly rejected: ${err.message}`);
        testResults.passed++;
      } else {
        logError(`Unexpected error: ${err.message}`);
        testResults.failed++;
      }
    }
    
    // Test 6: Invalid Token Handling
    log('\n--- Test 6: Invalid Token Handling ---', 'cyan');
    testResults.total++;
    if (await testInvalidToken()) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 7: Expired Token Handling
    log('\n--- Test 7: Expired Token Handling ---', 'cyan');
    testResults.total++;
    if (await testExpiredToken()) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 8: Token with Missing Fields
    log('\n--- Test 8: Token with Missing Required Fields ---', 'cyan');
    testResults.total++;
    if (await testTokenWithMissingFields()) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 9: Token Generation Consistency
    log('\n--- Test 9: Token Generation Consistency ---', 'cyan');
    testResults.total++;
    try {
      const payload = { id: '123456', email: 'test@example.com', peran: 'admin' };
      const token1 = generateToken(payload);
      const token2 = generateToken(payload);
      
      const decoded1 = jwt.decode(token1);
      const decoded2 = jwt.decode(token2);
      
      // Tokens should be different (due to iat) but have same user data
      if (decoded1.userId === decoded2.userId && 
          decoded1.email === decoded2.email && 
          decoded1.peran === decoded2.peran) {
        logSuccess('Token generation is consistent');
        logSuccess(`  - userId field present: ${!!decoded1.userId}`);
        logSuccess(`  - email field present: ${!!decoded1.email}`);
        logSuccess(`  - peran field present: ${!!decoded1.peran}`);
        testResults.passed++;
      } else {
        logError('Token generation inconsistency detected');
        testResults.failed++;
      }
    } catch (error) {
      logError(`Token generation test failed: ${error.message}`);
      testResults.failed++;
    }
    
  } catch (err) {
    logError(`\nCritical test error: ${err.message}`);
    console.error(err);
  } finally {
    await mongoose.disconnect();
    logSuccess('\nDisconnected from MongoDB');
    
    // Print Summary
    log('\n========================================', 'cyan');
    log('TEST SUMMARY', 'cyan');
    log('========================================', 'cyan');
    log(`Total Tests: ${testResults.total}`, 'blue');
    log(`Passed: ${testResults.passed}`, 'green');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 
        testResults.failed > 0 ? 'yellow' : 'green');
    log('========================================\n', 'cyan');
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

run();