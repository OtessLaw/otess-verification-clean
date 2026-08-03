import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Gift, Search, FileSpreadsheet, Zap, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export default function Home() {
  const [giveawayActive, setGiveawayActive] = useState(false);

  useEffect(() => {
    axios.get('/api/system/settings')
      .then(res => {
        if (res.data?.success) {
          setGiveawayActive(!!res.data.giveawayActive);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative py-12 sm:py-20">
      
      {/* Background Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <section className="max-w-5xl mx-auto px-4 space-y-14">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          
          {/* Neon Animated Pill Badge */}
          <div className="inline-flex items-center space-x-2.5 px-5 py-2 bg-blue-500/10 dark:bg-blue-900/30 border border-blue-500/30 rounded-full text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 neon-badge shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>OTESS Verification System • MTN Ghana</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white font-outfit leading-[1.1]">
            Verify MTN Numbers <br />
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
              Before Data Orders
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-semibold max-w-xl mx-auto leading-relaxed">
            Check if customer number is in our database.
          </p>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/verify"
              className="w-full sm:w-auto px-9 py-4 btn-glow-blue text-white font-black rounded-2xl transition-all text-center flex items-center justify-center space-x-3 text-base"
            >
              <Search className="w-5 h-5" />
              <span>Verify Numbers</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>

            <Link
              to="/submit"
              className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl font-black transition-all text-center flex items-center justify-center space-x-2 text-base shadow-lg backdrop-blur-xl"
            >
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <span>Submit Request</span>
            </Link>

            {giveawayActive && (
              <Link
                to="/giveaway"
                className="w-full sm:w-auto px-8 py-4 btn-glow-amber text-slate-950 font-black rounded-2xl transition-all text-center flex items-center justify-center space-x-2 text-base"
              >
                <Gift className="w-5 h-5 text-slate-950" />
                <span>Claim Free Data 🎁</span>
              </Link>
            )}
          </div>
        </div>

        {/* PROMOTIONAL DATA GIVEAWAY CARD (ONLY WHEN ACTIVATED BY ADMIN) */}
        {giveawayActive && (
          <div className="glass-panel rounded-3xl p-8 border-2 border-amber-400/50 text-center space-y-4 shadow-2xl max-w-2xl mx-auto relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/40 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>MTN Data Giveaway Open</span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">
              Qualify for Free MTN Data?
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Enter customer data purchases today & your OTESS Claim Code to redeem free MTN data.
            </p>

            <div className="pt-2">
              <Link
                to="/giveaway"
                className="inline-flex items-center space-x-2 px-7 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg transition-all"
              >
                <span>Claim Data Reward Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 3 HIGH-CONTRAST FEATURE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          
          <div className="glass-panel p-6 rounded-3xl text-center space-y-3 hover:border-blue-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-black text-base text-slate-900 dark:text-white font-outfit">Sub-100ms Speed</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">High-speed database response for instant phone number checks.</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl text-center space-y-3 hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-black text-base text-slate-900 dark:text-white font-outfit">OTESS Verified</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified numbers are cleared for bulk data bundle orders.</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl text-center space-y-3 hover:border-indigo-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="font-black text-base text-slate-900 dark:text-white font-outfit">Bulk Files</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload CSV or Excel spreadsheets to verify hundreds of numbers.</p>
          </div>

        </div>

      </section>
    </div>
  );
}
