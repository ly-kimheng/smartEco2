/**kimheng's part */

import express from 'express';
import RewardController from '../controllers/rewardController.js';
import { protect } from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';
import { createUploader } from '../middleware/uploadMiddleware.js';

const router = express.Router();
const upload = createUploader('rewards');

// Every reward route requires a valid token — claim/list need req.user to
// know WHO is claiming/browsing, and the catalog-management routes need it
// to know whether the caller is actually an admin (see checkRole below).
// This was previously missing entirely, which meant every claim silently
// fell back to a hardcoded userId and the catalog-management routes were
// wide open to anyone, logged in or not.
router.use(protect);

// Fetch fully available reward items — any logged-in account can browse
router.get('/', RewardController.getRewards);

// Request dynamic point redemption for selected item — citizen-only, since
// only citizen accounts (`users` table) accrue points to spend.
router.post('/claim', checkRole('user'), RewardController.claim);

// Every voucher this citizen has redeemed (Active + Redeemed) — persists
// so a claimed reward stays visible until they actually use it.
router.get('/my-vouchers', checkRole('user'), RewardController.getMyVouchers);

// Manage inventory additions and catalog state updates — admin-only.
router.post('/add', checkRole('admin'), upload.single('image'), RewardController.createReward);
router.put('/:id', checkRole('admin'), upload.single('image'), RewardController.updateReward);
router.delete('/:id', checkRole('admin'), RewardController.deleteReward);

export default router;
