const mongoose = require('mongoose');
const User = require('../models/User');

const updateProfile = async (req, res) => {
  try {
    const { name, profilePic } = req.body;
    const userId = req.user.id;

    // Use findOneAndUpdate with email fallback for non-ObjectId accounts
    let query = { _id: userId };
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      query = { email: req.user.email };
    }

    const user = await User.findOneAndUpdate(
      query,
      { name, profilePic },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const { id, email } = req.user;
    
    // 1. Try find by ID if valid
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    
    // 2. Fallback to Email search (Sync with OAuth Providers)
    if (!user && email) {
      const safeEmail = String(email).toLowerCase();
      user = await User.findOne({ email: safeEmail });
      
      // 3. Auto-Register if missing (Seamless integration)
      if (!user) {
        const defaultName = email.split('@')[0] || 'AI User';
        user = await User.create({ email: safeEmail, name: defaultName });
      }
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

module.exports = { updateProfile, getProfile };
