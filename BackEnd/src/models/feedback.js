import pool from '../config/database.js';

class Feedback {
  static async create({ userId, reportId, rating, comment }) {
    const [result] = await pool.query(
      `INSERT INTO feedback (user_id, report_id, rating, comment) VALUES (?, ?, ?, ?)`,
      [userId, reportId, rating, comment || null]
    );
    return Feedback.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT f.*, u.name as user_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByReportId(reportId) {
    const [rows] = await pool.query(
      `SELECT f.*, u.name as user_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.report_id = ?
       ORDER BY f.created_at DESC`,
      [reportId]
    );
    return rows;
  }

  static async findByReportIdAndUser(reportId, userId) {
    const [rows] = await pool.query(
      `SELECT f.*, u.name as user_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.report_id = ? AND f.user_id = ?
       ORDER BY f.created_at DESC`,
      [reportId, userId]
    );
    return rows;
  }
}

export default Feedback;
