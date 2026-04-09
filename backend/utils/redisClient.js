const Redis = require('ioredis');
const config = require('../config/config');
const { logger } = require('./logger');

let redis = null;

if (config.ENABLE_REDIS && config.REDIS_URL) {
  try {
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries - disabling Redis for this session');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });

    redis.on('error', (err) => {
      logger.error({ err: err.message }, 'Redis connection error');
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Could not initialize Redis client');
  }
}

// Wrapper to safely call redis methods with fail-open
const getCache = async (key) => {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    return null;
  }
};

const setCache = async (key, value, ttl = 300) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    // Ignore cache errors
  }
};

module.exports = {
  redis,
  getCache,
  setCache,
};
