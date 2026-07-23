// src/controllers/authController.js
import bcrypt from 'bcrypt';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  updatePassword,
} from '../models/user.js';
import AdminModel from '../models/admin.js';
import generateToken from '../../utils/generateToken.js';
import CleanupTeamModel from '../models/cleanupTeam.js';
const SALT_ROUNDS = 10;

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ name, email, passwordHash });
    const token = generateToken(user.id, 'user'); // FIX: pass role

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
    });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // waste_management.sql keeps admins in a separate table from users.
    // Check users first, then admins, so the same login form works for both.
    const user = await findUserByEmail(email);
    const admin = !user ? await AdminModel.findByEmail(email) : null;
    const teamMember = !user && !admin ? await CleanupTeamModel.findByEmail(email) : null;
    const account = user || admin || teamMember;
    const role = user ? 'user' : admin ? 'admin' : 'cleanup_team';

    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, account.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(account.id, role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        points: user ? user.points : undefined,
        role,
      },
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.status(200).json({ message: 'Logout successful' });
}

// GET /api/auth/profile  (protected)
export async function getProfile(req, res) {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
}

// PUT /api/auth/profile  (protected)
// Works for all three account types — citizens live in `users`, admins in
// `admins`, cleanup crew in `cleanup_team`. req.user.role (set by the auth
// middleware) tells us which table to write to.
export async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: 'Provide at least one field to update' });
    }

    // Email-uniqueness check only makes sense against the citizen table today.
    if (email && req.user.role === 'user') {
      const existing = await findUserByEmail(email);
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ message: 'That email is already in use' });
      }
    }

    let updatedAccount;
    if (req.user.role === 'admin') {
      updatedAccount = await AdminModel.update(req.user.id, { name, email });
    } else if (req.user.role === 'cleanup_team') {
      updatedAccount = await CleanupTeamModel.update(req.user.id, { name, email });
    } else {
      updatedAccount = await updateUser(req.user.id, { name, email });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: { ...updatedAccount, role: req.user.role },
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
}

// PUT /api/auth/password  (protected)
// Same story as above — look up the right table for the account's role so
// this doesn't 500 for admins/cleanup crew (it previously only worked for
// citizen accounts because it always queried the `users` table).
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Need the password hash — fetch fresh from DB (req.user doesn't carry it)
    let accountWithPassword;
    if (req.user.role === 'admin') {
      accountWithPassword = await AdminModel.findByEmail(req.user.email);
    } else if (req.user.role === 'cleanup_team') {
      accountWithPassword = await CleanupTeamModel.findByEmail(req.user.email);
    } else {
      accountWithPassword = await findUserByEmail(req.user.email);
    }

    if (!accountWithPassword) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const matches = await bcrypt.compare(currentPassword, accountWithPassword.password);
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    if (req.user.role === 'admin') {
      await AdminModel.updatePassword(req.user.id, newHash);
    } else if (req.user.role === 'cleanup_team') {
      await CleanupTeamModel.updatePassword(req.user.id, newHash);
    } else {
      await updatePassword(req.user.id, newHash);
    }

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
}