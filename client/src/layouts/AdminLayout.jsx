import React, { useState } from 'react';
import { Navigate, Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CheckCircle, Clock, Upload, Layers, FileText, LogOut, Menu, X, ShieldCheck, MessageSquare, KeyRound, Gift, ArrowLeft } from 'lucide-react';

const AdminLayout = () => {
  const { admin, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-medium">
        Loading admin dashboard...
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  const navLinks = [
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard Overview', end: true },
    { to: '/admin/giveaway-claims', icon: <Gift size={18} className="text-amber-500" />, label: 'Giveaway Data Orders', isHighlight: true },
    { to: '/admin/giveaway-numbers', icon: <Upload size={18} className="text-blue-500" />, label: 'Customer Purchase Numbers' },
    { to: '/admin/codes', icon: <KeyRound size={18} className="text-indigo-500" />, label: 'Claim Codes (OTESS)' },
    { to: '/admin/verified', icon: <CheckCircle size={18} className="text-emerald-500" />, label: 'Verified Numbers' },
    { to: '/admin/pending', icon: <Clock size={18} className="text-amber-500" />, label: 'Pending Requests' },
    { to: '/admin/sms-config', icon: <MessageSquare size={18} />, label: 'SMS Gateway (Arkesel)' },
    { to: '/admin/upload', icon: <Upload size={18} />, label: 'Bulk Verification Upload' },
    { to: '/admin/batches', icon: <Layers size={18} />, label: 'Upload Batches' },
    { to: '/admin/logs', icon: <FileText size={18} />, label: 'Activity Audit Logs' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-30 sticky top-0">
        <div className="flex items-center gap-2.5 font-outfit font-black text-lg text-slate-900 dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck size={20} />
          </div>
          <span>OTESS Master Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-500 rounded-xl bg-slate-100 dark:bg-slate-800">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 w-72 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 z-20 transition-transform duration-200 ease-in-out flex flex-col shadow-xl`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-outfit font-black text-lg text-slate-900 dark:text-white leading-none">
                OTESS Admin
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Master Control
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.icon}
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to Main Website</span>
          </Link>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <div className="truncate pr-2">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{admin.name || 'System Admin'}</p>
              <p className="text-[10px] font-mono text-slate-400 truncate">{admin.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
