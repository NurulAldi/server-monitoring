/**
 * Rute untuk AI Logging Analytics
 * Endpoint untuk evaluasi akademik efektivitas AI
 */

const express = require('express');
const router = express.Router();

// Import kontroler AI logging
const kontrolerAILogging = require('../kontroler/kontrolerAILogging');

// Semua route AI analytics memerlukan autentikasi dan role tertentu
// Routes didefinisikan di kontroler dengan middleware yang sesuai

// Gunakan kontroler untuk semua routes
router.use('/', kontrolerAILogging);

module.exports = router;