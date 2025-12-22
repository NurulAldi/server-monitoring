const express = require('express');
const router = express.Router();
const { HTTP_STATUS } = require('../utilitas/konstanta');

// Placeholder konfigurasi routes
router.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Config routes placeholder' });
});

module.exports = router;