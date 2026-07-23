/**kimheng's part */

import db from '../config/database.js';

class NotificationModel {
  // recipientRole tells us which "table" the userId belongs to: 'user' | 'admin' | 'cleanup_team'.
  // Needed since notifications.user_id no longer has a hard FK to `users` (see
  // migrations_notifications_cleanup.sql) — admin/cleanup_team ids live in other tables
  // and can collide numerically with a `users` row.
  static async create({ userId, recipientRole = 'user', title, message, type = 'info', reportId = null, imageUrl = null }) {
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, recipient_role, title, message, type, report_id, image_url, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, false)',
      [userId, recipientRole, title, message, type, reportId, imageUrl]
    );
    return { id: result.insertId, userId, recipientRole, title, message, type, reportId, imageUrl, isRead: false, created_at: new Date() };
  }

  static async getByUserId(userId, recipientRole = 'user') {
    const [rows] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? AND recipient_role = ? ORDER BY created_at DESC',
      [userId, recipientRole]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await db.execute(
      'SELECT n.*, u.name as user_name FROM notifications n LEFT JOIN users u ON n.user_id = u.id ORDER BY n.created_at DESC'
    );
    return rows;
  }

  static async markAsRead(id) {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = true WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default NotificationModel;
