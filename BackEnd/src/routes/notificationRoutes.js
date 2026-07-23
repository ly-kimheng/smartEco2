/**kimheng's part */

import express from 'express';
import NotificationController from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Every notification route is personal to the logged-in account (user, admin,
// or cleanup_team), so require a valid token — this also gives us req.user.role,
// which getNotifications needs to fetch the right recipient's inbox.
router.use(protect);

// Retrieve specific personalized user notification history
router.get('/', NotificationController.getNotifications);

// Update status to read
router.patch('/:id/read', NotificationController.markRead);

// Clear or dismiss old notices from active inbox
router.delete('/:id', NotificationController.deleteNotification);

// Send specific system alert targeting single user context
router.post('/alert', NotificationController.sendAlert);

// Disseminate community-wide urgent broadcast notice
router.post('/broadcast', NotificationController.broadcast);

export default router;
