const OpenAI = require('openai');
const config = require('../config/config');
const { logger } = require('../utils/logger');

/**
 * services/openaiService.js
 * Comprehensive wrapper for OpenAI Chat Completion (Streaming)
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * generateStream
 * @param {Array} messages - [{role, content}]
 * @param {string} systemPrompt - system context
 * @param {object} options - { signal } for abortion
 */
const generateStream = async (messages, systemPrompt, options = {}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o', // Default to 4o for production readiness
      messages: chatMessages,
      stream: true,
    }, { signal: options.signal });

    return stream;
  } catch (err) {
    logger.error({ err: err.message }, 'OpenAI Service Failure');
    throw err;
  }
};

module.exports = { generateStream };
