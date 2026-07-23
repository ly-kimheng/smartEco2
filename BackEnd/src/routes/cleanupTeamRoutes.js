import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import * as Task from '../models/task.js';
import NotificationService from '../services/notificationService.js';
import db from '../config/database.js';

const router = express.Router();

router.use(protect, checkRole('cleanup_team'));

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.findByAssignee(req.user.id);
    console.log(`[GET /cleanup-team/tasks] crew id=${req.user.id} (${req.user.name}) -> ${tasks.length} task(s): [${tasks.map(t => `#${t.id} assigned_to=${t.assigned_to}`).join(', ')}]`);
    res.json({ tasks });
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

router.patch('/tasks/:id/status', async (req, res) => {
  try {
    // progress is optional in the request body (0-100). Clamp it so a bad
    // client value can't push the column out of range or go backwards
    // past what was already recorded.
    let progress = req.body.progress;
    if (progress !== undefined && progress !== null) {
      progress = Math.max(0, Math.min(100, Number(progress)));
      if (Number.isNaN(progress)) progress = null;
    } else {
      progress = null;
    }

    await Task.updateStatus(req.params.id, req.body.status, progress);

    // Auto-notify admins the moment a crew updates progress on a task —
    // include the percentage so the dashboard shows more than just the
    // 3-state status label.
    const task = await Task.findById(req.params.id);
    if (task) {
      const progressLabel = task.progress !== null && task.progress !== undefined
        ? ` (${task.progress}%)`
        : '';
      await NotificationService.notifyAllAdmins({
        title: 'Cleanup task status updated',
        message: `${req.user.name} set "${task.title}" to "${req.body.status}"${progressLabel}.`,
        type: 'task',
        reportId: task.report_id
      });
    }

    res.json({ message: 'Task status updated', progress: task?.progress ?? null });
  } catch (error) {
    console.error('updateStatus error:', error);
    res.status(500).json({ message: 'Server error while updating task status' });
  }
});

router.patch('/tasks/:id/complete', upload.single('afterImage'), async (req, res) => {
  try {
    const afterImageUrl = req.file ? `/uploads/reports/${req.file.filename}` : null;
    await Task.complete(req.params.id, afterImageUrl);

    // Auto-notify admins that the task is done and ready for review.
    const task = await Task.findById(req.params.id);
    if (task) {
      await NotificationService.notifyAllAdmins({
        title: 'Cleanup task completed',
        message: `${req.user.name} marked "${task.title}" as completed.`,
        type: 'task',
        reportId: task.report_id
      });

      // If this task was tied back to a citizen report, let the reporter know too.
      // The after-photo already lives on `tasks.after_image_url` (set by
      // Task.complete above) and reaches the citizen's report automatically
      // through the LEFT JOIN in Report.findById/getAll/findByUserId — there's
      // no separate `reports.after_image_url` column to copy it into (see the
      // design note in Database/defaultdb.sql, Section 2).
      if (task.report_id) {
        const [[report]] = await db.query(
          'SELECT user_id FROM reports WHERE id = ?',
          [task.report_id]
        );
        if (report && report.user_id) {
          // type must be 'cleanup_completed' — that's what the frontend
          // (Header.jsx) checks to show the "View after photo" link and
          // deep-link into the report detail view.
          await NotificationService.notifyUser(report.user_id, {
            title: 'Your report has been cleaned up!',
            message: `The cleanup crew finished "${task.title}" on Report #${task.report_id}. Thanks for reporting it!`,
            type: 'cleanup_completed',
            reportId: task.report_id,
            imageUrl: afterImageUrl
          });
        }
      }
    }

    res.json({ message: 'Task completed' });
  } catch (error) {
    console.error('completeTask error:', error);
    res.status(500).json({ message: 'Server error while completing task' });
  }
});

export default router;
