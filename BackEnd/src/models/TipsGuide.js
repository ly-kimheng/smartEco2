import db from '../config/database.js';

// Mirrors BackEnd/src/models/Reward.js conventions (see Section 6,
// `tips_guides` table in Database/defaultdb.sql).
class TipsGuideModel {
  static async getAll({ publishedOnly = false } = {}) {
    const where = publishedOnly ? 'WHERE is_published = 1' : '';
    const [rows] = await db.execute(
      `SELECT * FROM tips_guides ${where} ORDER BY created_at DESC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM tips_guides WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ title, category, content, imageUrl, isPublished, createdBy }) {
    const [result] = await db.execute(
      `INSERT INTO tips_guides (title, category, content, image_url, is_published, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        category || 'General',
        content,
        imageUrl || null,
        isPublished === undefined ? true : !!isPublished,
        createdBy || null,
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { title, category, content, imageUrl, isPublished }) {
    await db.execute(
      `UPDATE tips_guides
       SET title = ?, category = ?, content = ?, image_url = ?, is_published = ?
       WHERE id = ?`,
      [title, category || 'General', content, imageUrl || null, isPublished === undefined ? true : !!isPublished, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM tips_guides WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default TipsGuideModel;
