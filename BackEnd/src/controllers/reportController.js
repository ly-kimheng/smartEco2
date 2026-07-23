import Report from '../models/Report.js';
import Feedback from '../models/feedback.js';
import NotificationService from '../services/notificationService.js';
import AdminService from '../services/adminService.js';

// GET /api/reports/community-stats  (public — no login required)
// Reuses AdminService.getSystemStats(), the exact same function the admin
// dashboard calls, so the citizen-facing numbers can never drift out of
// sync with what admin sees — same query, same numbers, always.
export async function getCommunityStats(req, res) {
  try {
    const stats = await AdminService.getSystemStats();
    res.status(200).json({
      totalReports: stats.totalReports,
      resolvedReports: stats.resolvedReports,
      totalUsers: stats.totalUsers,
    });
  } catch (error) {
    console.error('getCommunityStats error:', error);
    res.status(500).json({ message: 'Server error while fetching community stats' });
  }
}

// Daily submission cap: at most MAX_REPORTS_PER_WINDOW reports per rolling
// WINDOW_HOURS-hour window per citizen. Rolling (not calendar-day) so it
// can't be gamed by filing right before/after midnight.
const MAX_REPORTS_PER_WINDOW = 2;
const WINDOW_HOURS = 24;

// How much longer until the user's oldest report in the window "ages out"
// and frees up a slot. Returns a whole number of hours, minimum 1 so the
// message never reads "wait 0 hours".
function hoursUntilSlotFrees(oldestTimestamp) {
  const oldestMs = new Date(oldestTimestamp).getTime();
  const freesAt = oldestMs + WINDOW_HOURS * 60 * 60 * 1000;
  const msRemaining = freesAt - Date.now();
  return { freesAt: new Date(freesAt), hoursRemaining: Math.max(1, Math.ceil(msRemaining / (60 * 60 * 1000))) };
}

// GET /api/reports/limit-status  (protected)
// Lets the report form check *before* the user fills everything out whether
// they still have a submission slot left today, and if not, when they'll get
// one back. nextSlotAt is a precise timestamp so the frontend can run a live
// countdown instead of only showing a rounded "~N hours" message.
export async function getReportLimitStatus(req, res) {
  try {
    const { count, oldest } = await Report.countRecentByUser(req.user.id, WINDOW_HOURS);
    const remaining = Math.max(0, MAX_REPORTS_PER_WINDOW - count);
    let nextSlotAt = null;
    let hoursRemaining = null;
    if (remaining <= 0 && oldest) {
      const { freesAt, hoursRemaining: h } = hoursUntilSlotFrees(oldest);
      nextSlotAt = freesAt;
      hoursRemaining = h;
    }
    res.status(200).json({
      max: MAX_REPORTS_PER_WINDOW,
      used: count,
      remaining,
      nextSlotAt,
      hoursRemaining,
    });
  } catch (error) {
    console.error('getReportLimitStatus error:', error);
    res.status(500).json({ message: 'Server error while checking report limit' });
  }
}

// POST /api/reports
// user 
export async function createReport(req, res) {
  try {
    const { title, description, location, category } = req.body;
    let { priority } = req.body;
    const userId = req.user.id;
    const reportedBy = req.user.name;
    const imageUrl = req.file ? `/uploads/reports/${req.file.filename}` : null;

    if (!title || !description || !location || !category) {
      return res.status(400).json({ message: 'title, description, location, and category are required' });
    }

    // Enforce the daily cap: at most MAX_REPORTS_PER_WINDOW reports per
    // rolling WINDOW_HOURS-hour window. 429 (Too Many Requests) so the
    // frontend can tell this apart from a validation error.
    const { count, oldest } = await Report.countRecentByUser(userId, WINDOW_HOURS);
    if (count >= MAX_REPORTS_PER_WINDOW) {
      const { freesAt, hoursRemaining } = hoursUntilSlotFrees(oldest);
      return res.status(429).json({
        message: `You've reached today's limit of ${MAX_REPORTS_PER_WINDOW} reports. Please wait about ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'} before submitting another.`,
        hoursRemaining,
        nextSlotAt: freesAt,
      });
    }

    // The report form sends "low"/"medium"/"high" (severity); fall back to
    // medium for any older client that doesn't send this yet.
    priority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

    const report = await Report.create({ userId, title, description, location, category, priority, imageUrl, reportedBy });

    // Auto-notify every admin the moment a citizen files a new report.
    NotificationService.notifyAllAdmins({
      title: 'New waste report submitted',
      message: `${reportedBy} reported "${title}" at ${location}.`,
      type: 'report',
      reportId: report.id
    }).catch((err) => console.error('notifyAllAdmins error:', err));

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('createReport error:', error);
    res.status(500).json({ message: 'Server error while creating report' });
  }
}

