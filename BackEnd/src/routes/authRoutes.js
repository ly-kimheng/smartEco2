// routes/authRoutes.js
// Owner: Member 1 — Authentication & User Management
// Mounted at /api/auth in app.js

// src/routes/authRoutes.js
import { Router } from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,   // NEW
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);   // NEW

export default router;