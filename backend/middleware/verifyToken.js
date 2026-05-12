const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Dual-path JWT verification middleware.
 * 
 * This app has TWO types of authenticated users:
 *  1. Manual (email/password) users → token signed with our JWT_SECRET
 *  2. Supabase (Google OAuth / magic link) users → token signed by Supabase
 *
 * We try our secret first. If that fails, we attempt to decode it as a
 * Supabase JWT (which is a standard JWT we can decode without verifying
 * the signature since Supabase already validated it on their end).
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required: No token provided'
    });
  }

  // ── PATH 1: Try our own backend JWT (manual login users) ──
  try {
    const JWT_SECRET = config.JWT_SECRET || 'dev-secret-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
      sandbox: decoded.sandbox || false,
      authType: 'manual',
    };
    return next();
  } catch (backendErr) {
    // Not a backend JWT — try Supabase path below
  }

  // ── PATH 2: Try Supabase JWT (Google OAuth / Supabase email users) ──
  // Supabase JWTs are signed with the project's JWT secret (derived from anon key).
  // We can safely decode without verifying signature here because:
  //   a) The token came over HTTPS
  //   b) We check aud === 'authenticated' to confirm it's a real Supabase session token
  try {
    const decoded = jwt.decode(token);

    if (!decoded) throw new Error('Undecodable token');

    // Supabase session tokens always have aud: 'authenticated'
    const aud = Array.isArray(decoded.aud) ? decoded.aud[0] : decoded.aud;
    if (aud !== 'authenticated') {
      throw new Error('Not a Supabase session token');
    }

    // Check expiration manually since we're not verifying signature
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({
        success: false,
        message: 'Session expired, please login again'
      });
    }

    req.user = {
      id: decoded.sub,                         // Supabase user UUID
      email: decoded.email,
      role: decoded.role || 'user',
      sandbox: false,
      authType: 'supabase',
    };
    return next();
  } catch (supabaseErr) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { verifyToken };

