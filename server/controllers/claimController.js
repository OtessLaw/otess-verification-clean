const Claim = require('../models/Claim');
const CustomerNumber = require('../models/CustomerNumber');

const getClaims = async (req, res) => {
  try {
    const { search, date, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { claimantNumber: { $regex: search.trim(), $options: 'i' } },
        { referenceId: { $regex: search.trim(), $options: 'i' } },
        { verifiedNumbers: { $elemMatch: { $regex: search.trim(), $options: 'i' } } }
      ];
    }

    if (date) {
      query.claimDate = date;
    }

    if (status) {
      query.status = status;
    }

    const total = await Claim.countDocuments(query);
    const claims = await Claim.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      claims
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch claims.' });
  }
};

const deleteClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    await CustomerNumber.updateMany(
      { claimId: claim._id },
      { $set: { used: false, claimId: null } }
    );

    await Claim.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Claim record deleted and associated customer numbers freed.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete claim.' });
  }
};

const exportClaimsCSV = async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 });
    let csvString = 'Reference ID,Claimant Phone,Verified Numbers,Reward,Status,Claim Date,Created At\n';
    
    for (const c of claims) {
      const verified = c.verifiedNumbers ? c.verifiedNumbers.join(' | ') : '';
      csvString += `"${c.referenceId}","${c.claimantNumber}","${verified}","${c.reward}","${c.status}","${c.claimDate}","${c.createdAt.toISOString()}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="otess_data_claims_export.csv"');
    return res.status(200).send(csvString);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export claims.' });
  }
};

module.exports = {
  getClaims,
  deleteClaim,
  exportClaimsCSV
};
