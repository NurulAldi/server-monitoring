const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  jest.setTimeout(120000);

  // Reduce noisy download logs from mongodb-memory-server
  process.env.MONGOMS_DISABLE_DOWNLOAD_PROGRESS = 'true';

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'testrefresh';

  // Pin binary version to avoid unexpected long downloads and improve determinism
  mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.14' } });
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Make sure to stop MongoMemoryServer when tests complete
  global.__MONGO_SERVER__ = mongoServer;

  // Add afterAll cleanup
  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGO_SERVER__) {
      await global.__MONGO_SERVER__.stop();
    }
  });
};