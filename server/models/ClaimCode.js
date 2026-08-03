const mongoose = require('mongoose');

const claimCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  rewardAmount: {
    type: String,
    default: '1GB MTN Data'
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedByPhone: {
    type: String,
    default: null
  },
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ClaimCode', claimCodeSchema);
