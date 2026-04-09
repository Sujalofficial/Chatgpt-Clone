const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  password: { type: String, select: false }, // optional for OAuth users, never returned by default
  name:     { type: String, trim: true },
  googleId: { type: String, sparse: true, index: true },
  profilePic: { type: String, default: '' },
  plan:     { type: String, enum: ['free', 'plus', 'team'], default: 'free' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
