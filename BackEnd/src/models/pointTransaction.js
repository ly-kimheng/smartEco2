/**kimheng's part */
/** database queries for transaction */

import db from '../config/database.js';

class PointTransactionModel {
  static async create({ userId, points, type, description }) {
    const [result] = await db.execute(
      'INSERT INTO point_transactions (user_id, points, type, description) VALUES (?, ?, ?, ?)',
      [userId, points, type, description]
    );
    
    // Auto-update standard user's current points balance
    const pointDelta = type === 'earn' ? points : -points;
    await db.execute(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [pointDelta, userId]
    );

    return { id: result.insertId, userId, points, type, description, created_at: new Date() };
  }

  static async getByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await db.execute(
      'SELECT pt.*, u.name as user_name FROM point_transactions pt LEFT JOIN users u ON pt.user_id = u.id ORDER BY pt.created_at DESC'
    );
    return rows;
  }
}

export default PointTransactionModel;
