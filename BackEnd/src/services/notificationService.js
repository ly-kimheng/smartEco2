/**kimheng's part */

import NotificationModel from '../models/notification.js';
import db from '../config/database.js';

class NotificationService {
  // Generic role-aware sender. recipientRole: 'user' | 'admin' | 'cleanup_team'
  static async sendNotification({ userId, recipientRole = 'user', title, message, type = 'info', reportId = null, imageUrl = null }) {
    return await NotificationModel.create({ userId, recipientRole, title, message, type, reportId, imageUrl });
  }

  static async getNotificationsForUser(userId, recipientRole = 'user') {
    return await NotificationModel.getByUserId(userId, recipientRole);
  }

  static async clearNotification(id) {
    return await NotificationModel.delete(id);
  }

  static async readNotification(id) {
    return await NotificationModel.markAsRead(id);
  }

  static async broadcastNotification({ title, message, type = 'broadcast' }) {
    try {
      const [users] = await db.execute('SELECT id FROM users');
      const inserts = users.map(user =>
        NotificationModel.create({ userId: user.id, recipientRole: 'user', title, message, type })
      );
      await Promise.all(inserts);
      return { success: true, count: users.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── Convenience helpers for the auto-notification flows ──────────────────

  // Report submitted / status changed → tell the citizen who filed it.
  static async notifyUser(userId, { title, message, type = 'info', reportId = null, imageUrl = null }) {
    return NotificationModel.create({ userId, recipientRole: 'user', title, message, type, reportId, imageUrl });
  }

  // New report submitted, task completed by a crew, etc. → tell every admin.
  static async notifyAllAdmins({ title, message, type = 'info', reportId = null }) {
    const [admins] = await db.execute('SELECT id FROM admins');
    const inserts = admins.map(admin =>
      NotificationModel.create({ userId: admin.id, recipientRole: 'admin', title, message, type, reportId })
    );
    await Promise.all(inserts);
    return { count: admins.length };
  }

  // Task assigned by an admin → tell that specific cleanup crew member.
  static async notifyCleanupTeam(cleanupTeamId, { title, message, type = 'info', reportId = null }) {
    return NotificationModel.create({ userId: cleanupTeamId, recipientRole: 'cleanup_team', title, message, type, reportId });
  }
}

export default NotificationService;
