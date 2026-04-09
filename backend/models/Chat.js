const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
}, { _id: false });

/**
 * columns: Map<modelId, Message[]>
 * Allows arbitrary model keys: openai, gemini, deepseek, etc.
 */
const chatSchema = new mongoose.Schema({
  user:  { type: String, required: true, index: true },
  title: { type: String, default: 'New Chat' },
  isPinned: { type: Boolean, default: false },
  folder: { type: String, default: null, index: true },
  columns: {
    type: Map,
    of: [messageSchema],
    default: {},
  },
}, { timestamps: true });

// Index for fast user-history pagination and performance
chatSchema.index({ user: 1, updatedAt: -1 });
chatSchema.index({ user: 1, createdAt: -1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
