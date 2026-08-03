const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect } = require('../middleware/auth');

// Controllers
const {
  loginAdmin,
  getProfile,
  changePassword
} = require('../controllers/authController');

const {
  verifySingleNumber,
  verifyBulkNumbers,
  submitSingleNumber,
  submitBulkNumbers,
  trackSubmission,
  getLatestVerifiedDate
} = require('../controllers/verificationController');

const {
  getDashboardStats,
  getVerifiedNumbers,
  manuallyAddVerifiedNumber,
  deleteVerifiedNumber,
  getPendingNumbers,
  approvePendingNumber,
  rejectPendingNumber,
  markProcessingPending,
  resendSMSNotification,
  deletePendingNumber,
  bulkApprovePending,
  bulkRejectPending,
  bulkMarkProcessingPending,
  bulkUploadFile,
  rollbackBatch,
  getUploadBatches,
  getActivityLogs,
  getSMSGatewayConfig,
  saveSMSGatewayConfig,
  testSMSGateway,
  bulkAddVerifiedNumbers,
  updateLiveTrackerDate
} = require('../controllers/adminController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter (XLSX, XLS, CSV, TXT)
const fileFilter = (req, file, cb) => {
  const filetypes = /xlsx|xls|csv|txt|plain/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'text/plain' || file.mimetype === 'application/octet-stream';
  
  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only Excel (.xlsx, .xls), CSV (.csv), or Text (.txt) files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/verify/single', verifySingleNumber);
router.post('/verify/bulk', verifyBulkNumbers);
router.post('/submit/single', submitSingleNumber);
router.post('/submit/bulk', submitBulkNumbers);
router.get('/track/:query', trackSubmission);
router.get('/system/latest-date', getLatestVerifiedDate);

// ==========================================
// AUTH ROUTES (ADMIN ONLY)
// ==========================================
router.post('/auth/login', loginAdmin);
router.get('/auth/profile', protect, getProfile);
router.put('/auth/change-password', protect, changePassword);

// ==========================================
// ADMIN DASHBOARD & MANAGEMENT ROUTES
// ==========================================
router.get('/admin/dashboard-stats', protect, getDashboardStats);

// Verified numbers routes
router.get('/admin/verified', protect, getVerifiedNumbers);
router.post('/admin/verified', protect, manuallyAddVerifiedNumber);
router.post('/admin/verified/bulk-add', protect, bulkAddVerifiedNumbers);
router.delete('/admin/verified/:id', protect, deleteVerifiedNumber);

// Pending queue routes
router.get('/admin/pending', protect, getPendingNumbers);
router.put('/admin/pending/:id/approve', protect, approvePendingNumber);
router.put('/admin/pending/:id/reject', protect, rejectPendingNumber);
router.put('/admin/pending/:id/process', protect, markProcessingPending);
router.post('/admin/pending/:id/resend-sms', protect, resendSMSNotification);
router.delete('/admin/pending/:id', protect, deletePendingNumber);
router.post('/admin/pending/bulk-approve', protect, bulkApprovePending);
router.post('/admin/pending/bulk-reject', protect, bulkRejectPending);
router.post('/admin/pending/bulk-process', protect, bulkMarkProcessingPending);

// Uploads & Batch routes
router.post('/admin/upload', protect, upload.single('file'), bulkUploadFile);
router.get('/admin/batches', protect, getUploadBatches);
router.post('/admin/batches/:batchId/rollback', protect, rollbackBatch);

// Audit logs
router.get('/admin/logs', protect, getActivityLogs);

// SMS Gateway configuration routes
router.get('/admin/sms-config', protect, getSMSGatewayConfig);
router.post('/admin/sms-config', protect, saveSMSGatewayConfig);
router.post('/admin/sms-config/test', protect, testSMSGateway);
router.post('/admin/live-tracker-date', protect, updateLiveTrackerDate);

// ==========================================
// DATA GIVEAWAY SYSTEM ENDPOINTS
// ==========================================
const { getSettings, toggleGiveaway, verifyPurchases, verifyCode, claimReward } = require('../controllers/giveawayController');
const { generateCodes, getCodes, deleteCode } = require('../controllers/codeController');
const { uploadGiveawayNumbers, getGiveawayNumbers, deleteGiveawayNumber } = require('../controllers/numberController');
const { getClaims, deleteClaim, exportClaimsCSV } = require('../controllers/claimController');

// Public Giveaway Endpoints
router.get('/system/settings', getSettings);
router.post('/giveaway/verify-purchases', verifyPurchases);
router.post('/giveaway/verify-code', verifyCode);
router.post('/giveaway/claim-reward', claimReward);

// Admin Master Toggle & Settings
router.post('/admin/toggle-giveaway', protect, toggleGiveaway);

// Admin OTESS Claim Code Management
router.post('/admin/codes/generate', protect, generateCodes);
router.get('/admin/codes', protect, getCodes);
router.delete('/admin/codes/:id', protect, deleteCode);

// Admin Giveaway Claims Management
router.get('/admin/giveaway-claims', protect, getClaims);
router.get('/admin/giveaway-claims/export/csv', protect, exportClaimsCSV);
router.delete('/admin/giveaway-claims/:id', protect, deleteClaim);

// Admin Giveaway Customer Number Upload
router.post('/admin/giveaway-numbers/upload', protect, upload.single('file'), uploadGiveawayNumbers);
router.get('/admin/giveaway-numbers', protect, getGiveawayNumbers);
router.delete('/admin/giveaway-numbers/:id', protect, deleteGiveawayNumber);

module.exports = router;

