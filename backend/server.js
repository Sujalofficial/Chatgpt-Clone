const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const passport = require('passport');
require('./config/passport');

// Prevent Vercel AI SDK unhandled internal rejections (from 429 rate limits) from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err.stack || err);
});

const config = require('./config/config');

const { Sentry, logger } = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Sentry Request Handler (Must be the first middleware)
if (config.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

app.set('trust proxy', 1);

/* ─── Middleware ──────────────────────────────────────────── */
app.use(requestLogger);
app.use(cors({ origin: [config.CLIENT_URL], credentials: true }));

app.use(express.json());

// Pure stateless Passport integration — no sessions
app.use(passport.initialize());
app.use(rateLimiter);

/* ─── Routes ──────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // For passport callbacks /auth/google
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

/* ─── Error handler (must be last) ───────────────────────── */
if (config.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(errorHandler);


/* ─── DB & Start ──────────────────────────────────────────── */
const PORT = config.PORT;

const start = async () => {
  try {
    if (config.MONGO_URI) {
      const cleanUri = config.MONGO_URI.trim();
      console.log(`🔍 DEBUG: Connection string starts with: "${cleanUri.substring(0, 10)}..."`);
      await mongoose.connect(cleanUri);
      console.log('✅ MongoDB connected');
    } else {
      console.log('⚠️  MONGO_URI not set — running without DB');
    }
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`));
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
};

start();

