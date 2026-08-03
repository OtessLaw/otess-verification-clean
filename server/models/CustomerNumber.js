const mongoose = require('mongoose');

const customerNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  network: {
    type: String,
    default: 'MTN Ghana'
  },
  uploadedDate: {
    type: String,
    required: true,
    index: true
  },
  used: {
    type: Boolean,
    default: false,
    index: true
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

customerNumberSchema.index({ phoneNumber: 1, uploadedDate: 1 });

module.exports = mongoose.model('CustomerNumber', customerNumberSchema);
