const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimantNumber: {
    type: String,
    required: true
  },
  verifiedNumbers: {
    type: [String],
    required: true
  },
  reward: {
    type: String,
    required: true,
    default: '1GB MTN Data'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'PENDING', 'FAILED'],
    default: 'SUCCESS'
  },
  referenceId: {
    type: String,
    required: true,
    unique: true
  },
  claimDate: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Claim', claimSchema);
