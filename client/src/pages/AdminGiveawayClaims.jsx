import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Download, Trash2, Copy, Check, Search, RefreshCw, CheckCircle2, Clock, Calendar } from 'lucide-react';

export default function AdminGiveawayClaims() {
  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [copyBulkLinesSuccess, setCopyBulkLinesSuccess] = useState(false);
  const [copyBulkCommaSuccess, setCopyBulkCommaSuccess] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '50');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get(`/api/admin/giveaway-claims?${params.toString()}`);
      if (res.data.success) {
        setClaims(res.data.claims);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Fetch claims error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, statusFilter]);

  const handleDeleteClaim = async (id) => {
    if (!window.confirm('Delete this claim record? This will free up the associated customer numbers.')) return;
    try {
      const res = await axios.delete(`/api/admin/giveaway-claims/${id}`);
      if (res.data.success) {
        fetchClaims();
      }
    } catch (err) {
      alert('Failed to delete claim.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get('/api/admin/giveaway-claims/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `otess_data_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV.');
    }
  };

  const copyNumber = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleCopyBulkLines = () => {
    if (!claims || claims.length === 0) return;
    const phoneList = claims.map(c => c.claimantNumber).filter(Boolean).join('\n');
    navigator.clipboard.writeText(phoneList);
    setCopyBulkLinesSuccess(true);
    setTimeout(() => setCopyBulkLinesSuccess(false), 2500);
  };

  const handleCopyBulkComma = () => {
    if (!claims || claims.length === 0) return;
    const phoneList = claims.map(c => c.claimantNumber).filter(Boolean).join(', ');
    navigator.clipboard.writeText(phoneList);
    setCopyBulkCommaSuccess(true);
    setTimeout(() => setCopyBulkCommaSuccess(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Gift className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Giveaway Data Orders & Claims ({total})</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Copy recipient phone numbers in bulk below to send data bundle rewards via your vendor portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyBulkLines}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition-all"
            title="Copy all recipient numbers separated by lines"
          >
            {copyBulkLinesSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copyBulkLinesSuccess ? 'Copied All (Newlines)!' : 'Copy Bulk (Newlines)'}</span>
          </button>

          <button
            onClick={handleCopyBulkComma}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition-all"
            title="Copy all recipient numbers separated by commas"
          >
            {copyBulkCommaSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copyBulkCommaSuccess ? 'Copied All (Comma)!' : 'Copy Bulk (Commas)'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg hover:bg-emerald-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchClaims(); }} className="w-full sm:w-80 relative">
            <input
              type="text"
              placeholder="Search Recipient Phone or Reference ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <button
            onClick={fetchClaims}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading claim requests...</div>
        ) : claims.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No data claim orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Recipient Phone (Send Data Here)</th>
                  <th className="pb-3">Reward Bundle</th>
                  <th className="pb-3">OTESS Code Used</th>
                  <th className="pb-3">Verified Customer Purchases</th>
                  <th className="pb-3">Claim Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {claims.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {/* Recipient Phone with Copy Button */}
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                          {c.claimantNumber}
                        </span>
                        <button
                          onClick={() => copyNumber(c.claimantNumber)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copy Recipient Number"
                        >
                          {copiedPhone === c.claimantNumber ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 font-extrabold text-slate-900 dark:text-white">
                      {c.reward}
                    </td>

                    <td className="py-4 font-mono font-bold text-amber-500">
                      {c.claimCode || '—'}
                    </td>

                    <td className="py-4 font-mono text-xs text-slate-400">
                      {c.verifiedNumbers?.join(' & ')}
                    </td>

                    <td className="py-4 text-xs text-slate-400">
                      {c.claimDate}
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDeleteClaim(c._id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                        title="Delete Claim"
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
