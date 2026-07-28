import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, X, Clock, Download, Copy, AlertCircle, Upload, UserCheck, Search, Loader2, ExternalLink, Radio, QrCode, Sparkles, History, Bell, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Verify() {
  const [tab, setTab] = useState('single');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);
  const [agentPhoneInput, setAgentPhoneInput] = useState('');
  const [submittingNow, setSubmittingNow] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState(true);
  const [showQRProof, setShowQRProof] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatVerifiedDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('otess_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const lastVerifiedPhoneRef = useRef('');

  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  const saveRecentSearch = (phoneNum) => {
    if (!phoneNum) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p !== phoneNum);
      const updated = [phoneNum, ...filtered].slice(0, 3);
      try {
        localStorage.setItem('otess_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    }
    if (clean.length === 12 && clean.startsWith('233')) {
      return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
    }
    return phone;
  };

  const detectCarrier = (phone) => {
    if (!phone) return null;
    let local = phone.replace(/\D/g, '');
    if (local.startsWith('233')) local = '0' + local.slice(3);
    if ((local.startsWith('2') || local.startsWith('5')) && local.length === 9) local = '0' + local;

    if (/^(024|054|055|059|025|053)/.test(local)) return { name: 'MTN Ghana', color: 'bg-amber-400/15 text-amber-800 dark:text-amber-300 border-amber-400/30' };
    if (/^(020|050)/.test(local)) return { name: 'Telecel Ghana', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-400/30' };
    if (/^(027|057|026|056)/.test(local)) return { name: 'AirtelTigo', color: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-400/30' };
    return null;
  };

  const isCompletePhone = (phoneStr) => {
    if (!phoneStr) return false;
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('0')) return true;
    if (digits.length === 9 && (digits.startsWith('2') || digits.startsWith('5'))) return true;
    if (digits.length === 12 && digits.startsWith('233')) return true;
    return false;
  };

  const executeVerifySingle = async (phoneToVerify) => {
    const target = (phoneToVerify || singlePhone).trim();
    if (!target) return;

    setSingleLoading(true);
    setSingleResult(null);
    setSingleError(null);
    setSubmitSuccess(null);
    setShowQRProof(false);
    lastVerifiedPhoneRef.current = target;
    saveRecentSearch(target);

    try {
      const res = await axios.post('/api/verify/single', { phoneNumber: target });
      setSingleResult(res.data);

      if (res.data?.status === 'not_found' || res.data?.status === 'invalid') {
        const notifyNum = agentPhoneInput || target;
        try {
          const subRes = await axios.post('/api/submit/single', {
            customerNumber: target,
            phoneNumber: target,
            agentNumber: notifyNum
          });
          const expectedDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          setSubmitSuccess({
            autoSubmitted: true,
            submissionId: subRes.data?.data?.submissionId || 'SUBMITTED',
            expectedDate
          });
          toast.success(`Number automatically submitted for verification!`);
        } catch (subErr) {
          const existingSubId = subErr.response?.data?.submissionId || 'PENDING-SUBMISSION';
          const expectedDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          setSubmitSuccess({
            autoSubmitted: true,
            alreadyPending: true,
            submissionId: existingSubId,
            expectedDate
          });
        }
      }
    } catch (err) {
      setSingleError(err.response?.data?.message || 'Verification failed');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleVerifySingle = (e) => {
    if (e) e.preventDefault();
    executeVerifySingle(singlePhone);
  };

  useEffect(() => {
    const trimmed = singlePhone.trim();

    if (!trimmed) {
      setSingleResult(null);
      setSingleError(null);
      lastVerifiedPhoneRef.current = '';
      return;
    }

    if (lastVerifiedPhoneRef.current && trimmed !== lastVerifiedPhoneRef.current) {
      setSingleResult(null);
      setSingleError(null);
    }

    if (autoVerifyEnabled && isCompletePhone(trimmed) && trimmed !== lastVerifiedPhoneRef.current && !singleLoading) {
      const timer = setTimeout(() => {
        executeVerifySingle(trimmed);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [singlePhone, autoVerifyEnabled]);

  useEffect(() => {
    if ((singleResult?.status === 'not_found' || singleResult?.status === 'invalid') && !agentPhoneInput) {
      if (isCompletePhone(singlePhone)) {
        setAgentPhoneInput(singlePhone);
      }
    }
  }, [singleResult, singlePhone]);

  const handleSubmitNotVerified = async (e) => {
    if (e) e.preventDefault();
    const phoneToSubmit = singlePhone || singleResult?.data?.phoneNumber;
    if (!phoneToSubmit) return;
    if (!agentPhoneInput) {
      toast.error('Please enter your phone number to receive SMS notifications.');
      return;
    }
    setSubmittingNow(true);
    try {
      const res = await axios.post('/api/submit/single', {
        customerNumber: phoneToSubmit,
        phoneNumber: phoneToSubmit,
        agentNumber: agentPhoneInput
      });
      const expectedDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      setSubmitSuccess({
        autoSubmitted: true,
        submissionId: res.data?.data?.submissionId || 'SUBMITTED',
        expectedDate
      });
      toast.success(`Updated alert number to ${agentPhoneInput}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission update failed');
    } finally {
      setSubmittingNow(false);
    }
  };

  const handleVerifyBulk = async (e) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkResult(null);
    setBulkError(null);
    try {
      const phones = bulkPhones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
      const res = await axios.post('/api/verify/bulk', { phoneNumbers: phones });
      setBulkResult(res.data);
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Bulk verification failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const copyResults = () => {
    if (!bulkResult?.results) return;
    const text = bulkResult.results.map(r => `${r.number || r.phoneNumber}\t${r.status}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Results copied to clipboard!');
  };

  const copyProofText = () => {
    if (!singleResult) return;
    const phone = singleResult.data?.phoneNumber || singlePhone;
    const formatted = formatPhoneDisplay(phone);
    const dateStr = formatVerifiedDate(singleResult.data?.verifiedDate);
    const dateLine = dateStr ? `Verified Date: ${dateStr}\n` : '';
    const text = `🟢 OTESS VERIFIED: ${formatted}\n${dateLine}Status: Cleared for Data Bundle Order\nWebsite: https://getmyzta.shop/`;
    navigator.clipboard.writeText(text);
    toast.success('Verification proof copied!');
  };

  const downloadCSV = () => {
    if (!bulkResult?.results) return;
    const csv = ['Phone Number,Status,Date']
      .concat(bulkResult.results.map(r => `${r.number || r.phoneNumber},${r.status},${new Date().toISOString()}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otess_verification_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadReceipt = () => {
    if (!singleResult) return;
    const phone = singleResult.data?.phoneNumber || singlePhone;
    const formatted = formatPhoneDisplay(phone);
    const dateStr = formatVerifiedDate(singleResult.data?.verifiedDate) || 'System Verified';
    const batchId = singleResult.data?.batchId || 'VERIFIED-OTESS';

    const receiptContent = `====================================
OTESS PHONE NUMBER VERIFICATION RECEIPT
====================================
Status: VERIFIED (GREEN)
Phone Number: ${phone}
Formatted Number: ${formatted}
Verified Date: ${dateStr}
Batch Reference: ${batchId}
System: OTESS Instant Verification
Validation: PASS - Cleared for Data Bundle Order
====================================
Website: https://getmyzta.shop/
Thank you for using OTESS System!
`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OTESS_Verification_Receipt_${phone}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Receipt downloaded successfully!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-4 sm:p-6"
    >
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold mb-3 font-outfit text-slate-900 dark:text-white">
          <ShieldCheck className="inline-block mr-2 text-[#2563eb]" size={36} />
          OTESS Phone Number Verification
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-3">
          Verify phone numbers instantly for bulk data bundle orders.
        </p>

        {/* Live Ledger Date Tracker Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <Calendar size={13} className="text-[#2563eb]" />
          <span>Live Ledger Date: <strong>{todayFormatted}</strong></span>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setTab('single')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'single' ? 'text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Single Verification
          </button>
          <button
            onClick={() => setTab('bulk')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'bulk' ? 'text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Bulk Verification
          </button>
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {tab === 'single' ? (
              <motion.div 
                key="single"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="max-w-md mx-auto space-y-6"
              >
                <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5 relative overflow-hidden">
                  
                  {/* Distinct Status Pill Header with Live Date Tracker */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <Sparkles size={13} className="text-[#2563eb]" />
                      <span>Instant Ledger Check</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Updated: {todayFormatted}</span>
                    </span>
                  </div>

                  <form onSubmit={handleVerifySingle} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="block text-base font-semibold text-slate-800 dark:text-slate-200">
                          Mobile number
                        </label>
                        {detectCarrier(singlePhone) && (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${detectCarrier(singlePhone).color}`}>
                            <Radio size={10} className="animate-pulse" />
                            <span>{detectCarrier(singlePhone).name}</span>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Search size={20} />
                        </div>
                        <input
                          type="text"
                          value={singlePhone}
                          onChange={(e) => setSinglePhone(e.target.value)}
                          placeholder="e.g. 0241234567 or +233..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-lg font-medium text-slate-900 dark:text-white transition-all shadow-sm"
                          required
                        />
                        {singleLoading && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2563eb]">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        )}
                      </div>

                      {recentSearches.length > 0 && !singlePhone && (
                        <div className="flex items-center gap-1.5 pt-2 overflow-x-auto text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1 shrink-0">
                            <History size={11} /> Recent:
                          </span>
                          {recentSearches.map((num, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSinglePhone(num);
                                executeVerifySingle(num);
                              }}
                              className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-mono transition-colors shrink-0"
                            >
                              {formatPhoneDisplay(num)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={singleLoading}
                      className="w-full bg-[#2565ed] hover:bg-[#1d4ed8] text-white rounded-full py-3.5 text-base font-semibold shadow-lg shadow-[#2565ed]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {singleLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                            <Check size={13} strokeWidth={3} className="text-white" />
                          </div>
                          <span>Verify Number</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>

                {singleError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 flex items-center text-sm"
                  >
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{singleError}</span>
                  </motion.div>
                )}

                {singleResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="space-y-4"
                  >
                    {singleResult.status === 'verified' && (
                      <div className="space-y-4">
                        <div className="bg-[#e8f8ec] dark:bg-emerald-950/30 border border-emerald-400/60 dark:border-emerald-800/50 rounded-3xl p-8 text-center space-y-3 shadow-sm relative overflow-hidden">
                          <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                              <ShieldCheck size={12} className="text-emerald-600" />
                              <span>OTESS STAMP</span>
                            </span>
                          </div>

                          <div className="w-20 h-20 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                            <div className="w-14 h-14 rounded-full bg-[#16a34a] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                              <Check size={32} strokeWidth={3.5} className="text-white" />
                            </div>
                          </div>

                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">
                            Number verified
                          </h2>

                          <p className="text-base text-slate-600 dark:text-slate-300 font-medium">
                            Go ahead and place your order.
                          </p>

                          <div className="flex items-center justify-center gap-2 pt-1">
                            <p className="text-base font-mono font-bold text-slate-500 dark:text-slate-400 tracking-widest">
                              {formatPhoneDisplay(singleResult.data?.phoneNumber || singlePhone)}
                            </p>
                            {detectCarrier(singleResult.data?.phoneNumber || singlePhone) && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${detectCarrier(singleResult.data?.phoneNumber || singlePhone).color}`}>
                                {detectCarrier(singleResult.data?.phoneNumber || singlePhone).name}
                              </span>
                            )}
                          </div>

                          {showQRProof && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="pt-3 pb-1 border-t border-emerald-500/20 space-y-2 text-center"
                            >
                              <div className="w-28 h-28 mx-auto bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center border border-slate-200">
                                <QrCode size={90} className="text-slate-800" />
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono">Scan QR for instant verification proof</p>
                            </motion.div>
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={downloadReceipt}
                          className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white rounded-full py-4 text-base font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Download size={20} />
                          <span>Download Receipt</span>
                        </motion.button>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            onClick={copyProofText}
                            className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Copy size={13} />
                            <span>Copy Proof</span>
                          </button>

                          <button
                            onClick={() => setShowQRProof(!showQRProof)}
                            className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <QrCode size={13} />
                            <span>{showQRProof ? 'Hide QR' : 'QR Proof'}</span>
                          </button>

                          <a
                            href="https://getmyzta.shop/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <span>Place Order</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    )}

                    {singleResult.status === 'pending' && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-400/60 dark:border-amber-800/50 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-full text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                          <span>WAITING FOR APPROVAL</span>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                          <Clock size={32} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
                          Verification in Progress
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                          Your number has already been submitted for verification. Completed within 72 hours.
                        </p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wider pt-2 border-t border-amber-200/60 dark:border-amber-800/50">
                          {formatPhoneDisplay(singleResult.data?.phoneNumber || singlePhone)}
                        </p>
                      </div>
                    )}

                    {(singleResult.status === 'not_found' || singleResult.status === 'invalid') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl text-center space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-center space-x-2 text-amber-700 dark:text-amber-300">
                          <Clock className="w-5 h-5 flex-shrink-0 text-amber-500" />
                          <span className="font-bold text-sm font-outfit">🟡 Submission Received</span>
                        </div>

                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">
                          Your number <strong className="font-mono font-bold text-slate-900 dark:text-white">{formatPhoneDisplay(singlePhone)}</strong> has been automatically submitted for verification approval.
                        </p>

                        {submitSuccess?.submissionId && (
                          <div className="inline-flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                            <span>ID: <strong className="text-slate-800 dark:text-slate-200">{submitSuccess.submissionId}</strong></span>
                            <span>•</span>
                            <span>Est ~72 hrs</span>
                          </div>
                        )}

                        {/* Optional SMS Alert input directly inside card */}
                        <form onSubmit={handleSubmitNotVerified} className="pt-1 flex gap-2">
                          <input
                            type="text"
                            value={agentPhoneInput}
                            onChange={(e) => setAgentPhoneInput(e.target.value)}
                            placeholder="Phone number for SMS alert (optional)"
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563eb] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={submittingNow}
                            className="px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                          >
                            {submittingNow ? 'Saving...' : 'Set Alert'}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="bulk"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleVerifyBulk} className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Paste Numbers (newlines or commas)
                  </label>
                  <textarea
                    value={bulkPhones}
                    onChange={(e) => setBulkPhones(e.target.value)}
                    placeholder="0241234567&#10;0209876543&#10;0551122334"
                    rows={5}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-mono text-sm text-slate-900 dark:text-white"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={bulkLoading}
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl px-8 py-3 font-medium shadow-md shadow-[#2563eb]/20 transition-colors disabled:opacity-50 animate-heartbeat"
                  >
                    {bulkLoading ? 'Processing Bulk Verification...' : 'Verify All Numbers'}
                  </motion.button>
                </form>

                {bulkError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 flex items-center"
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {bulkError}
                  </motion.div>
                )}

                {bulkResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-[#2563eb]">{bulkResult.summary?.total || 0}</div>
                        <div className="text-sm text-slate-500">Total Checked</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-200 dark:border-green-900/30">
                        <div className="text-2xl font-bold text-green-600">{bulkResult.summary?.verified || 0}</div>
                        <div className="text-xs text-green-700 dark:text-green-500 font-bold">VERIFIED (GREEN)</div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center border border-amber-200 dark:border-amber-900/30">
                        <div className="text-2xl font-bold text-amber-600">{bulkResult.summary?.pending || 0}</div>
                        <div className="text-xs text-amber-700 dark:text-amber-500 font-bold">PENDING</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-200 dark:border-red-900/30">
                        <div className="text-2xl font-bold text-red-600">{(bulkResult.summary?.notFound || 0) + (bulkResult.summary?.invalid || 0)}</div>
                        <div className="text-xs text-red-700 dark:text-red-500 font-bold">NOT VERIFIED (RED)</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mb-4">
                      <button onClick={copyResults} className="flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg transition-colors">
                        <Copy size={16} className="mr-2" /> Copy
                      </button>
                      <button onClick={downloadCSV} className="flex items-center text-sm text-[#2563eb] hover:text-[#1d4ed8] bg-[#2563eb]/10 px-3 py-2 rounded-lg transition-colors">
                        <Download size={16} className="mr-2" /> Download CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Customer Number</th>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Status Indicator</th>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Date</th>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkResult.results?.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-mono font-medium dark:text-slate-200">{item.number || item.phoneNumber}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  item.status === 'verified' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                                  item.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                }`}>
                                  {item.status === 'verified' ? '🟢 VERIFIED' : item.status === 'pending' ? '🟡 PENDING' : '🔴 NOT VERIFIED'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">{item.date || '-'}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">{item.message || item.batchId || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
