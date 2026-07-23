import express from 'express';
import GuideController from '../controllers/guideController.js';
import { protect } from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';
import { createUploader } from '../middleware/uploadMiddleware.js';

const router = express.Router();
const upload = createUploader('guides');

// Mirrors BackEnd/src/routes/rewardRoutes.js — every route needs a valid
// token; the list route itself decides what to return based on role
// (citizens/crew get published guides only, admins get everything
// including unpublished drafts), and the write routes are admin-only.
router.use(protect);

// Browse guides — any logged-in account. Admins get drafts too (see
// GuideController.getGuides).
router.get('/', GuideController.getGuides);

// Manage the guide catalog — admin-only.
router.post('/', checkRole('admin'), upload.single('image'), GuideController.createGuide);
router.put('/:id', checkRole('admin'), upload.single('image'), GuideController.updateGuide);
router.delete('/:id', checkRole('admin'), GuideController.deleteGuide);

export default router;
