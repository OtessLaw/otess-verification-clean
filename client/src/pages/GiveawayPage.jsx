import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { Gift, CheckCircle2, AlertCircle, Phone, Sparkles, ShieldCheck, ArrowRight, RefreshCw, Copy, Check, KeyRound } from 'lucide-react';

const MTN_PREFIXES = ['024', '054', '055', '059', '025', '053'];

function validateMTNPhone(rawPhone) {
  if (!rawPhone) return { isValid: false, normalized: '', error: 'Phone number is required.' };
  let cleaned = String(rawPhone).trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+233')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('233') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (!/^0\d{9}$/.test(cleaned)) {
    return { isValid: false, normalized: cleaned, error: 'Must be a 10-digit Ghana phone number (e.g. 0241234567).' };
  }

  const prefix = cleaned.slice(0, 3);
  if (!MTN_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      normalized: cleaned,
      error: `Number (${prefix}...) is not an MTN Ghana number. Eligible prefixes: ${MTN_PREFIXES.join(', ')}.`
    };
  }

  return { isValid: true, normalized: cleaned, error: null };
}

export default function GiveawayPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const [requiredCount, setRequiredCount] = useState(2);
  const [phoneInputs, setPhoneInputs] = useState(['', '']);

  const [claimCode, setClaimCode] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [verifiedNumbers, setVerifiedNumbers] = useState([]);
  const [verifiedReward, setVerifiedReward] = useState('1GB MTN Data');
  const [finalClaimResult, setFinalClaimResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const [isGiveawayActive, setIsGiveawayActive] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    axios.get('/api/system/settings')
      .then(res => {
        if (res.data?.success) {
          setIsGiveawayActive(!!res.data.giveawayActive);
          const count = res.data.requiredPurchaseCount || 2;
          setRequiredCount(count);
          setPhoneInputs(Array(count).fill(''));
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, []);

  const handlePhoneInputChange = (index, value) => {
    const newInputs = [...phoneInputs];
    newInputs[index] = value;
    setPhoneInputs(newInputs);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedList = [];
    for (let i = 0; i < requiredCount; i++) {
      const p = phoneInputs[i];
      const check = validateMTNPhone(p);
      if (!check.isValid) {
        setErrorMessage(`Customer Phone ${i + 1} Error: ${check.error}`);
        return;
      }
      normalizedList.push(check.normalized);
    }

    if (new Set(normalizedList).size < normalizedList.length) {
      setErrorMessage('All entered customer phone numbers must be different.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/giveaway/verify-purchases', {
        phones: normalizedList
      });

      if (res.data.success) {
        setVerifiedNumbers(normalizedList);
        setCurrentStep(2);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Verification failed. Please check customer numbers.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!claimCode || !claimCode.trim()) {
      setErrorMessage('Please enter the OTESS Claim Code given to you by the admin.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/giveaway/verify-code', {
        claimCode: claimCode.trim()
      });

      if (res.data.success) {
        if (res.data.rewardAmount) {
          setVerifiedReward(res.data.rewardAmount);
        }
        setCurrentStep(3);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const checkAgent = validateMTNPhone(recipientPhone);
    if (!checkAgent.isValid) {
      setErrorMessage(`Recipient Phone Error: ${checkAgent.error}`);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/giveaway/claim-reward', {
        phones: verifiedNumbers,
        claimCode: claimCode.trim(),
        recipientPhone: checkAgent.normalized
      });

      if (res.data.success) {
        setFinalClaimResult(res.data.claim);
        setCurrentStep(4);
        triggerConfetti();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to finalize data claim.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setCurrentStep(1);
    setPhone1('');
    setPhone2('');
    setClaimCode('');
    setRecipientPhone('');
    setErrorMessage(null);
    setFinalClaimResult(null);
  };

  const copyRef = (refId) => {
    navigator.clipboard.writeText(refId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (checkingStatus) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 font-bold text-sm">
        Checking Data Giveaway Status...
      </div>
    );
  }

  if (!isGiveawayActive) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border-2 border-amber-500/20">
          <Gift className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Data Giveaway Closed
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">
          The MTN Data Giveaway event is currently inactive. It will be opened periodically by the admin. Please check back soon or proceed with number verification!
        </p>

        <a
          href="/verify"
          className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl transition-all"
        >
          <span>Go to Number Verification</span>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-extrabold uppercase tracking-widest mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Official OTESS Data Giveaway Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Claim Free Data
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Verify two customer MTN data purchases today, enter your OTESS Claim Code, and receive your free data bundle!
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-0"
            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
          ></div>

          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            currentStep >= 1 ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-300 dark:bg-slate-800 text-slate-500'
          }`}>
            1
          </div>

          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            currentStep >= 2 ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-300 dark:bg-slate-800 text-slate-500'
          }`}>
            2
          </div>

          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            currentStep >= 3 ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-300 dark:bg-slate-800 text-slate-500'
          }`}>
            3
          </div>
        </div>

        <div className="flex justify-between text-xs font-semibold text-slate-500 mt-2">
          <span>1. Verify Purchases</span>
          <span className="text-center">2. Enter OTESS Code</span>
          <span className="text-right">3. Claim Data</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: Verify Customer Purchases */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 1: Verify Customer Data Purchases
              </h3>
              <p className="text-xs text-slate-500">
                Enter the {requiredCount} customer MTN phone number(s) that purchased data bundles today to qualify.
              </p>
            </div>

            {phoneInputs.map((val, idx) => (
              <div key={idx}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Customer MTN Phone Number {idx + 1}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={`e.g., 024123456${idx}`}
                    value={val}
                    onChange={(e) => handlePhoneInputChange(idx, e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Verifying Purchase Records...</span>
                </>
              ) : (
                <>
                  <span>Verify Purchases & Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTESS Claim Code */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <h3 className="font-extrabold text-lg">
                  Congratulations 🎉 You Qualify!
                </h3>
              </div>
              <p className="text-xs font-medium">
                Customer numbers ({verifiedNumbers.join(' & ')}) are verified in today's purchase database.
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 2: Enter OTESS Claim Code
              </h3>
              <p className="text-xs text-slate-500">
                Enter the Claim Code given to you by the admin to unlock your reward.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                OTESS Claim Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g., OTESS-CODE-100 or OTESS-7741"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-blue-500/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-base font-extrabold tracking-wider outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3.5 px-5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter Recipient Phone Number */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-6">
            
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold">
                OTESS Code <strong className="font-mono underline">{claimCode}</strong> Verified! Bundle: <strong className="text-base">{verifiedReward}</strong>
              </div>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 3: Enter Recipient MTN Phone Number
              </h3>
              <p className="text-xs text-slate-500">
                Where should we send your free <strong>{verifiedReward}</strong> bundle?
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                Your MTN Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-500">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g., 0551122334"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-blue-500/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-base font-extrabold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-3.5 px-5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Data Claim...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>Claim My Data Bundle</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Receipt Modal */}
        {currentStep === 4 && finalClaimResult && (
          <div className="text-center py-6 space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Data Reward Claimed Successfully! 🎉
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              Your free MTN data bundle has been credited to your number.
            </p>

            <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 text-left space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-semibold">Reward Bundle</span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">
                  {finalClaimResult.reward}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-semibold">Target Phone Number</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                  {finalClaimResult.claimantNumber}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-semibold">OTESS Code Used</span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {finalClaimResult.claimCode}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-semibold">Verified Purchases</span>
                <span className="text-xs font-mono text-slate-400">
                  {finalClaimResult.verifiedNumbers?.join(' & ')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 uppercase font-semibold">Reference ID</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    {finalClaimResult.referenceId}
                  </code>
                  <button
                    onClick={() => copyRef(finalClaimResult.referenceId)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Make Another Claim</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
