/**kimheng's part */

import NotificationService from '../services/notificationService.js';

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const userId = req.user ? req.user.id : 1;
      const role = req.user ? req.user.role : 'user';
      const notifications = await NotificationService.getNotificationsForUser(userId, role);
      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async markRead(req, res) {
    try {
      const { id } = req.params;
      const success = await NotificationService.readNotification(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Notification marked as read successfully'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const success = await NotificationService.clearNotification(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async sendAlert(req, res) {
    try {
      const { userId, recipientRole, title, message, type } = req.body;
      if (!userId || !title || !message) {
        return res.status(400).json({ success: false, message: 'userId, title, and message are required fields' });
      }

      const notification = await NotificationService.sendNotification({ userId, recipientRole, title, message, type });
      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async broadcast(req, res) {
    try {
      const { title, message, type } = req.body;
      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'title and message are required fields' });
      }

      const result = await NotificationService.broadcastNotification({ title, message, type });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default NotificationController;
