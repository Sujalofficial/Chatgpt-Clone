const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Memory = require('../models/Memory');

/**
 * memoryService.js
 * Handles short-term context window and long-term user fact extraction.
 */

const memoryService = {
  /**
   * Fetches the last N messages from a chat to provide context
   */
  getChatContext: async (chatId, model, limit = 15) => {
    try {
      if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) return [];
      const chat = await Chat.findById(chatId);
      if (!chat) return [];
      
      const history = chat.columns.get(model) || [];
      return history.slice(-limit);
    } catch (err) {
      console.error('Memory fetch error:', err);
      return [];
    }
  },

  /**
   * Fetches all long-term memories/facts for a user
   */
  getUserMemories: async (userId) => {
    try {
      const memories = await Memory.find({ user: userId });
      return memories.map(m => m.fact).join('\n');
    } catch (err) {
      console.error('Memory retrieval error:', err);
      return '';
    }
  },

  /**
   * Adds a new memory fact for a user
   */
  addMemory: async (userId, fact, category = 'general') => {
    try {
      const memory = new Memory({ user: userId, fact, category });
      await memory.save();
      return true;
    } catch (err) {
      console.error('Fact storage error:', err);
      return false;
    }
  }
};

module.exports = memoryService;
