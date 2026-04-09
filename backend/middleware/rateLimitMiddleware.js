const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redis } = require('../utils/redisClient');
const config = require('../config/config');
const { logger } = require('../utils/logger');

const getRateLimiter = (options) => {
  const store = (config.ENABLE_REDIS && redis) 
    ? new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: `rl:${options.prefix || 'gen'}:`,
      })
    : undefined; // Falls back to MemoryStore automatically

  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    max: options.max || 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    validate: { xForwardedForHeader: false }, // Silences the IPv6 configuration warning
    handler: (req, res) => {

      logger.warn({ userId: req.user?.id, ip: req.ip }, 'Rate limit exceeded');
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait a moment before sending more messages.'
      });
    },
    store,
  });
};

module.exports = { getRateLimiter };
