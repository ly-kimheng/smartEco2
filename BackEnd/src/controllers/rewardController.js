/**kimheng's part */

import RewardService from '../services/rewardService.js';
import RewardModel from '../models/Reward.js';

class RewardController {
  static async getRewards(req, res) {
    try {
      const rewards = await RewardService.listRewards();
      res.status(200).json({
        success: true,
        data: rewards
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async claim(req, res) {
    try {
      const { rewardId } = req.body;
      const userId = req.user.id; // guaranteed by `protect` on this route

      if (!rewardId) {
        return res.status(400).json({ success: false, message: 'rewardId is required to claim' });
      }

      const result = await RewardService.claimReward({ userId, rewardId });
      res.status(200).json({
        success: true,
        message: 'Reward claimed successfully!',
        data: result
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // user — every voucher this citizen has redeemed (Active + Redeemed);
  // keeps a claimed reward visible/available until they actually use it.
  static async getMyVouchers(req, res) {
    try {
      const vouchers = await RewardService.getMyVouchers(req.user.id);
      res.status(200).json({ success: true, data: vouchers });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createReward(req, res) {
    try {
      const { title, description, pointsRequired, stock } = req.body;
      if (!title || !pointsRequired) {
        return res.status(400).json({ success: false, message: 'title and pointsRequired are required fields' });
      }

      // An uploaded file (if any) always wins over a pasted URL — the
      // frontend only sends one or the other per submission.
      const imageUrl = req.file ? `/uploads/rewards/${req.file.filename}` : (req.body.imageUrl || null);

      const reward = await RewardService.addReward({
        title,
        description,
        pointsRequired,
        imageUrl,
        stock: stock || 0,
      });
      res.status(201).json({
        success: true,
        message: 'Reward created successfully',
        data: reward
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateReward(req, res) {
    try {
      const { id } = req.params;
      const { title, description, pointsRequired, stock } = req.body;

      const existing = await RewardModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Reward not found' });
      }

      // Same precedence as create: new file > new pasted URL > keep what
      // was already there, so editing other fields never wipes the image.
      const imageUrl = req.file
        ? `/uploads/rewards/${req.file.filename}`
        : (req.body.imageUrl || existing.image_url);

      const reward = await RewardService.updateReward(id, {
        title: title ?? existing.title,
        description: description ?? existing.description,
        pointsRequired: pointsRequired ?? existing.points_required,
        imageUrl,
        stock: stock ?? existing.stock,
      });
      res.status(200).json({
        success: true,
        message: 'Reward updated successfully',
        data: reward
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteReward(req, res) {
    try {
      const { id } = req.params;
      const success = await RewardService.deleteReward(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Reward not found or already deleted' });
      }
      res.status(200).json({
        success: true,
        message: 'Reward deleted successfully'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default RewardController;
