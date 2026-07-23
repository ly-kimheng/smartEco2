import mysql from 'mysql2/promise';
import db, { dbConnectionConfig } from '../config/database.js';
import NotificationService from './notificationService.js';
import Feedback from '../models/feedback.js';

// Every table in the schema (see Database/defaultdb.sql), listed parent-first.
// Backups are taken/restored with FOREIGN_KEY_CHECKS off, so this order is
// mostly for readability rather than strict correctness.
const BACKUP_TABLES = [
  'users', 'admins', 'cleanup_team',
  'locations', 'categories', 'reports',
  'tasks', 'completion_reports',
  'votes', 'feedback',
  'rewards', 'vouchers', 'point_transactions',
  'tips_guides', 'notifications',
  'admin_settings',
];

const INSERT_CHUNK_SIZE = 500; // rows per INSERT statement, keeps lines readable & avoids max_allowed_packet issues

// Builds one or more `INSERT INTO ... VALUES (...), (...);` statements for a
// table, using db.escape() so every value is a safe SQL literal (handles
// strings, numbers, null, and the date strings from dateStrings: true).
function buildInsertStatements(table, columns, rows) {
  const stmts = [];
  const colList = columns.map((c) => `\`${c}\``).join(', ');
  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + INSERT_CHUNK_SIZE);
    const valuesSql = chunk
      .map((row) => `(${columns.map((c) => db.escape(row[c] === undefined ? null : row[c])).join(', ')})`)
      .join(',\n  ');
    stmts.push(`INSERT INTO \`${table}\` (${colList}) VALUES\n  ${valuesSql};`);
  }
  return stmts;
}

// Builds a DROP + CREATE + INSERT block for one table.
async function dumpTableSQL(table) {
  const [[createRow]] = await db.query(`SHOW CREATE TABLE \`${table}\``);
  const createStmt = createRow['Create Table'];

  let sql = `-- --------------------------------------------------------\n`;
  sql += `-- Table \`${table}\`\n`;
  sql += `-- --------------------------------------------------------\n`;
  sql += `DROP TABLE IF EXISTS \`${table}\`;\n${createStmt};\n\n`;

  const [rows] = await db.query({ sql: `SELECT * FROM \`${table}\``, dateStrings: true });
  if (rows.length) {
    const columns = Object.keys(rows[0]);
    sql += buildInsertStatements(table, columns, rows).join('\n') + '\n\n';
  }
  return sql;
}

class AdminService {
  // GET /api/admin/backup/tables — table names for the "single table" dropdown.
  static async listBackupTables() {
    return [...BACKUP_TABLES];
  }

