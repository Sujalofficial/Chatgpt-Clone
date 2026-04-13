const geminiService = require('../services/geminiService');
const groqService = require('../services/groqService');
const openaiService = require('../services/openaiService');
const deepseekService = require('../services/deepseekService');
const pdfService = require('../services/pdfService');
const fileService = require('../services/fileService');
const storageService = require('../services/storageService');
const Chat = require('../models/Chat');
const SandboxChat = require('../services/sandboxService');

// Helper to determine which DB model to use
const getChatModel = (req) => {
    return req.user?.sandbox ? SandboxChat : Chat;
};
const Usage = require('../models/Usage');
const { logger, Sentry } = require('../utils/logger');
const { getCache, setCache } = require('../utils/redisClient');
const config = require('../config/config');
const path = require('path');
const fs = require('fs');


/**
 * chatController.js
 * Comprehensive Multi-Provider Chat Controller with Strict Isolation
 */

const SYSTEM_PROMPT = `You are a senior software engineer with strong production experience.

Your job is to give HIGH-QUALITY, NON-GENERIC, technically deep answers.

⚠️ STRICT RULES:
* Do NOT give textbook or generic explanations
* Do NOT define basic terms unless absolutely necessary
* Always assume the user is preparing for technical interviews or building real systems

---

📌 RESPONSE REQUIREMENTS:

1. Go beyond surface-level:
   * Explain internal working (how it actually runs in memory / runtime)
   * Mention tradeoffs and limitations
   * Include real-world scenarios

2. Think like an engineer:
   * What can break?
   * What are edge cases?
   * What happens at scale?

3. Structure every answer like this:
   * Core explanation (short but deep)
   * Internals / how it works
   * Real-world issues
   * Better approach / optimization (if applicable)

4. If the question is simple:
   * Upgrade it automatically to an advanced explanation

5. If the answer risks being generic:
   * Rewrite it to be more technical and specific

---

📌 TONE:
* Direct
* Precise
* No fluff
* No unnecessary length

---

📌 OPTIONAL (USE WHEN RELEVANT):
* Include code snippets
* Compare alternatives
* Mention performance implications

---

🎯 GOAL:
Make the answer strong enough that the user can confidently explain it in a real technical interview and stand out in the top 10%.`;

/* SSE Helpers */
const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
};

const sendToken = (res, text) => res.write(`data: ${JSON.stringify({ text })}\n\n`);
const sendDone  = (res)       => { res.write('data: [DONE]\n\n'); res.end(); };
const sendError = (res, msg)  => { res.write(`data: ${JSON.stringify({ error: msg })}\n\n`); res.end(); };

