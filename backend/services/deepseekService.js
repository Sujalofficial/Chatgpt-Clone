const axios = require('axios');
const config = require('../config/config');
const { logger } = require('../utils/logger');

/**
 * services/deepseekService.js
 * Wrapper for DeepSeek API. Note: DeepSeek uses OpenAI-compatible base URL.
 */

/**
 * generateStream
 * SSE generator for DeepSeek-style streaming
 */
const generateStream = async function* (messages, systemPrompt, options = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    logger.warn('DEEPSEEK_API_KEY is not configured — using production mock');
    yield "DeepSeek service is currently in maintenance or API key is not configured. Please switch to Gemini or Groq for real-time analysis.";
    return;
  }

  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.deepseek.com/chat/completions',
      data: {
        model: 'deepseek-chat',
        messages: chatMessages,
        stream: true,
      },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      signal: options.signal,
    });

    for await (const chunk of response.data) {
      if (options.signal?.aborted) break;
      
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          if (line.includes('[DONE]')) return;
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices?.(0)?.delta?.content;
            if (delta) yield delta;
          } catch (e) { /* skip partial JSON */ }
        }
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'DeepSeek Service Failure');
    throw err;
  }
};

module.exports = { generateStream };
