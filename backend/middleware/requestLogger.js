const { logger } = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
    }, 'Request completed');
  });

  next();
};

module.exports = requestLogger;
