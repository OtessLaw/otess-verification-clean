import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, Send, MessageSquare, ShieldCheck, UserCheck, Smartphone, Clock, Copy, Loader, History, ExternalLink, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPending = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending queue!
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  const LIMIT = 20; // 20 numbers per page!

  useEffect(() => {
    fetchData();
  }, [page, search, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/pending?page=${page}&limit=${LIMIT}&status=${statusFilter}&search=${search}`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
        setSelectedIds([]);
      }
    } catch (error) {
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'processing' }));
    try {
      const res = await axios.put(`/api/admin/pending/${id}/process`);
      if (res.data.success) {
        toast.success('Marked request as Processing 🔵');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approving' }));
    try {
      const res = await axios.put(`/api/admin/pending/${id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message || 'Approved & SMS Sent to Agent!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve submission');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'rejecting' }));
    try {
      const res = await axios.put(`/api/admin/pending/${id}/reject`);
      if (res.data.success) {
        toast.success(res.data.message || 'Rejected & SMS Sent to Agent!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject submission');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleResendSMS = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'resending' }));
    try {
      const res = await axios.post(`/api/admin/pending/${id}/resend-sms`);
      if (res.data.success) {
        toast.success(res.data.message || 'SMS notification resent successfully!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend SMS notification');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await axios.delete(`/api/admin/pending/${id}`);
      if (res.data.success) {
        toast.success('Record deleted successfully');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleBulkProcess = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await axios.post('/api/admin/pending/bulk-process', { ids: selectedIds });
      if (res.data.success) {
        toast.success(res.data.message || 'Marked selected items as Processing 🔵');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed bulk process');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await axios.post('/api/admin/pending/bulk-approve', { ids: selectedIds });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk approved & SMS sent to agents!');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed bulk approve');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await axios.post('/api/admin/pending/bulk-reject', { ids: selectedIds });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk rejected & SMS sent to agents!');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed bulk reject');
    }
  };

  // Copy customer numbers to clipboard for quick verification
  const handleCopyNumbers = () => {
    let numbersToCopy = [];
    if (selectedIds.length > 0) {
      numbersToCopy = data
        .filter(item => selectedIds.includes(item._id || item.id))
        .map(item => item.customerNumber || item.phoneNumber);
    } else {
      numbersToCopy = data.map(item => item.customerNumber || item.phoneNumber);
    }

    if (!numbersToCopy.length) {
      toast.error('No customer numbers available to copy');
      return;
    }

    const textToCopy = numbersToCopy.join('\n');
    navigator.clipboard.writeText(textToCopy);
    toast.success(`Copied ${numbersToCopy.length} customer numbers to clipboard! 📋`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length && data.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item._id || item.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-[#2563eb]" size={28} />
            <span>Verification Queue & Batch Picker (20 / Page)</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pick numbers for verification, mark them as Processing, copy customer numbers in bulk, and approve/reject with automated SMS.
          </p>
        </div>

        <button
          onClick={handleCopyNumbers}
          className="px-4 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          title="Copy customer numbers line by line to clipboard for verification"
        >
          <Copy size={16} />
          <span>Copy {selectedIds.length ? `${selectedIds.length} Selected` : 'Page'} Numbers</span>
        </button>
      </div>

      {/* Queue Filter Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1 flex-wrap">
        <button
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${statusFilter === 'pending' ? 'bg-white dark:bg-[#1e293b] text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Clock size={16} /> Pending Queue
        </button>
        <button
          onClick={() => { setStatusFilter('processing'); setPage(1); }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${statusFilter === 'processing' ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Loader size={16} /> Processing Queue
        </button>
        <button
          onClick={() => { setStatusFilter('approved'); setPage(1); }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${statusFilter === 'approved' ? 'bg-white dark:bg-[#1e293b] text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <CheckCircle size={16} /> Approved History
        </button>
        <button
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${statusFilter === 'rejected' ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <XCircle size={16} /> Rejected History
        </button>
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-[#1e293b] text-[#2563eb] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <History size={16} /> All Requests
        </button>
      </div>

      <div className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search customer, agent or submission ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full md:w-80 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-[#2563eb] text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <>
                <span className="text-xs font-semibold text-slate-500 mr-1">{selectedIds.length} selected</span>
                <button onClick={handleBulkProcess} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                  <Loader size={14} /> Mark Processing
                </button>
                <button onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                  <CheckCircle size={14} /> Approve & SMS
                </button>
                <button onClick={handleBulkReject} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                  <XCircle size={14} /> Reject & SMS
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                  />
                </th>
                <th className="px-5 py-4 font-bold">Customer Number</th>
                <th className="px-5 py-4 font-bold">Agent Number</th>
                <th className="px-4 py-4 font-bold">Submission ID</th>
                <th className="px-4 py-4 font-bold">Status</th>
                <th className="px-4 py-4 font-bold">Agent SMS</th>
                <th className="px-4 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-400">Loading requests...</td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No requests found in this view.</p>
                  </td>
                </tr>
              ) : (
                data.map(item => {
                  const id = item._id || item.id;
                  const isPending = item.status === 'pending';
                  const isProcessing = item.status === 'processing';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';
                  const currentLoading = actionLoading[id];

                  return (
                    <tr key={id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleSelect(id)}
                          className="rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                        />
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Smartphone size={16} className="text-[#2563eb]" />
                        <span>{item.customerNumber || item.phoneNumber}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        <div className="flex items-center gap-1">
                          <UserCheck size={14} className="text-emerald-500" />
                          <span>{item.agentNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">{item.submissionId || 'SUB-N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          isProcessing ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                          isRejected ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {isApproved ? '🟢 Approved' : isProcessing ? '🔵 Processing' : isRejected ? '🔴 Rejected' : '🟡 Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {item.smsSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <MessageSquare size={12} /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {new Date(item.submittedAt || item.submittedDate || item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {(isPending || isProcessing) && (
                            <>
                              {isPending && (
                                <button
                                  onClick={() => handleProcess(id)}
                                  disabled={!!currentLoading}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                                  title="Mark as Processing"
                                >
                                  <Loader size={13} />
                                  <span>Process</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleApprove(id)}
                                disabled={!!currentLoading}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                                title="Approve & Send SMS"
                              >
                                <CheckCircle size={13} />
                                <span>Approve</span>
                              </button>
                            </>
                          )}

                          {(isApproved || isRejected) && (
                            <button
                              onClick={() => handleResendSMS(id)}
                              disabled={!!currentLoading}
                              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                              title="Resend SMS Notification to Agent"
                            >
                              <Send size={12} />
                              <span>Resend SMS</span>
                            </button>
                          )}

                          <button 
                            onClick={() => handleDelete(id)} 
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {pagination.pages} ({pagination.total} total requests — 20 per page)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Verification Link Card at the Bottom */}
      <div className="bg-gradient-to-r from-[#2563eb] to-indigo-600 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white">
            <ExternalLink size={24} />
          </div>
          <div>
            <h3 className="font-outfit font-bold text-lg">Proceed to Verification</h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
              Done picking customer numbers? Click below to open the Verification Tool or Bulk Upload portal immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <a
            href="https://getmyzta.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-6 py-3.5 bg-white text-[#2563eb] hover:bg-blue-50 font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Open Verification Portal (getmyzta.shop)</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminPending;
