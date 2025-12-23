const mongoose = require('mongoose');
const { logger, logSystemActivity } = require('../utilitas/logger');

async function dropNamaPenggunaIndexIfExists() {
  try {
    // Ensure mongoose connection is ready
    if (!mongoose.connection || mongoose.connection.readyState === 0) {
      logSystemActivity('MIGRATION_SKIPPED', { reason: 'no_db_connection', index: 'namaPengguna_1' });
      return;
    }

    const coll = mongoose.connection.collection('penggunas');
    if (!coll) {
      logSystemActivity('MIGRATION_SKIPPED', { reason: 'collection_not_found', collection: 'penggunas' });
      return;
    }

    const indexes = await coll.indexes();
    const idx = indexes.find(i => i.name === 'namaPengguna_1' || (i.key && i.key.namaPengguna));
    if (idx) {
      await coll.dropIndex(idx.name);
      logSystemActivity('MIGRATION_INDEX_DROPPED', { index: idx.name, collection: 'penggunas' });
      console.log(`✔ Dropped stale index ${idx.name} on penggunas`);
    } else {
      logSystemActivity('MIGRATION_NO_INDEX', { collection: 'penggunas', checkedIndex: 'namaPengguna_1' });
      console.log('No stale index namaPengguna_1 found');
    }
  } catch (err) {
    logger.logError('MIGRATION_DROP_INDEX_FAILED', err, { index: 'namaPengguna_1' });
    console.error('Failed to drop namaPengguna index:', err.message);
    throw err;
  }
}

module.exports = { dropNamaPenggunaIndexIfExists };
