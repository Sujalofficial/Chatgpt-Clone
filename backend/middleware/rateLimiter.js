const rateLimit = require('express-rate-limit');

/**
 * Standard Rate Limiter
 * Limits requests to 50 per 15 minutes by default
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500,
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes'
    });
  }
});

/**
 * Stricter Limiter for AI Chat
 */
const chatRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { trustProxy: false },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Slow down! You are sending messages too fast.'
    });
  }
});

module.exports = { rateLimiter, chatRateLimiter };
