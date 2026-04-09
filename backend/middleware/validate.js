const { z } = require('zod');

/* ─── AI Chat Validation ─── */
const chatStreamSchema = z.object({
  body: z.object({
    messages: z.array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1, 'Message content cannot be empty'),
      })
    ).min(1, 'At least one message is required'),
    model: z.enum(['gemini', 'groq', 'openai', 'deepseek'], {
      errorMap: () => ({ message: "Model must be 'gemini', 'groq', 'openai', or 'deepseek'" }),
    }),
    chatId: z.string().nullable().optional(),
    pdfText: z.string().max(100000, 'Context too long').nullable().optional(),
    file: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    intent: z.string().nullable().optional(),
  }),
});

/* ─── Auth Validation ─── */
const authSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  }),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const errorDetails = (err.errors || err.issues || []).map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Input validation failed',
      errors: errorDetails.length > 0 ? errorDetails : [{ message: err.message }],
    });
  }
};

module.exports = {
  validate,
  schemas: {
    chatStream: chatStreamSchema,
    auth: authSchema,
  },
};
