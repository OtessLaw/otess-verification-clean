const CustomerNumber = require('../models/CustomerNumber');
const Claim = require('../models/Claim');
const ClaimCode = require('../models/ClaimCode');
const Settings = require('../models/Settings');
const { validateMTNPhone } = require('../utils/phoneValidator');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ giveawayActive: false, requiredPurchaseCount: 2 });
    }
    return res.status(200).json({
      success: true,
      giveawayActive: settings.giveawayActive,
      requiredPurchaseCount: settings.requiredPurchaseCount || 2,
      rewardAmount: settings.rewardAmount || '1GB MTN Data'
    });
  } catch (error) {
    return res.status(500).json({ success: false, giveawayActive: false, requiredPurchaseCount: 2 });
  }
};

const toggleGiveaway = async (req, res) => {
  try {
    const { giveawayActive, requiredPurchaseCount } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ giveawayActive: !!giveawayActive, requiredPurchaseCount: requiredPurchaseCount || 2 });
    } else {
      if (giveawayActive !== undefined) settings.giveawayActive = !!giveawayActive;
      if (requiredPurchaseCount !== undefined) settings.requiredPurchaseCount = Math.max(1, Number(requiredPurchaseCount));
      settings.updatedAt = new Date();
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: `Settings updated successfully! (Required Purchases: ${settings.requiredPurchaseCount})`,
      giveawayActive: settings.giveawayActive,
      requiredPurchaseCount: settings.requiredPurchaseCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update giveaway settings.' });
  }
};

const verifyPurchases = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (settings && settings.giveawayActive === false) {
      return res.status(403).json({
        success: false,
        message: 'The MTN Data Giveaway is currently closed. Please check back later!'
      });
    }

    const requiredCount = settings?.requiredPurchaseCount || 2;
    const { phones, phone1, phone2 } = req.body;

    let phoneInputs = [];
    if (Array.isArray(phones) && phones.length > 0) {
      phoneInputs = phones;
    } else {
      if (phone1) phoneInputs.push(phone1);
      if (phone2) phoneInputs.push(phone2);
    }

    if (phoneInputs.length < requiredCount) {
      return res.status(400).json({
        success: false,
        message: `Please enter all ${requiredCount} customer MTN phone numbers.`
      });
    }

    const normalizedPhones = [];
    for (let i = 0; i < requiredCount; i++) {
      const p = phoneInputs[i];
      const check = validateMTNPhone(p);
      if (!check.isValid) {
        return res.status(400).json({
          success: false,
          message: `Customer Phone ${i + 1} error: ${check.error}`
        });
      }
      normalizedPhones.push(check.normalized);
    }

    // Ensure all entered numbers are unique
    const uniqueSet = new Set(normalizedPhones);
    if (uniqueSet.size < normalizedPhones.length) {
      return res.status(400).json({
        success: false,
        message: 'All entered customer phone numbers must be unique and different.'
      });
    }

    // Verify all numbers exist in database and are unused
    const foundRecords = [];
    for (const num of normalizedPhones) {
      const rec = await CustomerNumber.findOne({ phoneNumber: num });
      if (!rec) {
        return res.status(404).json({
          success: false,
          message: `Number (${num}) was not found in today's purchase records. Only numbers that bought data today qualify.`
        });
      }
      if (rec.used) {
        return res.status(409).json({
          success: false,
          message: `Number (${num}) has already been used for another claim today.`
        });
      }
      foundRecords.push(rec);
    }

    return res.status(200).json({
      success: true,
      message: `Congratulations 🎉 All ${requiredCount} purchase number(s) qualify! Please enter your OTESS Claim Code to continue.`,
      verifiedNumbers: normalizedPhones
    });

  } catch (error) {
    console.error('Verify purchases error:', error);
    return res.status(500).json({ success: false, message: 'Server error during purchase verification.' });
  }
};

const verifyCode = async (req, res) => {
  try {
    const { claimCode } = req.body;

    if (!claimCode || !claimCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Admin Claim Code.'
      });
    }

    const codeStr = claimCode.trim().toUpperCase();
    const codeDoc = await ClaimCode.findOne({ code: codeStr });

    if (!codeDoc) {
      return res.status(404).json({
        success: false,
        message: `Invalid Claim Code '${codeStr}'. Please check the code provided by your admin.`
      });
    }

    if (codeDoc.isUsed) {
      return res.status(409).json({
        success: false,
        message: `Claim Code '${codeStr}' has already been used by ${codeDoc.usedByPhone || 'another user'}.`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Claim Code verified successfully! Enter your MTN phone number to receive your free data bundle.',
      code: codeDoc.code,
      rewardAmount: codeDoc.rewardAmount || '1GB MTN Data'
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ success: false, message: 'Server error during code verification.' });
  }
};

const claimReward = async (req, res) => {
  try {
    const { phones, phone1, phone2, claimCode, recipientPhone } = req.body;

    let phoneInputs = [];
    if (Array.isArray(phones) && phones.length > 0) {
      phoneInputs = phones;
    } else {
      if (phone1) phoneInputs.push(phone1);
      if (phone2) phoneInputs.push(phone2);
    }

    if (phoneInputs.length === 0 || !claimCode || !recipientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters.'
      });
    }

    const checkRecipient = validateMTNPhone(recipientPhone);
    if (!checkRecipient.isValid) {
      return res.status(400).json({
        success: false,
        message: `Recipient phone number error: ${checkRecipient.error}`
      });
    }

    const normalizedPhones = phoneInputs.map(p => validateMTNPhone(p).normalized || p);
    const recipientNum = checkRecipient.normalized;
    const codeStr = claimCode.trim().toUpperCase();

    for (const num of normalizedPhones) {
      const rec = await CustomerNumber.findOne({ phoneNumber: num });
      if (!rec || rec.used) {
        return res.status(400).json({
          success: false,
          message: `Customer number ${num} is no longer eligible or has already been used.`
        });
      }
    }

    const codeDoc = await ClaimCode.findOne({ code: codeStr });
    if (!codeDoc || codeDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'The submitted Claim Code is invalid or has already been redeemed.'
      });
    }

    let settings = await Settings.findOne();
    const rewardAmount = codeDoc.rewardAmount || settings?.rewardAmount || '1GB MTN Data';

    const todayStr = new Date().toISOString().split('T')[0];
    const referenceId = 'OTESS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);

    const newClaim = await Claim.create({
      claimantNumber: recipientNum,
      verifiedNumbers: normalizedPhones,
      reward: rewardAmount,
      status: 'SUCCESS',
      referenceId,
      claimDate: todayStr
    });

    for (const num of normalizedPhones) {
      await CustomerNumber.updateOne(
        { phoneNumber: num },
        { $set: { used: true, claimId: newClaim._id } }
      );
    }

    codeDoc.isUsed = true;
    codeDoc.usedByPhone = recipientNum;
    codeDoc.claimId = newClaim._id;
    await codeDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Congratulations 🎉 Your MTN data bundle has been claimed successfully!',
      claim: {
        referenceId: newClaim.referenceId,
        reward: newClaim.reward,
        claimantNumber: newClaim.claimantNumber,
        claimCode: codeDoc.code,
        verifiedNumbers: normalizedPhones,
        status: newClaim.status,
        createdAt: newClaim.createdAt
      }
    });

  } catch (error) {
    console.error('Finalize claim error:', error);
    return res.status(500).json({ success: false, message: 'Server error while processing your data claim.' });
  }
};

module.exports = {
  getSettings,
  toggleGiveaway,
  verifyPurchases,
  verifyCode,
  claimReward
};
