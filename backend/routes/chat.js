const express = require('express');
const router = express.Router();
const { streamChat, getChats, getChat, renameChat, deleteChat, togglePinChat } = require('../controllers/chatController');
const { verifyToken } = require('../middleware/verifyToken');
const { getRateLimiter } = require('../middleware/rateLimitMiddleware');
const quotaMiddleware = require('../middleware/quotaMiddleware');
const { validate, schemas } = require('../middleware/validate');

const redisChatRateLimiter = getRateLimiter({ prefix: 'chat', max: 20 });

// GET /api/chat/history - Get user chat history
router.get('/history', verifyToken, getChats);

// POST /api/chat/stream - real Groq + Gemini SSE stream
router.post('/stream', verifyToken, quotaMiddleware, redisChatRateLimiter, validate(schemas.chatStream), streamChat);


// Management
router.get('/:chatId', verifyToken, getChat);
router.put('/pin', verifyToken, togglePinChat);
router.put('/rename', verifyToken, renameChat);
router.delete('/:chatId', verifyToken, deleteChat);

// Legacy alias
router.post('/', verifyToken, quotaMiddleware, redisChatRateLimiter, validate(schemas.chatStream), streamChat);


module.exports = router;

