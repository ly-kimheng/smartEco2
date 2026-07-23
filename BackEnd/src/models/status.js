// models/status.js
// Member 2 — Report statuses (Pending, In Progress, Resolved)

import pool from '../config/database.js';

class Status {
  // The 3 possible report statuses (matches what's stored in reports.status column)
  static STATUSES = ['Pending', 'In Progress', 'Resolved'];

  // Get all reports grouped by their status (useful for admin dashboard)
  static async getReportCountByStatus() {
    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) AS count
       FROM reports
       GROUP BY status`
    );
    return rows;
  }

  // Get all reports with a specific status
  static async getReportsByStatus(status) {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name AS reporter_name
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.status = ?
       ORDER BY r.created_at DESC`,
      [status]
    );
    return rows;
  }

  // Check if a status string is valid
  static isValid(status) {
    return Status.STATUSES.includes(status);
  }
}

export default Status;