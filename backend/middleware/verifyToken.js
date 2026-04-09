const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Standard Stateless JWT verification middleware
 * Ensures the token is signed with our secret and is not expired.
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

  try {
    const JWT_SECRET = config.JWT_SECRET || 'dev-secret-change-in-production';
    
    // VERIFY signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set req.user handling both standard 'id' and potential legacy fields
    req.user = { 
      id: decoded.id || decoded.sub, 
      email: decoded.email 
    };
    
    next();
  } catch (err) {
    let msg = 'Invalid or expired token';
    if (err.name === 'TokenExpiredError') msg = 'Session expired, please login again';
    
    return res.status(401).json({ 
      success: false,
      message: msg 
    });
  }
};

module.exports = { verifyToken };
