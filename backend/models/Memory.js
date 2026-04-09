const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  user: { type: String, required: true, index: true },
  fact: { type: String, required: true },
  category: { type: String, default: 'general' }, // e.g. preference, profession, personal
  relevance: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Memory', MemorySchema);
