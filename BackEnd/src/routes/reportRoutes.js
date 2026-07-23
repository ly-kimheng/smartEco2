import { Router } from 'express';
import { createReport, getAllReports, getMyReports, getReportById, deleteReport, getVotableReports, voteReport, unvoteReport, submitFeedback, getReportFeedback, getCommunityStats, getReportLimitStatus } from '../controllers/reportController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = Router();

// All report routes require login
router.post('/', protect, upload.single('image'), createReport);
router.get('/', protect, getAllReports);
router.get('/my', protect, getMyReports);

// Daily submission-cap check — /limit-status must come before the /:id
// catch-all below, otherwise Express treats "limit-status" as an :id.
router.get('/limit-status', protect, getReportLimitStatus);

// Public — same real numbers admin sees, no auth needed to view them
router.get('/community-stats', getCommunityStats);

// Voting — /votable must come before the /:id catch-all below, otherwise
// Express treats "votable" as an :id and this never gets hit.
router.get('/votable', optionalAuth, getVotableReports);
router.post('/:id/vote', protect, voteReport);
router.delete('/:id/vote', protect, unvoteReport);

// Citizen feedback on a resolved report
router.post('/:id/feedback', protect, submitFeedback);
router.get('/:id/feedback', protect, getReportFeedback);

router.get('/:id', protect, getReportById);
router.delete('/:id', protect, deleteReport);

export default router;