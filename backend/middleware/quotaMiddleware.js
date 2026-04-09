const Usage = require('../models/Usage');
const config = require('../config/config');
const { logger } = require('../utils/logger');

const quotaMiddleware = async (req, res, next) => {
  if (!config.ENABLE_QUOTA) return next();

  try {
    const userId = req.user?.id;
    if (!userId) return next();

    const today = new Date().toISOString().split('T')[0];

    // Find or create usage record for today
    let usage = await Usage.findOne({ userId, date: today });

    if (usage && usage.requestCount >= config.DAILY_REQUEST_LIMIT) {
      logger.warn({ userId, requestCount: usage.requestCount }, 'Daily quota exceeded');
      return res.status(429).json({ 
        error: 'Daily limit exceeded',
        message: 'You have reached your daily message limit. Please try again tomorrow.' 
      });
    }

    // Attach usage record to req for potential updates later
    req.userUsage = usage;
    next();
  } catch (err) {
    // FAIL OPEN: If DB is slow or fails, do not block the user
    logger.error({ err: err.message }, 'Quota check failed - failing open');
    next();
  }
};

module.exports = quotaMiddleware;
