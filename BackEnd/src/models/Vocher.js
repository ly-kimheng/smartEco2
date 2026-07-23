/**database queries for rewards */
/**kimheng */

import db from '../config/database.js';

class VoucherModel {
  static async create({ userId, rewardId, code, pointsSpent }) {
    const [result] = await db.execute(
      'INSERT INTO vouchers (user_id, reward_id, code, points_spent, status) VALUES (?, ?, ?, ?, ?)',
      [userId, rewardId, code, pointsSpent, 'Active']
    );
    return { id: result.insertId, userId, rewardId, code, pointsSpent, status: 'Active', created_at: new Date() };
  }

  static async getByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT v.*, r.title as reward_title, r.image_url as reward_image FROM vouchers v LEFT JOIN rewards r ON v.reward_id = r.id WHERE v.user_id = ? ORDER BY v.created_at DESC',
      [userId]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await db.execute(
      'SELECT v.*, r.title as reward_title, u.name as user_name FROM vouchers v LEFT JOIN rewards r ON v.reward_id = r.id LEFT JOIN users u ON v.user_id = u.id ORDER BY v.created_at DESC'
    );
    return rows;
  }

  static async updateStatus(id, status) {
    await db.execute('UPDATE vouchers SET status = ? WHERE id = ?', [status, id]);
    return { id, status };
  }
}

export default VoucherModel;
