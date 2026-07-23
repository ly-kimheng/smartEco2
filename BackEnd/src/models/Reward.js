/**kimheng's part */

import db from '../config/database.js';

class RewardModel {
  static async getAll() {
    const [rows] = await db.execute('SELECT * FROM rewards ORDER BY points_required ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM rewards WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ title, description, pointsRequired, imageUrl, stock }) {
    const [result] = await db.execute(
      'INSERT INTO rewards (title, description, points_required, image_url, stock) VALUES (?, ?, ?, ?, ?)',
      [title, description, pointsRequired, imageUrl, stock]
    );
    // Re-fetch instead of echoing the camelCase input back — keeps the
    // shape identical to getAll() (snake_case columns), which is what the
    // frontend list rendering expects.
    return this.findById(result.insertId);
  }

  static async update(id, { title, description, pointsRequired, imageUrl, stock }) {
    await db.execute(
      'UPDATE rewards SET title = ?, description = ?, points_required = ?, image_url = ?, stock = ? WHERE id = ?',
      [title, description, pointsRequired, imageUrl, stock, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM rewards WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default RewardModel;
