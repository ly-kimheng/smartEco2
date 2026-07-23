/** ik it's your part but it related to my  part so let me handle it first */
/**kimheng: database queries for reports */

/** ik it's your part but it related to my  part so let me handle it first */
/**kimheng: database queries for reports */

import pool from '../config/database.js';

class Report {
  static async create({ userId, title, description, location, category, priority, imageUrl, reportedBy }) {
    const [result] = await pool.execute(
      `INSERT INTO reports (user_id, title, description, location, category, priority, image_url, reported_by, reported_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'Pending')`,
      [userId, title, description, location, category, priority || 'medium', imageUrl || null, reportedBy || null]
    );
    return Report.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name as reporter_name,
              t.after_image_url as after_image_url,
              t.before_image_url as before_image_url,
              t.progress as task_progress,
              t.status as task_status,
              t.completed_at as completed_at
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN tasks t ON t.report_id = r.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT r.*,
              t.after_image_url as after_image_url,
              t.before_image_url as before_image_url,
              t.progress as task_progress,
              t.status as task_status,
              t.completed_at as completed_at
       FROM reports r
       LEFT JOIN tasks t ON t.report_id = r.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name as reporter_name,
              t.after_image_url as after_image_url,
              t.before_image_url as before_image_url,
              t.progress as task_progress,
              t.status as task_status,
              t.completed_at as completed_at
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN tasks t ON t.report_id = r.id
       ORDER BY r.created_at DESC`
    );
    return rows;
  }

  static async updateStatus(id, status, adminId) {
    await pool.execute(
      'UPDATE reports SET status = ?, updated_by = ? WHERE id = ?',
      [status, adminId, id]
    );
    return Report.findById(id);
  }

  // GET /api/reports/votable
  // Reports open for community voting — same `reports` table Admin manages,
  // so anything an admin resolves/removes drops out of this list too.
  // `userId` is optional (guests can view/vote-count, just not toggle a vote).
  static async getVotable(userId) {
    const [rows] = await pool.execute(
      `SELECT r.*,
              u.name as reporter_name,
              COUNT(DISTINCT v.id) as vote_count,
              MAX(CASE WHEN v.user_id = ? THEN 1 ELSE 0 END) as user_voted
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN votes v ON v.report_id = r.id
       WHERE r.status NOT IN ('Resolved', 'Completed')
       GROUP BY r.id
       ORDER BY vote_count DESC, r.created_at DESC`,
      [userId || 0]
    );
    return rows;
  }

  static async addVote(userId, reportId) {
    const report = await Report.findById(reportId);
    if (!report) return null;

    // INSERT IGNORE respects the `uniq_user_report_vote` unique key, so a
    // double-click just no-ops instead of erroring.
    await pool.execute(
      'INSERT IGNORE INTO votes (user_id, report_id) VALUES (?, ?)',
      [userId, reportId]
    );
    const voteCount = await Report.getVoteCount(reportId);
    return { voted: true, voteCount };
  }

  static async removeVote(userId, reportId) {
    await pool.execute(
      'DELETE FROM votes WHERE user_id = ? AND report_id = ?',
      [userId, reportId]
    );
    const voteCount = await Report.getVoteCount(reportId);
    return { voted: false, voteCount };
  }

  static async getVoteCount(reportId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM votes WHERE report_id = ?',
      [reportId]
    );
    return rows[0]?.count || 0;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM reports WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Rate-limiting: how many reports has this user filed in the last N hours,
  // and when did the oldest one in that window land? The oldest timestamp is
  // what tells us when a "slot" frees up again (oldest + windowHours).
  static async countRecentByUser(userId, windowHours = 24) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count, MIN(created_at) as oldest
       FROM reports
       WHERE user_id = ? AND created_at >= (NOW() - INTERVAL ? HOUR)`,
      [userId, windowHours]
    );
    return { count: rows[0]?.count || 0, oldest: rows[0]?.oldest || null };
  }
}

export default Report;