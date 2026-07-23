import pool from '../config/database.js';

export async function findByAssignee(cleanupTeamId) {
  const [rows] = await pool.query(
    `SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC`,
    [cleanupTeamId]
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(`SELECT * FROM tasks WHERE id = ?`, [id]);
  return rows[0] || null;
}

// progress is optional (0-100). When omitted, only status changes — this
// keeps callers that don't know about progress (e.g. older code) working.
export async function updateStatus(id, status, progress = null) {
  if (progress === null) {
    await pool.query(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id]);
  } else {
    await pool.query(`UPDATE tasks SET status = ?, progress = ? WHERE id = ?`, [status, progress, id]);
  }
}

export async function complete(id, afterImageUrl) {
  await pool.query(
    `UPDATE tasks SET status = 'completed', progress = 100, after_image_url = ?, completed_at = NOW() WHERE id = ?`,
    [afterImageUrl, id]
  );

  // Keep the citizen-facing report in sync: if this task was created from a
  // report, flip that report to Resolved now that cleanup is done, instead
  // of leaving it stuck on "Pending" until an admin manually updates it.
  const [[task]] = await pool.query(`SELECT report_id FROM tasks WHERE id = ?`, [id]);
  if (!task || !task.report_id) return;

  const [[report]] = await pool.query(
    `SELECT id, user_id FROM reports WHERE id = ?`,
    [task.report_id]
  );
  if (!report) return;

  await pool.query(`UPDATE reports SET status = 'Resolved' WHERE id = ?`, [report.id]);

  // Award points + notify only the first time this report is ever resolved.
  // reports.points_awarded is the single source of truth for this (not the
  // status column, which can be flipped back and forth by an admin) — the
  // UPDATE ... WHERE points_awarded = 0 atomically "claims" the award, so
  // this can't double-award even if an admin resolves the same report from
  // the Reports screen at the same moment a crew completes its task.
  if (report.user_id) {
    const [claim] = await pool.query(
      `UPDATE reports SET points_awarded = 1 WHERE id = ? AND points_awarded = 0`,
      [report.id]
    );

    if (claim.affectedRows > 0) {
      const pointsToAward = 100; // 100 points for a completed/validated eco report

      await pool.query(
        "INSERT INTO point_transactions (user_id, points, type, description) VALUES (?, ?, 'earn', ?)",
        [report.user_id, pointsToAward, `Points for validated report ID #${report.id}`]
      );

      await pool.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsToAward, report.user_id]);

      await pool.query(
        "INSERT INTO notifications (user_id, recipient_role, title, message, type, report_id) VALUES (?, 'user', ?, ?, 'reward', ?)",
        [
          report.user_id,
          'Points Credited!',
          `Congratulations! You received ${pointsToAward} eco-points for Report #${report.id}.`,
          report.id,
        ]
      );
    }
  }
}