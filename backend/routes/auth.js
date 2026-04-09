const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { login, signup } = require('../controllers/authController');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const { validate, schemas } = require('../middleware/validate');

router.post('/signup', validate(schemas.auth), signup);
router.post('/login',  validate(schemas.auth), login);

// GOOGLE AUTH ROUTES
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/login?error=auth_failed` }), (req, res) => {
    // On success, generate JWT
    const user = req.user;
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Redirect to frontend with token — using query param for simple integration
    res.redirect(`${CLIENT_URL}/auth-callback?token=${token}&userId=${user._id}`);
});

module.exports = router;
