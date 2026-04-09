const jwt = require('jsonwebtoken');
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
    if (!user || !(await user.matchPassword(password))) {
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

module.exports = { signup, login };
