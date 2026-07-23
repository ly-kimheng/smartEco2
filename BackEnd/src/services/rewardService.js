/**kimheng's part */


import RewardModel from '../models/Reward.js';
import VoucherModel from '../models/Vocher.js';
import PointTransactionModel from '../models/pointTransaction.js';
import db from '../config/database.js';


//both admin and user
class RewardService {
  static async listRewards() {
    try {
      return await RewardModel.getAll();
    } catch {
      // Fallback design elements if tables don't exist yet
      return [
        { id: 1, title: 'Eco Coffee Cup', description: 'Re-usable mug', points_required: 120, stock: 45 },
        { id: 2, title: 'Canvas Tote Bag', description: 'Heavy material canvas', points_required: 180, stock: 22 }
      ];
    }
  }
// user 
  static async claimReward({ userId, rewardId }) {
    const reward = await RewardModel.findById(rewardId);
    if (!reward) throw new Error('Reward item not found');
    if (reward.stock <= 0) throw new Error('Item exceeds currently available stock');

    // Retrieve corresponding user record
    const [[user]] = await db.execute('SELECT points FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('Profile user not found');
    if (user.points < reward.points_required) {
      throw new Error(`Insufficient eco-points balance. Needed: ${reward.points_required}. Current: ${user.points}.`);
    }

    // Decrement stock limits
    await db.execute('UPDATE rewards SET stock = stock - 1 WHERE id = ?', [rewardId]);

    // Generate unique claim coupon identification
    const couponCode = 'ECO-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create the voucher database record
    const voucher = await VoucherModel.create({
      userId,
      rewardId,
      code: couponCode,
      pointsSpent: reward.points_required
    });

    // Ledger point record deduction
    await PointTransactionModel.create({
      userId,
      points: reward.points_required,
      type: 'spend',
      description: `Redeemed reward: ${reward.title}`
    });

    return { 
      success: true, 
      voucherId: voucher.id,
      code: couponCode, 
      pointsRemaining: user.points - reward.points_required 
    };
  }

  // user — every voucher this citizen has ever redeemed, so a claimed reward
  // stays visible (with its code and Active/Redeemed status) until they
  // actually use it, instead of only flashing once right after claiming.
  static async getMyVouchers(userId) {
    return await VoucherModel.getByUserId(userId);
  }

//admin
  static async addReward(rewardData) {
    return await RewardModel.create(rewardData);
  }

  static async updateReward(id, rewardData) {
    return await RewardModel.update(id, rewardData);
  }

  static async deleteReward(id) {
    return await RewardModel.delete(id);
  }
}

export default RewardService;