const streamChat = async (req, res) => {
    console.log('--- 📥 NEW REQUEST ---');
    console.log('Model ID Requested:', req.body.model);
    console.log('User ID:', req.user?.id);
    
    const { model, messages, chatId } = req.body;
    const userId = req.user?.id;
    // file URL or path sent from frontend (e.g. /uploads/filename.pdf)
    const fileRef = req.body.image || req.body.file || null;

    if (!model) return res.status(400).json({ message: 'model is required' });

    let finalPrompt = '';
    // pdfText is pre-extracted at upload time and sent by the frontend
    let extractedContext = (req.body.pdfText && req.body.pdfText.trim()) ? req.body.pdfText.trim() : '';
    
    // 1. Handle Input Files — only run if no pdfText was already supplied
    if (fileRef && !extractedContext) {
        try {
            const fileName = fileRef.toString().split('/').pop();
            const localPath = path.join(__dirname, '..', 'uploads', fileName);
            const ext = path.extname(fileName).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
            const isPdf   = ext === '.pdf';

            console.log(`[ChatController] Processing file: ${fileName} (isImage=${isImage}, isPdf=${isPdf})`);

            if (!fs.existsSync(localPath)) {
                console.warn(`[ChatController] File not found on disk: ${localPath}`);
            } else if (isPdf) {
                // Both Groq and Gemini get the extracted PDF text injected
                extractedContext = await pdfService.extractText(localPath);
                if (extractedContext.startsWith('Error:')) throw new Error(extractedContext);
                console.log(`[ChatController] PDF text injected — ${extractedContext.length} chars`);
            } else if (isImage) {
                if (model !== 'gemini') {
                    // For Groq, describe that an image was attached but can't be processed
                    extractedContext = '[User attached an image. Image vision is only supported by Gemini — please switch to Gemini to analyse images.]';
                } else {
                    console.log('[ChatController] Image file detected for Gemini (vision mode).');
                }
            }
        } catch (fileErr) {
            console.error('[ChatController] File processing error:', fileErr.message);
            // Don\'t block the entire request; just log and continue without file context
        }
    }

    // TASK 1: CONTEXT MODE DETECTION
    let mode = 'chat';
    if (extractedContext || fileRef) {
        mode = 'document';
    } else if (req.body.intent === 'tool') {
        mode = 'tool';
    }

    // Clone original messages for safe saving (TASK 6: Prevent context leakage)
    const originalConversation = messages ? JSON.parse(JSON.stringify(messages)) : [];
    let activeConversation = [];
    const lastMsg = originalConversation[originalConversation.length - 1];
    const userQ = lastMsg ? lastMsg.content : '';

    // TASK 2 & 5: STRICT CONTEXT ISOLATION
    if (mode === 'document') {
        // TASK 9: If document uploaded but no text extracted -> return "Unable to read the document"
        const isImage = fileRef && fileRef.match(/\.(jpg|jpeg|png|webp)$/i);
        if (!extractedContext && !isImage) {
            res.writeHead(200, sseHeaders);
            sendToken(res, "Unable to read the document");
            sendDone(res);
            return;
        }

        // TASK 4: PROMPT STRUCTURE (ANTI-GENERIC)
        const documentPrompt = `You are a document analysis assistant.

Document content:
<EXTRACTED_TEXT>
${extractedContext}
</EXTRACTED_TEXT>

User query:
${userQ}

IMPORTANT:
* Answer ONLY using the document
* Do NOT use previous conversation
* Do NOT give generic advice
* Reference specific details from the document`;

        activeConversation = [{ role: 'user', content: documentPrompt }];

    } else if (mode === 'tool') {
        activeConversation = lastMsg ? [lastMsg] : [];
    } else {
        // CHAT MODE: Use previous messages (last 10-15)
        activeConversation = originalConversation.slice(-15);
    }

    // TASK 8: DEBUG LOGGING
    console.log(`[DEBUG] Mode Selected: ${mode}`);
    console.log(`[DEBUG] Context Length Used: ${activeConversation.length} messages`);
    console.log(`[DEBUG] Document Context Applied: ${mode === 'document'}`);
    console.log(`[DEBUG] Final Destination Model: ${model}`);
    
    const previewLastMsg = activeConversation[activeConversation.length - 1];
    const previewText = previewLastMsg ? previewLastMsg.content.substring(0, 100).replace(/\n/g, ' ') : 'None';
    logger.debug({ mode, model, chatId, preview: previewText }, 'Preparing chat stream');

    // ─── ABORT HANDLING (PROD COST CONTROL) ───
    const abortController = new AbortController();
    req.on('close', () => {
        if (!res.writableEnded) {
            logger.warn({ userId, model, chatId }, 'SSE Client disconnected prematurely');
            abortController.abort();
        }
    });

    // 3. Prepare Chat to store history
    let chat;
    if (userId) {
        try {
            const ActiveChat = getChatModel(req);
            if (chatId) {
                chat = await ActiveChat.findOne({ _id: chatId, user: userId });
            }
            if (!chat && lastMsg) {
                chat = new ActiveChat({ 
                    user: userId, 
                    title: lastMsg.content.substring(0, 40) || 'New Chat' 
                });
                await chat.save();
                logger.info({ chatId: chat._id, userId }, 'New chat session created');
            }
        } catch (e) {
            logger.error({ err: e.message, userId }, 'DB error during chat lookup');
            Sentry.captureException(e);
        }
    }


    res.writeHead(200, sseHeaders);
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    
    // Send an initial empty token to "prime" the stream and bypass some proxy buffers
    res.write(':\n\n'); 

    if (chat) res.write(`data: ${JSON.stringify({ chatId: chat._id })}\n\n`);

    let generatedContent = '';

    // 4. STRICT ISOLATION ROUTING
    try {
        if (model === 'gemini') {
            const stream = await geminiService.generateStream(activeConversation, SYSTEM_PROMPT, { signal: abortController.signal });
            
            for await (const part of stream) {
                if (abortController.signal.aborted) break;
                if (part) {
                    generatedContent += part;
                    sendToken(res, part);
                }
            }
        } else if (model === 'groq') {
            const stream = await groqService.generateStream(activeConversation, SYSTEM_PROMPT, { signal: abortController.signal });
            for await (const chunk of stream) {
                if (abortController.signal.aborted) break;
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) {
                    generatedContent += delta;
                    sendToken(res, delta);
                }
            }
        } else if (model === 'openai') {
            const stream = await openaiService.generateStream(activeConversation, SYSTEM_PROMPT, { signal: abortController.signal });
            for await (const chunk of stream) {
                if (abortController.signal.aborted) break;
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) {
                    generatedContent += delta;
                    sendToken(res, delta);
                }
            }
        } else if (model === 'deepseek') {
            const stream = await deepseekService.generateStream(activeConversation, SYSTEM_PROMPT, { signal: abortController.signal });
            for await (const part of stream) {
                if (abortController.signal.aborted) break;
                if (part) {
                    generatedContent += part;
                    sendToken(res, part);
                }
            }
        } else {
            throw new Error(`Unsupported model identifier: ${model}`);
        }

        // Save to DB using original un-mutated history (parallel-safe)
        if (chat && generatedContent && !abortController.signal.aborted) {
           const history = [...originalConversation, { role: 'assistant', content: generatedContent }];
           const ActiveChat = getChatModel(req);
           await ActiveChat.findOneAndUpdate(
             { _id: chat._id },
             { $set: { [`columns.${model}`]: history } }
           );
        }
        
        if (!abortController.signal.aborted) {
            sendDone(res);
            logger.info({ userId, model, chatId, genChars: generatedContent.length }, 'Stream completed successfully');
            
            // ─── INCREMENT USAGE (PROD QUOTA) ───
            if (config.ENABLE_QUOTA && userId && !req.user?.sandbox) {
                const today = new Date().toISOString().split('T')[0];
                const tokenEstimate = Math.ceil(generatedContent.length / 4); // Simple heuristic
                
                Usage.findOneAndUpdate(
                    { userId, date: today },
                    { $inc: { requestCount: 1, tokenCount: tokenEstimate } },
                    { upsert: true, new: true }
                ).catch(err => logger.error({ err: err.message }, 'Failed to increment usage - failing open'));
            }
        } else {
            res.end();
        }

    } catch (routeErr) {
        if (model === 'gemini') {
            console.error('[ChatController] Gemini Deep Error:', routeErr);
        }
        if (routeErr.name === 'AbortError' || abortController.signal.aborted) {
            logger.info({ userId, model }, 'Stream request manually aborted');
            if (!res.writableEnded) res.end();
            return;
        }

        let errMsg = routeErr.message || 'Unknown stream error';
        logger.error({ err: errMsg, userId, model }, 'Critical stream failure');
        Sentry.captureException(routeErr);
        
        if (!res.writableEnded) {
            sendError(res, `Model Failure: ${errMsg}`);
        }
    }
};



