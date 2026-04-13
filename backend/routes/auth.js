const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { login, signup, forgotPassword, resetPassword, guestLogin } = require('../controllers/authController');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const { validate, schemas } = require('../middleware/validate');

router.post('/signup', validate(schemas.auth), signup);
router.post('/login',  validate(schemas.auth), login);
router.post('/guest-login', guestLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// GOOGLE AUTH ROUTES
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
}));

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
        }
        
        // On success, generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        // Redirect to frontend with token
        res.redirect(`${CLIENT_URL}/auth-callback?token=${token}&userId=${user._id}`);
    })(req, res, next);
});

module.exports = router;
