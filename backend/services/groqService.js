'use strict';

const { Groq } = require('groq-sdk');

/**
 * groqService.js
 * Strictly isolated Groq logic
 */
class GroqService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in .env');
        }
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    async generateStream(messages, systemPrompt, options = {}) {
        const { signal, temperature, maxTokens } = options;
        console.log(`[GroqService] Request with model: llama-3.3-70b-versatile`);
        
        return await this.groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            stream: true,
            temperature: temperature || 0.7,
            max_tokens: maxTokens || 4096,
            top_p: 0.9,
        }, { signal }); // Pass AbortSignal here
    }
}


module.exports = new GroqService();
