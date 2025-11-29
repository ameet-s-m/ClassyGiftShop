// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Extract token from cookie
function getToken(req) {
  const token = req.cookies?.token;
  return token || null;
}

// Require logged-in USER (role=user)
function requireUser(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: 'User login required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'user') {
      return res.status(403).json({ message: 'User access only' });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Require logged-in ADMIN (role=admin)
function requireAdmin(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: 'Admin login required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }
    req.adminId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { requireUser, requireAdmin };
