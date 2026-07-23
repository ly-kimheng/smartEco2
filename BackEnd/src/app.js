// app.js
// Shared — Express app setup
// Members 2 & 3: import your routes below and uncomment the mount lines

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Needed for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ---- Global middleware ----
app.use(cors());
// Default body-parser limit is 100kb — too small for a full-database backup
// restore (see /api/admin/backup/restore), so it's raised here.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded report images (Member 2)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SmartEco API is running' });
});

// ---- Routes ----

import authRoutes from './routes/authRoutes.js';
app.use('/api/auth', authRoutes);

import reportRoutes from './routes/reportRoutes.js';
app.use('/api/reports', reportRoutes);

import adminRoutes from './routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);

import rewardRoutes from './routes/rewardRoutes.js';
app.use('/api/rewards', rewardRoutes);

import guideRoutes from './routes/guideRoutes.js';
app.use('/api/guides', guideRoutes);

import notificationRoutes from './routes/notificationRoutes.js';
app.use('/api/notifications', notificationRoutes);

import cleanupTeamRoutes from './routes/cleanupTeamRoutes.js';
app.use('/api/cleanup-team', cleanupTeamRoutes);

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ---- Centralized error handler ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

export default app;