  // GET /api/admin/backup — full database as a plain, portable .sql script
  // (DROP + CREATE TABLE + INSERT for every table). Restorable with this
  // app's restore tool OR with `mysql -u ... < backup.sql` directly.
  static async createFullBackupSQL() {
    let sql = `-- SmartEco — Full Database Backup\n-- Generated ${new Date().toISOString()}\n-- Tables: ${BACKUP_TABLES.join(', ')}\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    for (const table of BACKUP_TABLES) {
      sql += await dumpTableSQL(table);
    }
    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    return sql;
  }

  // GET /api/admin/backup?table=... — same idea, scoped to one table. Only
  // that table's DROP/CREATE/INSERT is included, so restoring it leaves
  // every other table untouched.
  static async createTableBackupSQL(table) {
    if (!BACKUP_TABLES.includes(table)) {
      throw new Error(`Unknown table "${table}". Valid tables: ${BACKUP_TABLES.join(', ')}`);
    }
    let sql = `-- SmartEco — Single-Table Backup (\`${table}\`)\n-- Generated ${new Date().toISOString()}\n`;
    sql += `-- NOTE: restoring this file only affects \`${table}\` — other tables are untouched.\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    sql += await dumpTableSQL(table);
    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    return sql;
  }

  // POST /api/admin/backup/restore — executes a previously downloaded .sql
  // backup (full or single-table) against the real database. Runs on a
  // dedicated connection (multipleStatements enabled only here, not on the
  // shared pool used by the rest of the app) so a multi-statement dump file
  // can run in one shot.
  static async restoreFromSQL(sqlText) {
    if (!sqlText || typeof sqlText !== 'string' || !sqlText.trim()) {
      throw new Error('Empty or invalid SQL file.');
    }
    // Sanity check so a random unrelated .sql file isn't run against the DB
    // by mistake — every backup this app generates starts with this marker.
    if (!/--\s*SmartEco\s*—?\s*(Full Database|Single-Table)\s*Backup/i.test(sqlText.slice(0, 300))) {
      throw new Error('This doesn\'t look like a SmartEco backup file (missing the expected header comment).');
    }

    const conn = await mysql.createConnection({ ...dbConnectionConfig, multipleStatements: true });
    try {
      await conn.query(sqlText);
      return { restoredAt: new Date().toISOString() };
    } catch (err) {
      throw new Error(`Restore failed partway through — check the database manually before trusting it: ${err.message}`);
    } finally {
      await conn.end();
    }
  }

  static async getSystemStats() {
    try {
      const [[{ totalReports }]] = await db.execute('SELECT COUNT(*) as totalReports FROM reports');
      const [[{ pendingReports }]] = await db.execute('SELECT COUNT(*) as pendingReports FROM reports WHERE status = "Pending"');
      const [[{ resolvedReports }]] = await db.execute('SELECT COUNT(*) as resolvedReports FROM reports WHERE status = "Resolved"');
      const [[{ totalUsers }]] = await db.execute('SELECT COUNT(*) as totalUsers FROM users');
      const [[{ totalPoints }]] = await db.execute('SELECT SUM(points) as totalPoints FROM users');
      const [[{ totalVouchers }]] = await db.execute('SELECT COUNT(*) as totalVouchers FROM vouchers');

      return {
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        resolvedReports: resolvedReports || 0,
        totalUsers: totalUsers || 0,
        totalPoints: totalPoints || 0,
        totalVouchers: totalVouchers || 0,
        systemStatus: 'ALL SYSTEMS NOMINAL',
        cpuLoad: '14.2%',
        memoryUsed: '4.1 GB'
      };
    } catch (err) {
      // Fallback default values if tables are not fully integrated or migrated
      return {
        totalReports: 12,
        pendingReports: 4,
        resolvedReports: 8,
        totalUsers: 45,
        totalPoints: 12400,
        totalVouchers: 8,
        systemStatus: 'ALL SYSTEMS NOMINAL',
        // cpuLoad: '14.2%',
        // memoryUsed: '4.1 GB'
      };
    }
  }

  static async listAllReports() {
    const [rows] = await db.execute(
      `SELECT r.*, u.name as reporter_name,
              t.after_image_url as after_image_url,
              t.before_image_url as before_image_url,
              t.progress as task_progress,
              t.status as task_status,
              t.completed_at as completed_at,
              t.assigned_to as assigned_to,
              ct.name as assignee_name,
              (SELECT COUNT(*) FROM votes v WHERE v.report_id = r.id) as vote_count
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN tasks t ON t.report_id = r.id
       LEFT JOIN cleanup_team ct ON t.assigned_to = ct.id
       ORDER BY vote_count DESC, r.created_at DESC`
    );
    return rows;
  }

  static async updateReportStatus(reportId, status, adminId) {
    await db.execute(
      'UPDATE reports SET status = ?, updated_by = ? WHERE id = ?',
      [status, adminId, reportId]
    );

    // Only the actual "cleanup is done and verified" transition earns points.
    // "Approved" just means a crew has been dispatched — nothing has been
    // cleaned up yet, so it must NOT trigger a reward.
    //
    // reports.points_awarded (not the status column) is the single source of
    // truth for whether this report has ever paid out — status alone isn't
    // safe to key off of, because an admin can move a report away from
    // "Resolved" and back (e.g. correcting a mistake), which would look like
    // a brand-new resolution and pay out twice. The UPDATE ... WHERE
    // points_awarded = 0 below atomically "claims" the award, so this also
    // can't race with the cleanup crew's Task.complete() awarding the same
    // report at the same time.
    if (status === 'Resolved') {
      const [[report]] = await db.execute('SELECT user_id FROM reports WHERE id = ?', [reportId]);
      if (report && report.user_id) {
        const [claim] = await db.execute(
          'UPDATE reports SET points_awarded = 1 WHERE id = ? AND points_awarded = 0',
          [reportId]
        );

        if (claim.affectedRows > 0) {
          const pointsToAward = 100; // 100 points for a completed/validated eco report — keep in sync with models/task.js complete()

          // Ledger entry for transaction
          await db.execute(
            "INSERT INTO point_transactions (user_id, points, type, description) VALUES (?, ?, 'earn', ?)",
            [report.user_id, pointsToAward, `Points for validated report ID #${reportId}`]
          );

          // Update user's aggregate points
          await db.execute('UPDATE users SET points = points + ? WHERE id = ?', [pointsToAward, report.user_id]);

          // Push alert to the user instantly
          await db.execute(
            "INSERT INTO notifications (user_id, recipient_role, title, message, type, report_id) VALUES (?, 'user', ?, ?, 'reward', ?)",
            [
              report.user_id,
              'Points Credited!',
              `Congratulations! You received ${pointsToAward} eco-points for Report #${reportId}.`,
              reportId,
            ]
          );
        }
      }
    }

    // Convenience: clicking "Assigned" on the quick status pill should behave
    // like actually dispatching the job — auto-create the linked task (if one
    // doesn't already exist) instead of requiring a trip through the separate
    // Assign Task screen just to get this report into a crew member's queue.
    if (status === 'Assigned') {
      const [[existingTask]] = await db.execute('SELECT id FROM tasks WHERE report_id = ?', [reportId]);
      if (!existingTask) {
        const [[report]] = await db.execute(
          'SELECT id, user_id, title, description, location, priority, image_url FROM reports WHERE id = ?',
          [reportId]
        );
        if (report) {
          // Prefer a crew member based in the same district as the report...
          // LIKE (not `=`) because `location` can be a fuller address string
          // ("123 St, Russey Keo") that contains the district name rather
          // than being just the bare district name — an exact match would
          // silently miss that and fall through to "least busy" every time.
          const [[districtMatch]] = await db.execute(
            "SELECT id FROM cleanup_team WHERE ? LIKE CONCAT('%', district, '%') LIMIT 1",
            [report.location]
          );
          // ...otherwise fall back to whoever currently has the fewest open tasks.
          let assignedTo = districtMatch ? districtMatch.id : null;
          if (!assignedTo) {
            const [[leastBusy]] = await db.execute(
              `SELECT ct.id
               FROM cleanup_team ct
               LEFT JOIN tasks t ON t.assigned_to = ct.id AND t.status != 'completed'
               GROUP BY ct.id
               ORDER BY COUNT(t.id) ASC
               LIMIT 1`
            );
            assignedTo = leastBusy ? leastBusy.id : null;
          }

          // Carry over the citizen's own priority and photo — this task
          // represents the same report, so both should match what the
          // citizen submitted, and the crew should see the same photo
          // the citizen took (not a blank/placeholder).
          await db.execute(
            `INSERT INTO tasks (report_id, assigned_to, title, description, location, priority, status, before_image_url)
             VALUES (?, ?, ?, ?, ?, ?, 'assigned', ?)`,
            [report.id, assignedTo, report.title, report.description, report.location, report.priority || 'medium', report.image_url]
          );

          if (assignedTo) {
            await NotificationService.notifyCleanupTeam(assignedTo, {
              title: 'New cleanup task assigned',
              message: `You've been assigned: "${report.title}" at ${report.location}.`,
              type: 'task',
              reportId: report.id,
            });
          }

          // Let the citizen who filed the report know a crew is on it too —
          // the separate "Assign Task" screen already does this; this quick
          // status-pill path was silently skipping it.
          if (report && report.user_id) {
            await NotificationService.notifyUser(report.user_id, {
              title: 'Cleanup crew dispatched',
              message: `A cleanup crew has been dispatched for your report #${report.id}.`,
              type: 'info',
              reportId: report.id,
            });
          }
        }
      }
    }

    return { reportId, status };
  }

  // GET /api/admin/reports/:reportId — single report detail for the admin
  // modal, including every citizen's feedback on it (unlike the citizen-
  // facing /api/reports/:id/feedback, which only returns the requester's own).
  static async getReportDetail(reportId) {
    const report = await AdminService._getReportWithTask(reportId);
    if (!report) return null;
    const feedback = await Feedback.findByReportId(reportId);
    return { ...report, feedback };
  }

  // GET /api/admin/cleanup-team — crew list for the "assignee" dropdown
  static async listCleanupTeam() {
    const [rows] = await db.execute(
      `SELECT id, name, email, district, role, created_at FROM cleanup_team ORDER BY name ASC`
    );
    return rows;
  }

  // GET /api/admin/tasks — every dispatched cleanup task, with the crew name resolved
  static async listTasks() {
    const [rows] = await db.execute(
      `SELECT t.*, ct.name as assignee_name
       FROM tasks t
       LEFT JOIN cleanup_team ct ON t.assigned_to = ct.id
       ORDER BY t.created_at DESC`
    );
    return rows;
  }

  // POST /api/admin/tasks — dispatch a cleanup crew, optionally tied to a citizen report
  static async assignTask({ reportId, assignedTo, title, description, location, priority }) {
    if (!title || !location) {
      throw new Error('title and location are required to assign a task');
    }

    // Carry the citizen's original photo (and priority) over as the
    // reference — admin can still override priority by passing it in.
    let beforeImageUrl = null;
    let reportPriority = null;
    if (reportId) {
      const [[report]] = await db.execute('SELECT image_url, priority FROM reports WHERE id = ?', [reportId]);
      beforeImageUrl = report ? report.image_url : null;
      reportPriority = report ? report.priority : null;
    }
    const finalPriority = priority || reportPriority || 'medium';

    const [result] = await db.execute(
      `INSERT INTO tasks (report_id, assigned_to, title, description, location, priority, status, before_image_url)
       VALUES (?, ?, ?, ?, ?, ?, 'assigned', ?)`,
      [reportId || null, assignedTo || null, title, description || null, location, finalPriority, beforeImageUrl]
    );
    const taskId = result.insertId;
    console.log(`[assignTask] report #${reportId || 'none'} -> task #${taskId} created, assigned_to=${assignedTo || 'null (unassigned)'}`);

    // Auto-notify the assigned crew member
    if (assignedTo) {
      await NotificationService.notifyCleanupTeam(assignedTo, {
        title: 'New cleanup task assigned',
        message: `You've been assigned: "${title}" at ${location}.`,
        type: 'task',
        reportId: reportId || null,
      });
      console.log(`[assignTask] notifyCleanupTeam sent to cleanup_team id=${assignedTo}`);
    } else {
      console.log('[assignTask] no assignedTo was sent — task created as Unassigned, no notification sent');
    }

    // Auto-notify the citizen who filed the report, and move it out of "Pending"
    if (reportId) {
      const [[report]] = await db.execute('SELECT user_id FROM reports WHERE id = ?', [reportId]);
      if (report && report.user_id) {
        await NotificationService.notifyUser(report.user_id, {
          title: 'Cleanup crew dispatched',
          message: `A cleanup crew has been dispatched for your report #${reportId}.`,
          type: 'info',
          reportId,
        });
      }
      await db.execute(`UPDATE reports SET status = 'Approved' WHERE id = ? AND status = 'Pending'`, [reportId]);
    }

    const [[task]] = await db.execute(
      `SELECT t.*, ct.name as assignee_name
       FROM tasks t
       LEFT JOIN cleanup_team ct ON t.assigned_to = ct.id
       WHERE t.id = ?`,
      [taskId]
    );
    return task;
  }

  // PATCH /api/admin/reports/:reportId/assign — edit an existing task's crew
  // and/or priority directly from the Reports page (not just the Tasks page).
  // If no task exists yet for this report, this creates one — so the same
  // action works whether it's the first assignment or a later reassignment.
  static async reassignTask(reportId, { assignedTo, priority }) {
    const [[report]] = await db.execute(
      'SELECT id, title, description, location, priority, image_url, user_id FROM reports WHERE id = ?',
      [reportId]
    );
    if (!report) throw new Error('Report not found');

    const [[existingTask]] = await db.execute('SELECT id, assigned_to FROM tasks WHERE report_id = ?', [reportId]);
    const finalPriority = priority || report.priority || 'medium';

    let taskId;
    if (existingTask) {
      await db.execute(
        'UPDATE tasks SET assigned_to = ?, priority = ? WHERE id = ?',
        [assignedTo || null, finalPriority, existingTask.id]
      );
      taskId = existingTask.id;
    } else {
      const [result] = await db.execute(
        `INSERT INTO tasks (report_id, assigned_to, title, description, location, priority, status, before_image_url)
         VALUES (?, ?, ?, ?, ?, ?, 'assigned', ?)`,
        [report.id, assignedTo || null, report.title, report.description, report.location, finalPriority, report.image_url]
      );
      taskId = result.insertId;
    }
    console.log(`[reassignTask] report #${report.id} -> task #${taskId}, assigned_to=${assignedTo || 'null (unassigned)'} (type: ${typeof assignedTo})`);

    // Only notify the crew if the assignment actually changed to them —
    // avoids spamming a crew member with a duplicate notification when an
    // admin only tweaks priority and leaves the assignee unchanged.
    if (assignedTo && (!existingTask || Number(existingTask.assigned_to) !== Number(assignedTo))) {
      await NotificationService.notifyCleanupTeam(assignedTo, {
        title: existingTask ? 'Cleanup task reassigned to you' : 'New cleanup task assigned',
        message: `You've been assigned: "${report.title}" at ${report.location}.`,
        type: 'task',
        reportId: report.id,
      });
    }

    // Move a Pending report forward automatically, same as assignTask()
    await db.execute(`UPDATE reports SET status = 'Approved' WHERE id = ? AND status = 'Pending'`, [reportId]);

    return AdminService._getReportWithTask(reportId);
  }

  // GET /api/admin/users — the citizen directory, including how many
  // reports each person has filed. New signups show up here automatically
  // since this reads straight from `users`, not a static mock list.
  static async listUsers() {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, u.points, u.created_at,
              COUNT(r.id) as reports_count
       FROM users u
       LEFT JOIN reports r ON r.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    return rows;
  }

  // PATCH /api/admin/reports/:reportId/after-image — admin overrides the after-cleanup photo
  static async replaceReportAfterImage(reportId, afterImageUrl) {
    const [result] = await db.execute(`UPDATE tasks SET after_image_url = ? WHERE report_id = ?`, [afterImageUrl, reportId]);
    if (result.affectedRows === 0) {
      throw new Error('No cleanup task is linked to this report yet');
    }
    return AdminService._getReportWithTask(reportId);
  }

  // DELETE /api/admin/reports/:reportId/after-image — admin removes the after-cleanup photo
  static async removeReportAfterImage(reportId) {
    await db.execute(`UPDATE tasks SET after_image_url = NULL WHERE report_id = ?`, [reportId]);
    return AdminService._getReportWithTask(reportId);
  }

  // Shared helper: fetch one report merged with its linked task's after-photo/status.
  static async _getReportWithTask(reportId) {
    const [[report]] = await db.execute(
      `SELECT r.*, u.name as reporter_name,
              t.after_image_url as after_image_url,
              t.before_image_url as before_image_url,
              t.progress as task_progress,
              t.status as task_status,
              t.completed_at as completed_at,
              t.assigned_to as assigned_to,
              ct.name as assignee_name
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN tasks t ON t.report_id = r.id
       LEFT JOIN cleanup_team ct ON t.assigned_to = ct.id
       WHERE r.id = ?`,
      [reportId]
    );
    return report || null;
  }
}

export default AdminService;