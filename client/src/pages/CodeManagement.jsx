import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KeyRound, Plus, Trash2, Copy, Check, Search, RefreshCw, Sparkles, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CodeManagement() {
  const [codes, setCodes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState('');
  const [isUsedFilter, setIsUsedFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Generator State
  const [generateMode, setGenerateMode] = useState('random'); // 'random' | 'custom'
  const [prefix, setPrefix] = useState('OTESS');
  const [count, setCount] = useState(5);
  const [customCode, setCustomCode] = useState('');
  const [rewardAmount, setRewardAmount] = useState('1GB MTN Data');
  
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState(null);
  const [genError, setGenError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (isUsedFilter !== '') params.append('isUsed', isUsedFilter);

      const res = await axios.get(`/api/admin/codes?${params.toString()}`);
      if (res.data.success) {
        setCodes(res.data.codes);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Fetch codes error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [page, isUsedFilter]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenSuccess(null);
    setGenError(null);

    try {
      const payload = {
        rewardAmount,
        prefix,
        count: generateMode === 'random' ? count : 1,
        customCode: generateMode === 'custom' ? customCode : undefined
      };

      const res = await axios.post('/api/admin/codes/generate', payload);
      if (res.data.success) {
        setGenSuccess(res.data.message);
        setCustomCode('');
        fetchCodes();
      }
    } catch (err) {
      setGenError(err.response?.data?.message || 'Failed to generate claim codes.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/codes/${id}`);
      if (res.data.success) {
        fetchCodes();
      }
    } catch (err) {
      alert('Failed to delete code.');
    }
  };

  const copyToClipboard = (codeStr) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          OTESS Claim Code Generator & Manager
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate voucher claim codes starting with OTESS for agents to unlock data rewards.
        </p>
      </div>

      {/* Code Generator Form Panel */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Generate New Claim Codes
            </h3>
            <p className="text-xs text-slate-500">
              Create random batch codes or custom promotional codes.
            </p>
          </div>
        </div>

        {genSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{genSuccess}</span>
          </div>
        )}

        {genError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm font-medium flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{genError}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setGenerateMode('random')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                generateMode === 'random' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md' : 'text-slate-500'
              }`}
            >
              Batch Random Generator
            </button>
            <button
              type="button"
              onClick={() => setGenerateMode('custom')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                generateMode === 'custom' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md' : 'text-slate-500'
              }`}
            >
              Custom Code
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {generateMode === 'random' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="OTESS"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Quantity to Generate
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Custom Code String
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="e.g. OTESS-VIP-99 or OTESS-CLAIM-2026"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Reward Bundle
              </label>
              <input
                type="text"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Codes...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Generate OTESS Claim Codes</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Codes Table List */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            Active & Used Claim Codes ({total})
          </h3>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={isUsedFilter}
              onChange={(e) => { setIsUsedFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none"
            >
              <option value="">All Codes</option>
              <option value="false">Active / Unused</option>
              <option value="true">Used / Claimed</option>
            </select>

            <button
              onClick={fetchCodes}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading codes...</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No claim codes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Claim Code</th>
                  <th className="pb-3">Reward Tier</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Redeemed By Phone</th>
                  <th className="pb-3">Created At</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {codes.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 font-mono font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                      <span>{c.code}</span>
                      <button
                        onClick={() => copyToClipboard(c.code)}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                        title="Copy Code"
                      >
                        {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="py-3.5 font-bold text-slate-700 dark:text-slate-300">
                      {c.rewardAmount}
                    </td>
                    <td className="py-3.5">
                      {c.isUsed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          USED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ACTIVE / READY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {c.usedByPhone || '—'}
                    </td>
                    <td className="py-3.5 text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                        title="Delete Code"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
