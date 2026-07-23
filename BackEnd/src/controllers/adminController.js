import AdminService from '../services/adminService.js';

class AdminController {
  static async getDashboardData(req, res) {
    try {
      const stats = await AdminService.getSystemStats();
      res.status(200).json({
        success: true,
        timestamp: new Date(),
        data: stats
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Server Fault' });
    }
  }

  static async getAllReports(req, res) {
    try {
      const reports = await AdminService.listAllReports();
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateReportStatus(req, res) {
    try {
      const { reportId } = req.params;
      const { status } = req.body;
      const adminId = req.user ? req.user.id : 1;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status state is required' });
      }

      const result = await AdminService.updateReportStatus(reportId, status, adminId);
      res.status(200).json({
        success: true,
        message: 'Report status updated and saved successfully',
        data: result
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/admin/reports/:reportId — single report + all citizen feedback
  static async getReportDetail(req, res) {
    try {
      const { reportId } = req.params;
      const report = await AdminService.getReportDetail(reportId);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH /api/admin/reports/:reportId/assign — assign or reassign a crew
  // (and/or priority) directly from the Reports page.
  static async reassignReport(req, res) {
    try {
      const { reportId } = req.params;
      const { assignedTo, priority } = req.body;
      const report = await AdminService.reassignTask(reportId, { assignedTo, priority });
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // GET /api/admin/users — citizen directory
  static async getUsers(req, res) {
    try {
      const users = await AdminService.listUsers();
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/admin/cleanup-team — crew list for the "assignee" dropdown
  static async getCleanupTeam(req, res) {
    try {
      const crew = await AdminService.listCleanupTeam();
      res.status(200).json({ success: true, data: crew });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/admin/tasks — every dispatched cleanup task
  static async getTasks(req, res) {
    try {
      const tasks = await AdminService.listTasks();
      res.status(200).json({ success: true, data: tasks });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/admin/tasks — dispatch a cleanup crew (optionally tied to a report)
  static async assignTask(req, res) {
    try {
      const { reportId, assignedTo, title, description, location, priority } = req.body;
      const task = await AdminService.assignTask({ reportId, assignedTo, title, description, location, priority });
      res.status(201).json({
        success: true,
        message: 'Task assigned and cleanup team notified',
        data: task
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
  // PATCH /api/admin/reports/:reportId/after-image — admin replaces the
  // after-cleanup photo (override; normally set by the cleanup team).
  static async replaceAfterImage(req, res) {
    try {
      const { reportId } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'An image file is required' });
      }
      const afterImageUrl = `/uploads/reports/${req.file.filename}`;
      const report = await AdminService.replaceReportAfterImage(reportId, afterImageUrl);
      res.status(200).json({ success: true, message: 'After-cleanup photo replaced', data: report });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/admin/reports/:reportId/after-image — admin removes the
  // after-cleanup photo entirely.
  static async removeAfterImage(req, res) {
    try {
      const { reportId } = req.params;
      const report = await AdminService.removeReportAfterImage(reportId);
      res.status(200).json({ success: true, message: 'After-cleanup photo removed', data: report });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/admin/backup/tables — table names for the "single table" dropdown.
  static async getBackupTables(req, res) {
    try {
      const tables = await AdminService.listBackupTables();
      res.status(200).json({ success: true, data: tables });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/admin/backup — downloads a .sql backup. Add ?table=<name> for a
  // single-table backup instead of the full database (full is the default).
  static async downloadBackup(req, res) {
    try {
      const { table } = req.query;
      const sql = table ? await AdminService.createTableBackupSQL(table) : await AdminService.createFullBackupSQL();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = table ? `smarteco_backup_${table}_${stamp}.sql` : `smarteco_backup_full_${stamp}.sql`;
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(sql);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // POST /api/admin/backup/restore — runs an uploaded .sql backup file
  // (full or single-table) against the database. Destructive; frontend
  // confirms first.
  static async restoreBackup(req, res) {
    try {
      const sqlText = req.body && typeof req.body.sql === 'string' ? req.body.sql : null;
      if (!sqlText) {
        return res.status(400).json({ success: false, message: 'Missing "sql" field with the backup file contents.' });
      }
      const result = await AdminService.restoreFromSQL(sqlText);
      res.status(200).json({ success: true, message: 'Database restored from SQL backup', data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

export default AdminController;
