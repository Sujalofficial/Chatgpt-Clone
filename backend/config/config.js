const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().optional().transform(v => {
    if (!v) return v;
    // Aggressively find the start of the real URI and strip garbage
    const match = v.match(/(mongodb(?:\+srv)?:\/\/.+)/);
    return match ? match[1].trim() : v.trim();
  }),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters'),
  SESSION_SECRET: z.string().optional(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Production Upgrades
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  ENABLE_QUOTA: z.string().default('false').transform(v => v === 'true'),
  ENABLE_LOGGING: z.string().default('false').transform(v => v === 'true'),
  ENABLE_REDIS: z.string().default('false').transform(v => v === 'true'),
  DAILY_REQUEST_LIMIT: z.string().default('50').transform(Number),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().default('sandbox.smtp.mailtrap.io'),
  SMTP_PORT: z.string().default('2525').transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});


const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

const config = validateEnv();

module.exports = config;
