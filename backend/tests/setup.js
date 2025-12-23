// Jest setup file for test configuration
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

/**
 * Setup before all tests
 */
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Expose the URI and server to integration tests so they can reuse the same in-memory DB
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_SERVER__ = mongoServer;

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  // Stop the in-memory MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test utilities
global.testUtils = {
  // Helper to create test user
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    kataSandi: 'password123',
    jabatan: 'operator',
    ...overrides
  }),

  // Helper to create test server
  createTestServer: (overrides = {}) => ({
    nama: 'Test Server',
    jenisServer: 'web',
    ipAddress: '192.168.1.100',
    port: 80,
    statusAktif: true,
    ...overrides
  }),

  // Helper to generate valid JWT token
  generateTestToken: (payload = { userId: 'test-user-id', role: 'operator' }) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  }
};