/* Reuse management logic from old system */
/**
 * getChats
 * Implements pagination for multi-million record lookup efficiency
 */
const getChats = async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const ActiveChat = getChatModel(req);

      const [chats, total] = await Promise.all([
        ActiveChat.find({ user: req.user.id })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ActiveChat.countDocuments({ user: req.user.id })
      ]);

      res.json({
        success: true,
        data: chats,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
      });
    } catch (e) { 
        logger.error({ err: e.message }, 'GetChats pagination failure');
        res.status(500).json({ success: false, message: 'Failed to fetch conversation history' }); 
    }
};

const deleteChat = async (req, res) => {
    try {
        const ActiveChat = getChatModel(req);
        await ActiveChat.findOneAndDelete({ _id: req.params.chatId, user: req.user.id });
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const renameChat = async (req, res) => {
    try {
        const ActiveChat = getChatModel(req);
        const chat = await ActiveChat.findOneAndUpdate(
            { _id: req.body.chatId, user: req.user.id },
            { title: req.body.title },
            { new: true }
        );
        res.json(chat);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const togglePinChat = async (req, res) => {
    try {
      const ActiveChat = getChatModel(req);
      const chat = await ActiveChat.findOne({ _id: req.body.chatId, user: req.user.id });
      if (!chat) return res.status(404).json({ error: 'Not found' });
      chat.isPinned = !chat.isPinned;
      await chat.save();
      res.json(chat);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const getChat = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const cacheKey = `chat:${chatId}`;

        // Try Cache first (Fail open)
        if (config.ENABLE_REDIS) {
            const cachedArr = await getCache(cacheKey);
            if (cachedArr) {
                logger.debug({ chatId }, 'Serving chat from Redis cache');
                return res.json(JSON.parse(cachedArr));
            }
        }

        const ActiveChat = getChatModel(req);
        const chat = await ActiveChat.findOne({ _id: chatId, user: req.user.id });
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        // Set Cache for 5 mins (Fail open)
        if (config.ENABLE_REDIS) {
            await setCache(cacheKey, chat, 300);
        }

        res.json(chat);
    } catch (e) {
        logger.error({ err: e.message }, 'Failed to fetch chat');
        res.status(500).json({ error: 'Failed' });
    }
};


module.exports = { streamChat, getChats, getChat, deleteChat, renameChat, togglePinChat };
