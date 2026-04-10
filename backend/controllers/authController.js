const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');

const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

    const user = await User.create({ email: email.toLowerCase(), password, name });
    const JWT_SECRET = config.JWT_SECRET || 'dev-secret-change-in-production';
    
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      success: true,
      token, 
      user: { id: user._id, email: user.email, name: user.name } 
    });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or user registered via Google' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const JWT_SECRET = config.JWT_SECRET || 'dev-secret-change-in-production';
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true,
      token, 
      user: { id: user._id, email: user.email, name: user.name } 
    });
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    // Since we don't have an email service, in dev we return the token
    // In prod, you'd send an email here.
    const resetUrl = `${config.CLIENT_URL}/reset-password/${resetToken}`;

    console.log(`🔑 RESET URL: ${resetUrl}`);

    res.json({ 
      success: true, 
      message: 'Password reset link generated (see console in dev)',
      devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined 
    });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { next(err); }
};

module.exports = { signup, login, forgotPassword, resetPassword };