// GET /api/reports
// for admin 
export async function getAllReports(req, res) {
  try {
    const reports = await Report.getAll();
    res.status(200).json({ reports });
  } catch (error) {
    console.error('getAllReports error:', error);
    res.status(500).json({ message: 'Server error while fetching reports' });
  }
}

// GET /api/reports/my

//user see her report
export async function getMyReports(req, res) {
  try {
    const reports = await Report.findByUserId(req.user.id);
    res.status(200).json({ reports });
  } catch (error) {
    console.error('getMyReports error:', error);
    res.status(500).json({ message: 'Server error while fetching your reports' });
  }
}

// GET /api/reports/:id
export async function getReportById(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json({ report });
  } catch (error) {
    console.error('getReportById error:', error);
    res.status(500).json({ message: 'Server error while fetching report' });
  }
}

// GET /api/reports/votable  (public — optionalAuth)
export async function getVotableReports(req, res) {
  try {
    const reports = await Report.getVotable(req.user?.id);
    res.status(200).json({ reports });
  } catch (error) {
    console.error('getVotableReports error:', error);
    res.status(500).json({ message: 'Server error while fetching votable reports' });
  }
}

// POST /api/reports/:id/vote  (protected)
export async function voteReport(req, res) {
  try {
    const result = await Report.addVote(req.user.id, req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('voteReport error:', error);
    res.status(500).json({ message: 'Server error while voting' });
  }
}

// DELETE /api/reports/:id/vote  (protected)
export async function unvoteReport(req, res) {
  try {
    const result = await Report.removeVote(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    console.error('unvoteReport error:', error);
    res.status(500).json({ message: 'Server error while removing vote' });
  }
}

// POST /api/reports/:id/feedback  (protected — the citizen who filed the
// report rates the cleanup once it's Resolved; this is what notifies the
// admin side that feedback came in.)
export async function submitFeedback(req, res) {
  try {
    const reportId = req.params.id;
    const { rating, comment } = req.body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'A rating from 1 to 5 is required' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only leave feedback on your own reports' });
    }
    if (report.status !== 'Resolved') {
      return res.status(400).json({ message: 'Feedback can only be left once a report is Resolved' });
    }

    const feedback = await Feedback.create({
      userId: req.user.id,
      reportId,
      rating: numericRating,
      comment,
    });

    // Auto-notify admins the moment a citizen leaves feedback — same
    // pattern as the other user -> admin auto-notifications.
    NotificationService.notifyAllAdmins({
      title: 'New citizen feedback',
      message: `${req.user.name} rated report #${reportId} ${numericRating}/5.`,
      type: 'feedback',
      reportId,
    }).catch((err) => console.error('notifyAllAdmins error:', err));

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ message: 'Server error while submitting feedback' });
  }
}

// GET /api/reports/:id/feedback  (protected — the reporting citizen sees
// only their own feedback here; admins use /api/admin/reports/:id instead,
// which returns every citizen's feedback on that report.)
export async function getReportFeedback(req, res) {
  try {
    const reportId = req.params.id;
    const feedback = await Feedback.findByReportIdAndUser(reportId, req.user.id);
    res.status(200).json({ feedback });
  } catch (error) {
    console.error('getReportFeedback error:', error);
    res.status(500).json({ message: 'Server error while fetching feedback' });
  }
}

// DELETE /api/reports/:id
export async function deleteReport(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    await Report.delete(req.params.id);
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('deleteReport error:', error);
    res.status(500).json({ message: 'Server error while deleting report' });
  }
}