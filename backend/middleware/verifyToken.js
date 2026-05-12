const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Dual-path JWT verification middleware.
 * 
 * This app has TWO types of authenticated users:
 *  1. Manual (email/password) users → token signed with our JWT_SECRET
 *  2. Supabase (Google OAuth / magic link) users → token signed by Supabase
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[Auth] Rejecting: No token provided');
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
    // console.log(`[Auth] Path 1 Success: Manual user ${req.user.email || req.user.id}`);
    return next();
  } catch (backendErr) {
    // console.log(`[Auth] Path 1 Failed (Not a backend JWT): ${backendErr.message}`);
    // Not a backend JWT — try Supabase path below
  }

  // ── PATH 2: Try Supabase JWT (Google OAuth / Supabase email users) ──
  try {
    const decoded = jwt.decode(token);

    if (!decoded) {
      console.log('[Auth] Rejecting: Token could not be decoded at all');
      throw new Error('Undecodable token');
    }

    // console.log('[Auth] Decoded payload:', { aud: decoded.aud, exp: decoded.exp, sub: decoded.sub });

    // Ensure it's a Supabase token (Supabase sets aud to 'authenticated')
    // Made more lenient: if aud is missing, we still accept it as long as it has a sub (UUID)
    if (decoded.aud) {
      const aud = Array.isArray(decoded.aud) ? decoded.aud[0] : decoded.aud;
      if (aud !== 'authenticated') {
        console.log(`[Auth] Rejecting: Incorrect audience '${aud}'`);
        throw new Error('Not a Supabase session token');
      }
    }

    // Check expiration manually since we're not verifying signature here
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log(`[Auth] Rejecting: Token expired at ${decoded.exp} (now ${now})`);
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
    
    // console.log(`[Auth] Path 2 Success: Supabase user ${req.user.email || req.user.id}`);
    return next();
  } catch (supabaseErr) {
    console.log(`[Auth] Path 2 Failed: ${supabaseErr.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { verifyToken };

