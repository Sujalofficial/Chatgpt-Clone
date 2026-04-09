const { logger } = require('../utils/logger');

/**
 * Standardized Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  
  // Log critical 500s
  if (status >= 500) {
    logger.error({ err: err.message, stack: err.stack, path: req.path }, 'Internal Server Error Encountered');
  } else {
    logger.warn({ err: err.message, path: req.path }, 'Client Request Issue');
  }

  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { _dbg: err.stack })
  });
};

module.exports = { errorHandler };
