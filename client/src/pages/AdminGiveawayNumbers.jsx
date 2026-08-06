import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, ClipboardList, CheckCircle2, AlertTriangle, RefreshCw, Calendar, Trash2, Search, Users, Database } from 'lucide-react';

export default function AdminGiveawayNumbers() {
  const [activeTab, setActiveTab] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  // Table Data State
  const [numbers, setNumbers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [tableLoading, setTableLoading] = useState(true);

  const fetchNumbers = async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '25');
      if (search) params.append('search', search);

      const res = await axios.get(`/api/admin/giveaway-numbers?${params.toString()}`);
      if (res.data.success) {
        setNumbers(res.data.numbers);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Fetch numbers error:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, [page]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUploadResult(null);

    if (activeTab === 'file' && !selectedFile) {
      setError('Please select a CSV or Excel (.xlsx) file to upload.');
      return;
    }

    if (activeTab === 'manual' && (!manualText || manualText.trim().length === 0)) {
      setError('Please paste at least one phone number.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('date', targetDate);

      if (activeTab === 'file') {
        formData.append('file', selectedFile);
      } else {
        formData.append('manualText', manualText);
      }

      const res = await axios.post('/api/admin/giveaway-numbers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUploadResult(res.data);
        setSelectedFile(null);
        setManualText('');
        fetchNumbers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload numbers.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNumber = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/giveaway-numbers/${id}`);
      if (res.data.success) {
        fetchNumbers();
      }
    } catch (err) {
      alert('Failed to delete number.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Customer Purchase Numbers Database
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload and manage the list of customer phone numbers who purchased data bundles today.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Upload Target Date
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>CSV / Excel File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-blue-500" />
              <span>Manual Copy & Paste</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm font-medium flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>{uploadResult.message}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/40">
              <input
                type="file"
                id="giveaway-file-input"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="giveaway-file-input" className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 mx-auto text-blue-500" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select CSV or Excel (.xlsx) file'}
                </p>
              </label>
            </div>
          ) : (
            <div>
              <textarea
                rows={5}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste numbers here (one per line):&#10;0241234567&#10;0549876543"
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading Numbers...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Save Customer Purchase Numbers</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Uploaded Customer Numbers List Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-500" />
            <span>Uploaded Customer Numbers Log ({total})</span>
          </h3>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                if (!numbers || numbers.length === 0) return;
                const text = numbers.map(n => n.phoneNumber).filter(Boolean).join('\n');
                navigator.clipboard.writeText(text);
                alert('Copied all numbers (lines) to clipboard!');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all"
            >
              <span>Copy Bulk (Newlines)</span>
            </button>

            <button
              onClick={() => {
                if (!numbers || numbers.length === 0) return;
                const text = numbers.map(n => n.phoneNumber).filter(Boolean).join(', ');
                navigator.clipboard.writeText(text);
                alert('Copied all numbers (commas) to clipboard!');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all"
            >
              <span>Copy Bulk (Commas)</span>
            </button>

            <button
              onClick={fetchNumbers}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${tableLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {tableLoading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading numbers...</div>
        ) : numbers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No customer purchase numbers uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Phone Number</th>
                  <th className="pb-3">Network</th>
                  <th className="pb-3">Uploaded Date</th>
                  <th className="pb-3">Claim Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {numbers.map((n) => (
                  <tr key={n._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {n.phoneNumber}
                    </td>
                    <td className="py-3 text-slate-500 font-semibold">
                      {n.network}
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {n.uploadedDate}
                    </td>
                    <td className="py-3">
                      {n.used ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          USED FOR CLAIM
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ELIGIBLE / UNUSED
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteNumber(n._id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete Number"
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
