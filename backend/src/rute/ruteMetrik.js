const express = require('express');
const { HTTP_STATUS } = require('../utilitas/konstanta');
const { logSystemActivity } = require('../utilitas/logger');

const router = express.Router();

// Simple health/info endpoint for metrics
router.get('/', (req, res) => {
  logSystemActivity('METRICS_ROUTE_HIT', { path: req.path, method: req.method });
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Metrik route is active',
    timestamp: new Date().toISOString()
  });
});

// Example endpoint to return latest metrics (stubbed)
router.get('/latest', (req, res) => {
  logSystemActivity('METRICS_LATEST_REQUEST', { path: req.path });
  res.status(HTTP_STATUS.OK).json({ success: true, data: [] });
});

module.exports = router;