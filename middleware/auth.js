// Clerk authentication middleware
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Require authentication (block if not authenticated)
function requireAuth(req, res, next) {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Optional authentication (continue even if not authenticated)
function optionalAuth(req, res, next) {
  // req.auth is populated by Clerk middleware if user is logged in
  next();
}

module.exports = { requireAuth, optionalAuth };

