// Integration tests for authentication endpoints
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../src/server');
const Pengguna = require('../../src/model/Pengguna');

let mongoServer; // only populated if this test creates a dedicated in-memory server (fallback)

describe('Authentication Endpoints Integration Tests', () => {
  let server;
  let agent;

  beforeAll(async () => {
    // Prefer reusing the shared in-memory DB from global setup when available
    let mongoUri = global.__MONGO_URI__;

    // If not available, create a dedicated in-memory DB for this suite
    if (!mongoUri) {
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    // Ensure previous connections are closed before connecting to the test DB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to test database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Start server
    server = app.listen(0); // Use random available port
    agent = request.agent(server);
  });

  afterAll(async () => {
    // Close server
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }

    // If this suite created its own in-memory server, fully stop and disconnect.
    if (mongoServer) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      await mongoServer.stop();
    } else {
      // We reused the global in-memory DB; just clear collections to avoid side effects
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Pengguna.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        kataSandi: 'Password123',
        konfirmasiKataSandi: 'Password123'
      };

      const response = await agent
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.requiresVerification).toBe(true);
    });

    test('should reject registration with existing email', async () => {
      // Create existing user
      const existingUser = new Pengguna({
        email: 'existing@example.com',
        kataSandiHash: 'hashedpassword',
        peran: 'user',
        statusAktif: true,
        emailTerverifikasi: true
      });
      await existingUser.save();

      const userData = {
        email: 'existing@example.com', // Same email
        kataSandi: 'Password123',
        konfirmasiKataSandi: 'Password123'
      };

      const response = await agent
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email sudah terdaftar');
    });

    test('should reject registration with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        kataSandi: 'weak',
        konfirmasiKataSandi: 'different'
      };

      const response = await agent
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('details');
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    test('should return 500 if a stale unique namaPengguna index causes duplicate-key', async () => {
      // Create a unique index on namaPengguna to simulate legacy/stale index
      await Pengguna.collection.createIndex({ namaPengguna: 1 }, { unique: true, name: 'namaPengguna_1' });

      try {
        // Insert one user without namaPengguna
        const first = new Pengguna({ email: 'dup1@example.com', kataSandiHash: 'hash', peran: 'user', statusAktif: true, emailTerverifikasi: true });
        await first.save();

        // Attempt to register another user (will cause duplicate key on namaPengguna if index exists)
        const userData = {
          email: 'dup2@example.com',
          kataSandi: 'Password123',
          konfirmasiKataSandi: 'Password123'
        };

        const res = await agent
          .post('/api/auth/register')
          .send(userData)
          .expect(500);

        expect(res.body.success).toBe(false);
        expect(res.body.error).toHaveProperty('message');
        expect(res.body.error.message).toMatch(/konfigurasi tidak konsisten|hubungi administrator/i);
      } finally {
        // Cleanup index regardless of test outcome
        try { await Pengguna.collection.dropIndex('namaPengguna_1'); } catch (e) { /* ignore */ }
      }
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await require('bcrypt').hash('Password123', 12);
      testUser = new Pengguna({
        email: 'test@example.com',
        kataSandiHash: hashedPassword,
        peran: 'user',
        statusAktif: true,
        emailTerverifikasi: true
      });
      await testUser.save();
    });

    test('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        kataSandi: 'Password123'
      };

      const response = await agent
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    test('should reject login with wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        kataSandi: 'WrongPassword123'
      };

      const response = await agent
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email atau password salah');
    });

    test('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        kataSandi: 'Password123'
      };

      const response = await agent
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email atau password salah');
    });

    test('should reject login for inactive account', async () => {
      // Make user inactive
      testUser.statusAktif = false;
      await testUser.save();

      const loginData = {
        email: 'test@example.com',
        kataSandi: 'Password123'
      };

      const response = await agent
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Akun belum diaktifkan');
    });

    test('should login successfully even if namaPengguna is missing and not fail on save', async () => {
      // Create a user record without namaPengguna to simulate legacy/missing field
      const hashedPassword = await require('bcrypt').hash('Password123', 12);
      const legacyUser = new Pengguna({
        email: 'legacy@example.com',
        kataSandiHash: hashedPassword,
        peran: 'user',
        statusAktif: true,
        emailTerverifikasi: true
      });
      await legacyUser.save();

      const loginData = {
        email: 'legacy@example.com',
        kataSandi: 'Password123'
      };

      const response = await agent
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(loginData.email);

      // Ensure the user document still doesn't require namaPengguna
      const reloaded = await Pengguna.findById(legacyUser._id);
      expect(reloaded).toBeTruthy();
      expect(reloaded.namaPengguna).toBeUndefined();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let testUser;
    let verificationToken;

    beforeEach(async () => {
      // Create a test user with verification token
      const jwt = require('jsonwebtoken');
      verificationToken = jwt.sign(
        { email: 'test@example.com', type: 'email_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      testUser = new Pengguna({
        email: 'test@example.com',
        kataSandiHash: 'hashedpassword',
        peran: 'user',
        statusAktif: false,
        emailTerverifikasi: false,
        tokenVerifikasi: verificationToken
      });
      await testUser.save();
    });

    test('should verify email successfully', async () => {
      const response = await agent
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email berhasil diverifikasi');

      // Check if user was updated in database
      const updatedUser = await Pengguna.findById(testUser._id);
      expect(updatedUser.emailTerverifikasi).toBe(true);
      expect(updatedUser.statusAktif).toBe(true);
      expect(updatedUser.tokenVerifikasi).toBeNull();
    });

    test('should reject invalid token', async () => {
      const response = await agent
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Token verifikasi tidak valid atau sudah expired');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create a valid refresh token
      const jwt = require('jsonwebtoken');
      const userId = new mongoose.Types.ObjectId();
      refreshToken = jwt.sign(
        { userId, sessionId: 'test-session' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });

    test('should refresh token successfully', async () => {
      const response = await agent
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.tokenType).toBe('Bearer');
      expect(response.body.data.expiresIn).toBe(900);
    });

    test('should reject invalid refresh token', async () => {
      const response = await agent
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/pengguna/logout', () => {
    test('should return 200 even when unauthenticated (allow clearing cookie)', async () => {
      const response = await agent
        .post('/api/pengguna/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/logout|berhasil|success/i);
    });

    test('should clear auth_token cookie and make profile inaccessible after logout', async () => {
      // Create user and generate a valid JWT token to avoid rate-limiter on login endpoint
      const jwt = require('jsonwebtoken')
      const bcrypt = require('bcrypt')
      const password = 'Password123'
      const hashed = await bcrypt.hash(password, 12)

      const user = new Pengguna({
        email: 'logouttest@example.com',
        kataSandiHash: hashed,
        peran: 'user',
        statusAktif: true,
        emailTerverifikasi: true
      })
      await user.save()

      // Generate token and set cookie on requests (simulate logged-in client)
      const token = jwt.sign(
        { userId: user._id.toString(), id: user._id.toString(), email: user.email, peran: user.peran },
        process.env.JWT_SECRET,
        { expiresIn: '24h', issuer: 'monitoring-server', audience: 'monitoring-client' }
      )

      // Self-verify generated token to ensure it is valid for server verification
      try {
        jwt.verify(token, process.env.JWT_SECRET, { issuer: 'monitoring-server', audience: 'monitoring-client' })
      } catch (err) {
        console.error('Token fails local verification:', err.message)
        throw err
      }

      // Confirm token is valid via Authorization header before logout
      const profileAuth = await agent
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      expect(profileAuth.body.success).toBe(true)

      // Perform logout which should clear the cookie (client would process Set-Cookie and drop it)
      const logoutRes = await agent
        .post('/api/pengguna/logout')
        .set('Cookie', `auth_token=${token}`)
        .expect(200)
      expect(logoutRes.body.success).toBe(true)

      // Verify logout response included a clearing Set-Cookie header for auth_token
      const logoutSetCookie = logoutRes.headers['set-cookie']
      expect(Array.isArray(logoutSetCookie)).toBe(true)
      const cleared = logoutSetCookie.find((c) => c.includes('auth_token=') && (c.includes('Expires=') || c.includes('Max-Age=0')))
      expect(cleared).toBeTruthy()

      // Subsequent profile access without any auth/cookies should be unauthorized (401)
      const profileAfter = await agent
        .get('/api/pengguna/profil')
        .expect(401)

      expect(profileAfter.body.success).toBe(false)
    })
  });

  describe('GET /api/auth/profile', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      // Create test user
      testUser = new Pengguna({
        email: 'test@example.com',
        kataSandiHash: 'hashedpassword',
        peran: 'user',
        statusAktif: true,
        emailTerverifikasi: true
      });
      await testUser.save();

      // Generate access token
      const jwt = require('jsonwebtoken');
      accessToken = jwt.sign(
        {
          userId: testUser._id,
          email: testUser.email,
          role: testUser.peran
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
    });

    test('should get user profile with valid token', async () => {
      const response = await agent
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser._id.toString());
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('kataSandiHash');
    });

    test('should reject profile access without token', async () => {
      const response = await agent
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject profile access with invalid token', async () => {
      const response = await agent
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});