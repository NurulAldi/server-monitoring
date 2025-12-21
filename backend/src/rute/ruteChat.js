// Rute untuk endpoint chat AI
// Define routes untuk operasi chat dengan AI

const express = require('express');
const router = express.Router();

// Import kontroler dan middleware
const kontrolerChat = require('../kontroler/kontrolerChat');
const autentikasi = require('../middleware/autentikasi');
const {
  validasiChatAI
} = require('../middleware/validasi');

// Import rate limiter
const rateLimiter = require('../middleware/rateLimiter');

// Route untuk chat dengan AI
// POST /api/chat/tanya
router.post('/tanya',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterChat, // Rate limit khusus chat (lebih longgar dari auth)
  validasiChatAI, // Validasi input pertanyaan
  kontrolerChat.chatDenganAi
);

// Route untuk ambil riwayat chat
// GET /api/chat/histori
router.get('/histori',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  kontrolerChat.ambilRiwayatChat
);

// Route untuk hapus riwayat chat tertentu
// DELETE /api/chat/histori/:id
router.delete('/histori/:id',
  autentikasi.verifikasiToken, // Middleware autentikasi
  rateLimiter.limiterGeneral, // Rate limit umum
  kontrolerChat.hapusRiwayatChat
);

// Export router
module.exports = router;