'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * geminiService.js
 * Optimized for official Google Generative AI SDK with 429 (Quota) handling
 */
class GeminiService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            console.warn('[GeminiService] ⚠️  No Google API key found in .env!');
        } else {
            console.log('[GeminiService] ✅ Official SDK Ready.');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        
        // Use the requested 2.5 flash as primary
        this.primaryModel  = 'gemini-2.5-flash';
        this.fallbackModel = 'gemini-2.5-flash-lite';
        this.lastResort    = 'gemini-2.5-pro';
    }

    /**
     * Helper to prune message history to save tokens and prevent quota hits
     */
    pruneMessages(messages, maxCount = 10) {
        if (messages.length <= maxCount) return messages;
        // Always keep the first message (context) and the last few messages
        return [messages[0], ...messages.slice(-(maxCount - 1))];
    }

    async generateStreamWithRetry(messages, systemPrompt, options = {}, retryCount = 0) {
        const modelName = retryCount === 0 ? this.primaryModel : (retryCount === 1 ? this.fallbackModel : this.lastResort);
        const { signal } = options;
        
        console.log(`🚀 [GeminiService] Attempt ${retryCount + 1}: Calling ${modelName}...`);

        try {
            const model = this.genAI.getGenerativeModel({ 
                model: modelName,
                // Passing as parts for maximum compatibility across SDK versions
                systemInstruction: { parts: [{ text: systemPrompt }] }
            });

            const contents = messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            const result = await model.generateContentStream({
                contents,
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 2048,
                }
            }, { signal }); // Pass AbortSignal here

            return {
                fullStream: result.stream,
                async *[Symbol.asyncIterator]() {
                    try {
                        for await (const chunk of result.stream) {
                            if (signal?.aborted) break;
                            
                            // Manually extract text to avoid SDK's internal .text() parsing errors
                            const part = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (part) {
                                yield part;
                            } else if (chunk.candidates?.[0]?.finishReason === 'SAFETY') {
                                yield '\n\n⚠️ [Response blocked by Google Safety Filters]';
                            }
                        }
                    } catch (genErr) {
                        console.error('[GeminiService] Stream parsing error:', genErr.message);
                        // If it fails mid-stream, try to provide whatever we can
                        throw genErr;
                    }
                }
            };

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log(`[GeminiService] Request aborted for ${modelName}`);
                throw err;
            }
            const isQuotaError = err.message.includes('429') || err.message.toLowerCase().includes('quota');
            const isNotFoundError = err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('invalid');
            const isBusyError = err.message.includes('503') || err.message.toLowerCase().includes('high demand') || err.message.toLowerCase().includes('overloaded');
            
            if ((isQuotaError || isNotFoundError || isBusyError) && retryCount < 2) {
                console.warn(`[GeminiService] ⚠️ ${isBusyError ? 'Server busy' : (isNotFoundError ? 'Model not found' : 'Quota hit')} on ${modelName}. Retrying with next model in 500ms...`);
                await new Promise(resolve => setTimeout(resolve, 500));
                return this.generateStreamWithRetry(messages, systemPrompt, options, retryCount + 1);
            }

            console.error(`[GeminiService] FINAL ERROR on ${modelName}:`, err.message);
            
            // Clean up Google's massive JSON schema error dumps for the UI
            if (isQuotaError) {
                const quotaMsg = `Google Gemini API Quota Exceeded for ${modelName}. Please check your Google AI Studio plan or retry later.`;
                throw new Error(quotaMsg);
            } else if (isBusyError) {
                throw new Error("Google Gemini servers are currently overloaded. Please try again soon.");
            } else if (isNotFoundError) {
                throw new Error(`Google Gemini model '${modelName}' is currently unavailable or disabled.`);
            }

            // Fallback for general unhandled Google API errors preventing raw API leakage
            const safeErrorMessage = err.message.split('[{')[0].trim();
            throw new Error(safeErrorMessage || "An unexpected error occurred while communicating with Gemini API.");
        }
    }

    async generateStream(messages, systemPrompt, options = {}) {
        const prunedMessages = this.pruneMessages(messages, 8);
        return this.generateStreamWithRetry(prunedMessages, systemPrompt, options);
    }

}

module.exports = new GeminiService();
