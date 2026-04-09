const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

/**
 * intentService.js
 * AI-based intent classification for intelligent routing
 */

const { google } = require('@ai-sdk/google');

class IntentService {
  constructor() {
    this.google = google;
  }

  /**
   * Classifies the primary intent of a user's message
   */
  async classifyIntent(message) {
    if (!message || message.length < 5) return 'chat';

    try {
      const { text } = await generateText({
        model: this.google('gemini-2.5-flash'),
        system: `You are an intent classifier for an AI chat platform.
        Respond ONLY with one of the following labels:
        - "cricket" (if the user asks for IPL scores, player stats, or match details)
        - "weather" (if the user asks about current weather in a city)
        - "image" (if the user wants to generate or describe an image)
        - "code" (if the user asks for complex programming or debugging)
        - "chat" (for general conversation, greeting, logic, or basic knowledge)
        
        Example: "Who is the captain of CSK?" -> "cricket"
        Example: "What is the weather in Delhi?" -> "weather"
        Example: "Tell me a joke" -> "chat"`,
        prompt: `User message: "${message}"`,
      });

      const intent = text.toLowerCase().trim();
      // Ensure we only return a valid label
      const validLabels = ['cricket', 'weather', 'image', 'code', 'chat'];
      return validLabels.includes(intent) ? intent : 'chat';
    } catch (err) {
      console.error('❌ Intent classification error:', err);
      // Fallback to simple keyword check
      if (message.toLowerCase().includes('score') || message.toLowerCase().includes('match')) return 'cricket';
      return 'chat';
    }
  }
}

module.exports = new IntentService();
