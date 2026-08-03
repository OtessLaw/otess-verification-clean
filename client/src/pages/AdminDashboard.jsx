import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, XCircle, Layers, Upload, TrendingUp, Calendar, Gift, KeyRound, ArrowRight, ShieldCheck, Database, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBatches, setRecentBatches] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customTrackerDate, setCustomTrackerDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  const [giveawayActive, setGiveawayActive] = useState(false);
  const [requiredPurchaseCount, setRequiredPurchaseCount] = useState(2);
  const [togglingGiveaway, setTogglingGiveaway] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchLiveTrackerDate();
    fetchGiveawayStatus();
  }, []);

  const fetchGiveawayStatus = async () => {
    try {
      const res = await axios.get('/api/system/settings');
      if (res.data?.success) {
        setGiveawayActive(!!res.data.giveawayActive);
        if (res.data.requiredPurchaseCount) setRequiredPurchaseCount(res.data.requiredPurchaseCount);
      }
    } catch {}
  };

  const handleToggleGiveaway = async (newActiveState) => {
    try {
      setTogglingGiveaway(true);
      const targetActive = newActiveState !== undefined ? newActiveState : !giveawayActive;
      const res = await axios.post('/api/admin/toggle-giveaway', { 
        giveawayActive: targetActive,
        requiredPurchaseCount: Number(requiredPurchaseCount)
      });
      if (res.data.success) {
        setGiveawayActive(res.data.giveawayActive);
        if (res.data.requiredPurchaseCount) setRequiredPurchaseCount(res.data.requiredPurchaseCount);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error('Failed to update giveaway settings');
    } finally {
      setTogglingGiveaway(false);
    }
  };

  const fetchLiveTrackerDate = async () => {
    try {
      const res = await axios.get('/api/system/latest-date');
      if (res.data?.latestDate) {
        setCustomTrackerDate(res.data.latestDate);
      }
    } catch {}
  };

  const handleUpdateLiveTrackerDate = async (e) => {
    e.preventDefault();
    try {
      setSavingDate(true);
      const res = await axios.post('/api/admin/live-tracker-date', { liveTrackerDate: customTrackerDate });
      if (res.data.success) {
        toast.success(`Live Tracker date updated to: "${customTrackerDate || 'Auto'}"`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update Live Tracker date');
    } finally {
      setSavingDate(false);
    }
  };

  const fetchDashboardData = async (retries = 2) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentBatches(res.data.recentBatches || []);
        setChartData(res.data.chartData || []);
      }
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => fetchDashboardData(retries - 1), 400);
        return;
      }
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-medium text-sm">
        Loading admin dashboard metrics...
      </div>
    );
  }

  const statCards = [
    { title: 'Verified Numbers', value: stats?.verifiedCount || 0, icon: <CheckCircle className="text-emerald-500" size={24} />, bg: 'bg-emerald-500/10 border-emerald-500/20', link: '/admin/verified' },
    { title: 'Data Giveaway Orders', value: 'Live', icon: <Gift className="text-blue-500" size={24} />, bg: 'bg-blue-500/10 border-blue-500/20', link: '/admin/giveaway-claims', badge: 'Action Required' },
    { title: 'Customer Purchases', value: 'Today', icon: <Database className="text-amber-500" size={24} />, bg: 'bg-amber-500/10 border-amber-500/20', link: '/admin/giveaway-numbers' },
    { title: 'OTESS Claim Codes', value: 'Active', icon: <KeyRound className="text-indigo-500" size={24} />, bg: 'bg-indigo-500/10 border-indigo-500/20', link: '/admin/codes' },
    { title: 'Pending Queue', value: stats?.pendingCount || 0, icon: <Clock className="text-amber-500" size={24} />, bg: 'bg-amber-500/10 border-amber-500/20', link: '/admin/pending' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OTESS Master Control Center</span>
          </div>
          <h1 className="font-outfit text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Admin Management Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor number verifications, fulfill data giveaway orders, and manage OTESS claim codes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/giveaway-claims"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center space-x-2"
          >
            <Gift className="w-4 h-4" />
            <span>View Data Giveaway Orders</span>
          </Link>
        </div>
      </div>

      {/* Master Data Giveaway System On/Off Toggle Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xl transition-all border-2 ${
        giveawayActive 
          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 border-amber-300 text-slate-950' 
          : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest">
              <Gift size={18} className={giveawayActive ? 'text-slate-950' : 'text-amber-500'} />
              <span>Public Data Giveaway Master Control</span>
            </div>
            <h2 className="font-outfit text-xl sm:text-2xl font-black">
              Data Giveaway Portal Status: {giveawayActive ? 'ACTIVE 🎉 (Visible on Site)' : 'OFF / CLOSED 🔒 (Hidden)'}
            </h2>
            <p className={`text-xs sm:text-sm font-medium ${giveawayActive ? 'text-slate-900/90' : 'text-slate-500 dark:text-slate-400'}`}>
              {giveawayActive 
                ? 'The Data Giveaway is currently LIVE on the website. Customers can verify purchases and claim free data.' 
                : 'The Data Giveaway is currently OFF. The button and giveaway section are hidden from users so it does not interfere with normal number verifications.'}
            </p>
            
            <div className="pt-2 flex items-center space-x-3">
              <label className="text-xs font-black uppercase tracking-wider">
                Required Purchases to Qualify:
              </label>
              <select
                value={requiredPurchaseCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRequiredPurchaseCount(val);
                  axios.post('/api/admin/toggle-giveaway', { giveawayActive, requiredPurchaseCount: val })
                    .then(res => {
                      if (res.data.success) toast.success(`Required purchases set to ${val}`);
                    });
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs outline-none border ${
                  giveawayActive 
                    ? 'bg-slate-950 text-white border-slate-800' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                }`}
              >
                <option value="1">1 Customer Purchase Number</option>
                <option value="2">2 Customer Purchase Numbers</option>
                <option value="3">3 Customer Purchase Numbers</option>
                <option value="4">4 Customer Purchase Numbers</option>
                <option value="5">5 Customer Purchase Numbers</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleToggleGiveaway(!giveawayActive)}
            disabled={togglingGiveaway}
            className={`px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all shrink-0 flex items-center space-x-2 ${
              giveawayActive
                ? 'bg-slate-950 text-white hover:bg-slate-900'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-500 hover:to-amber-600 border border-amber-300/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{togglingGiveaway ? 'Updating Status...' : giveawayActive ? 'Turn OFF Giveaway Portal' : 'Turn ON Giveaway Portal 🎉'}</span>
          </button>
        </div>
      </div>

      {/* Live Database Date Control Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-blue-200 uppercase tracking-widest">
              <Calendar size={16} />
              <span>Public Live Database Control</span>
            </div>
            <h2 className="font-outfit text-xl sm:text-2xl font-black">Active Verification Date Banner</h2>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-xl">
              Set the verified date shown to users on the main verification box (e.g. "27 July 2026").
            </p>
          </div>

          <form onSubmit={handleUpdateLiveTrackerDate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={customTrackerDate}
              onChange={(e) => setCustomTrackerDate(e.target.value)}
              placeholder="e.g. 27 July 2026"
              className="bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-60"
            />
            <button
              type="submit"
              disabled={savingDate}
              className="px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-black rounded-xl transition-all shadow-md shrink-0 disabled:opacity-50"
            >
              {savingDate ? 'Saving...' : 'Update Date'}
            </button>
          </form>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <Link
            key={idx}
            to={stat.link}
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl border ${stat.bg}`}>
                {stat.icon}
              </div>
              {stat.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {stat.badge}
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</p>
              <h3 className="font-outfit text-2xl font-black text-slate-900 dark:text-white mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {stat.value}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts & Recent Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp size={22} className="text-blue-500" />
              <h2 className="font-outfit text-lg font-extrabold text-slate-900 dark:text-white">Verification Activity (7 Days)</h2>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPending)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Layers size={20} className="text-blue-500" />
              <h2 className="font-outfit text-lg font-extrabold text-slate-900 dark:text-white">Recent Upload Batches</h2>
            </div>
          </div>

          <div className="space-y-3">
            {recentBatches.length > 0 ? (
              recentBatches.map(batch => (
                <div key={batch._id || batch.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{batch.filename || 'Manual Entry'}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{new Date(batch.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-extrabold text-xs">
                      {batch.totalCount} items
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs py-8 text-center font-medium">No recent upload batches found.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
