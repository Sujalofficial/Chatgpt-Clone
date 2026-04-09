const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  requestCount: { type: Number, default: 0 },
  tokenCount: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index for fast lookup
usageSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Usage', usageSchema);
