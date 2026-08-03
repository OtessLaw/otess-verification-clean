const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const CustomerNumber = require('../models/CustomerNumber');
const Claim = require('../models/Claim');
const { validateMTNPhone } = require('../utils/phoneValidator');

const processPhoneList = async (rawPhones, uploadedDate) => {
  const dateStr = uploadedDate || new Date().toISOString().split('T')[0];
  const validNumbers = [];
  const invalidNumbers = [];
  const seenInBatch = new Set();

  for (const raw of rawPhones) {
    if (!raw) continue;
    const check = validateMTNPhone(raw);
    if (!check.isValid) {
      invalidNumbers.push({ raw, reason: check.error });
      continue;
    }

    const norm = check.normalized;
    if (seenInBatch.has(norm)) {
      continue;
    }
    seenInBatch.add(norm);

    validNumbers.push({
      phoneNumber: norm,
      network: 'MTN Ghana',
      uploadedDate: dateStr,
      used: false
    });
  }

  if (validNumbers.length === 0) {
    return {
      added: 0,
      duplicates: 0,
      invalid: invalidNumbers.length
    };
  }

  let addedCount = 0;
  let duplicateCount = 0;

  for (const item of validNumbers) {
    try {
      const existing = await CustomerNumber.findOne({
        phoneNumber: item.phoneNumber,
        uploadedDate: item.uploadedDate
      });

      if (!existing) {
        await CustomerNumber.create(item);
        addedCount++;
      } else {
        duplicateCount++;
      }
    } catch (err) {
      duplicateCount++;
    }
  }

  return {
    added: addedCount,
    duplicates: duplicateCount,
    invalid: invalidNumbers.length
  };
};

const uploadGiveawayNumbers = async (req, res) => {
  try {
    const { manualText, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    let rawPhones = [];

    if (manualText && manualText.trim().length > 0) {
      rawPhones = manualText
        .split(/[\n,;\t]+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
    } else if (req.file) {
      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      if (ext === '.csv') {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        rawPhones = fileContent
          .split(/[\r\n,;\t]+/)
          .map(line => line.replace(/"/g, '').trim())
          .filter(line => line.length > 0 && !line.toLowerCase().includes('phone'));
      } else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        for (const row of rows) {
          if (Array.isArray(row)) {
            for (const cell of row) {
              if (cell) rawPhones.push(String(cell).trim());
            }
          }
        }
      }

      try { fs.unlinkSync(filePath); } catch (e) {}
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide a CSV file, Excel file, or paste phone numbers.'
      });
    }

    const result = await processPhoneList(rawPhones, targetDate);

    return res.status(200).json({
      success: true,
      message: `Upload complete! Added ${result.added} valid MTN numbers. (${result.duplicates} duplicates skipped, ${result.invalid} invalid format/non-MTN numbers).`,
      stats: result
    });

  } catch (error) {
    console.error('Number upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process number upload.'
    });
  }
};

const getGiveawayNumbers = async (req, res) => {
  try {
    const { search, date, used, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.phoneNumber = { $regex: search.trim(), $options: 'i' };
    }

    if (date) {
      query.uploadedDate = date;
    }

    if (used !== undefined && used !== '') {
      query.used = used === 'true';
    }

    const total = await CustomerNumber.countDocuments(query);
    const numbers = await CustomerNumber.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      numbers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching numbers.' });
  }
};

const deleteGiveawayNumber = async (req, res) => {
  try {
    const { id } = req.params;
    await CustomerNumber.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Number deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete number.' });
  }
};

module.exports = {
  uploadGiveawayNumbers,
  getGiveawayNumbers,
  deleteGiveawayNumber
};
