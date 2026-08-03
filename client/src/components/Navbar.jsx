import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, ShieldCheck, LogOut, Lock, Gift, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('site_logo_url') || '');
  const [giveawayActive, setGiveawayActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGiveawayStatus();
    const interval = setInterval(fetchGiveawayStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchGiveawayStatus = async () => {
    try {
      const res = await axios.get('/api/system/settings');
      if (res.data?.success) {
        setGiveawayActive(!!res.data.giveawayActive);
      }
    } catch (err) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Verify Number', path: '/verify' },
    ...(giveawayActive ? [{ name: 'Claim Free Data 🎁', path: '/giveaway', isHighlight: true }] : []),
    { name: 'Submit Request', path: '/submit' },
    { name: 'Track Status', path: '/track' },
    { name: 'Support', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Brand Logo" 
                className="h-10 sm:h-11 w-auto max-w-[160px] object-contain rounded-xl"
                onError={() => setLogoUrl('')}
              />
            ) : (
              <>
                <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-outfit font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent text-xl sm:text-2xl leading-none">
                    OTESS Data
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
                    Verification & Giveaway Portal
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1.5 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                    link.isHighlight
                      ? isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'bg-amber-400/90 hover:bg-amber-400 text-slate-950 shadow-sm'
                      : isActive
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200/60 dark:border-slate-700/60"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {admin ? (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/admin"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Portal</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all border border-red-500/20"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center space-x-2 px-5 py-2.5 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-800 dark:text-slate-200 hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900"
              >
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Admin Login</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold transition-all ${
                  link.isHighlight
                    ? 'bg-amber-400 text-slate-950'
                    : isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          {admin ? (
            <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-xl text-sm font-extrabold bg-blue-600 text-white"
              >
                Admin Portal
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-3 rounded-xl text-sm font-extrabold bg-red-500/10 text-red-600 dark:text-red-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-xl text-sm font-extrabold bg-slate-900 text-white dark:bg-slate-800"
              >
                Admin Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
