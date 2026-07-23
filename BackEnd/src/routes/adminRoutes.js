/**kimheng's part */

import express from 'express';
import AdminController from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All admin routes require a valid token AND the admin role.
router.use(protect, checkRole('admin'));

// Get admin dashboard metrics
router.get('/stats', AdminController.getDashboardData);

// List all registered ecosystem reports 
router.get('/reports', AdminController.getAllReports);

// Single report detail, including all citizen feedback on it
router.get('/reports/:reportId', AdminController.getReportDetail);

// Update operational status of reports (e.g., Pending, In Progress, Resolved)
router.patch('/reports/:reportId/status', AdminController.updateReportStatus);

// Admin override for the "after cleanup" photo — the cleanup team sets it
// originally on task completion; admin can replace or remove it here.
router.patch('/reports/:reportId/after-image', upload.single('afterImage'), AdminController.replaceAfterImage);
router.delete('/reports/:reportId/after-image', AdminController.removeAfterImage);

// Assign or reassign the cleanup crew (and/or priority) for a report,
// directly from the Reports page — works whether a task exists yet or not.
router.patch('/reports/:reportId/assign', AdminController.reassignReport);

// Citizen directory — new signups show up here automatically
router.get('/users', AdminController.getUsers);

// List cleanup crew accounts (used to populate the "assignee" dropdown)
router.get('/cleanup-team', AdminController.getCleanupTeam);

// List every dispatched cleanup task
router.get('/tasks', AdminController.getTasks);

// Dispatch a cleanup crew to a task (auto-notifies the crew + the citizen reporter)
router.post('/tasks', AdminController.assignTask);

// Full database backup & recovery — downloads/restores as real SQL
router.get('/backup/tables', AdminController.getBackupTables);
router.get('/backup', AdminController.downloadBackup);
router.post('/backup/restore', AdminController.restoreBackup);

export default router;
