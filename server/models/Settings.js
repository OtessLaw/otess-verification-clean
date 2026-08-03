const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  giveawayActive: {
    type: Boolean,
    default: false
  },
  requiredPurchaseCount: {
    type: Number,
    default: 2
  },
  rewardAmount: {
    type: String,
    default: '1GB MTN Data'
  },
  dailyLimit: {
    type: Number,
    default: 100
  },
  requireSameDay: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
