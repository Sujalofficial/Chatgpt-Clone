'use strict';

const { Groq } = require('groq-sdk');

/**
 * groqService.js
 * Groq logic with clean error handling and model fallback
 */
class GroqService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in .env');
        }
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        this.primaryModel  = 'llama-3.3-70b-versatile';
        this.fallbackModel = 'llama-3.1-8b-instant'; // Much higher quota limit
    }

    async generateStream(messages, systemPrompt, options = {}, retryCount = 0) {
        const { signal, temperature, maxTokens } = options;
        const model = retryCount === 0 ? this.primaryModel : this.fallbackModel;

        console.log(`[GroqService] Attempt ${retryCount + 1}: Calling ${model}...`);

        try {
            return await this.groq.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                stream: true,
                temperature: temperature || 0.7,
                max_tokens: maxTokens || 4096,
                top_p: 0.9,
            }, { signal });
        } catch (err) {
            if (err.name === 'AbortError') throw err;

            const isRateLimit = err.status === 429 || err.message?.includes('rate_limit') || err.message?.includes('Rate limit');
            const isTokenLimit = err.message?.includes('tokens per day') || err.message?.includes('TPD');

            if ((isRateLimit || isTokenLimit) && retryCount === 0) {
                console.warn(`[GroqService] ⚠️ Rate/Token limit on ${model}. Falling back to ${this.fallbackModel}...`);
                await new Promise(resolve => setTimeout(resolve, 500));
                return this.generateStream(messages, systemPrompt, options, 1);
            }

            // Clean user-facing error messages
            if (isRateLimit || isTokenLimit) {
                const retryMatch = err.message?.match(/Please try again in ([^.]+)\./);
                const retryIn = retryMatch ? ` Try again in ${retryMatch[1]}.` : '';
                throw new Error(`Groq rate limit reached for today.${retryIn} Consider switching to Gemini.`);
            }

            // Strip raw JSON from other errors
            const clean = err.message?.split('{')[0].trim() || 'Groq API error';
            throw new Error(clean);
        }
    }
}


module.exports = new GroqService();
