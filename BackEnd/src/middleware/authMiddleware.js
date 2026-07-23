// middleware/authMiddleware.js
// kesar
// Verifies the JWT from the Authorization header and attaches req.user.
// Members 2 & 3 use this middleware to protect their routes —
// just import { protect } and add it before your controller function.

import jwt from 'jsonwebtoken';
import { findUserById } from '../models/user.js';
import AdminModel from '../models/admin.js';
import CleanupTeamModel from '../models/cleanupTeam.js';

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      req.user = null;
      return next();
    }

    const account =
      decoded.role === 'admin' ? await AdminModel.findById(decoded.id) :
      decoded.role === 'cleanup_team' ? await CleanupTeamModel.findById(decoded.id) :
      await findUserById(decoded.id);

    req.user = account ? { ...account, role: decoded.role } : null;
    next();
  } catch (error) {
    console.error('optionalAuth error:', error);
    req.user = null;
    next();
  }
}

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }

    // waste_management.sql keeps admins in a separate table from users,
    // so look up the right one based on the role embedded in the token.
    const account =
    decoded.role === 'admin' ? await AdminModel.findById(decoded.id) :
    decoded.role === 'cleanup_team' ? await CleanupTeamModel.findById(decoded.id) :
    await findUserById(decoded.id);

    if (!account) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    req.user = { ...account, role: decoded.role };
    next();
  } catch (error) {
    console.error('authMiddleware error:', error);
    res.status(500).json({ message: 'Server error while authenticating' });
  }
}
