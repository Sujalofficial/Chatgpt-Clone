const pino = require('pino');
const Sentry = require('@sentry/node');
const config = require('../config/config');

// Initialize Sentry if DSN is provided
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
});

const logger = pino(
  {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    enabled: config.ENABLE_LOGGING !== false,
  },
  config.NODE_ENV === 'production' ? undefined : transport
);

module.exports = {
  logger,
  Sentry,
};
