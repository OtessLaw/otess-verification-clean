const ClaimCode = require('../models/ClaimCode');

const generateRandomCodeString = (prefix = 'OTESS') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix.toUpperCase()}-${rand}`;
};

const generateCodes = async (req, res) => {
  try {
    const { count = 1, prefix = 'OTESS', customCode, rewardAmount = '1GB MTN Data' } = req.body;

    const createdCodes = [];

    if (customCode && customCode.trim().length > 0) {
      const codeStr = customCode.trim().toUpperCase();
      const existing = await ClaimCode.findOne({ code: codeStr });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Claim Code '${codeStr}' already exists in database.`
        });
      }

      const newCode = await ClaimCode.create({
        code: codeStr,
        rewardAmount
      });
      createdCodes.push(newCode);
    } else {
      const numToGenerate = Math.min(Math.max(Number(count), 1), 100);

      for (let i = 0; i < numToGenerate; i++) {
        let codeStr = generateRandomCodeString(prefix);
        let exists = await ClaimCode.findOne({ code: codeStr });
        let attempts = 0;
        
        while (exists && attempts < 5) {
          codeStr = generateRandomCodeString(prefix);
          exists = await ClaimCode.findOne({ code: codeStr });
          attempts++;
        }

        if (!exists) {
          const doc = await ClaimCode.create({
            code: codeStr,
            rewardAmount
          });
          createdCodes.push(doc);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully generated ${createdCodes.length} new claim code(s).`,
      codes: createdCodes
    });
  } catch (error) {
    console.error('Generate codes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate claim codes.' });
  }
};

const getCodes = async (req, res) => {
  try {
    const { search, isUsed, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.code = { $regex: search.trim(), $options: 'i' };
    }

    if (isUsed !== undefined && isUsed !== '') {
      query.isUsed = isUsed === 'true';
    }

    const total = await ClaimCode.countDocuments(query);
    const codes = await ClaimCode.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      codes
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch claim codes.' });
  }
};

const deleteCode = async (req, res) => {
  try {
    const { id } = req.params;
    await ClaimCode.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Claim code deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete code.' });
  }
};

module.exports = {
  generateCodes,
  getCodes,
  deleteCode
};
