import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Verify from './pages/Verify';
import SubmitNumber from './pages/SubmitNumber';
import Track from './pages/Track';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminVerified from './pages/AdminVerified';
import AdminPending from './pages/AdminPending';
import AdminSMSConfig from './pages/AdminSMSConfig';
import AdminUpload from './pages/AdminUpload';
import AdminBatches from './pages/AdminBatches';
import AdminLogs from './pages/AdminLogs';
import GiveawayPage from './pages/GiveawayPage';
import CodeManagement from './pages/CodeManagement';
import AdminGiveawayNumbers from './pages/AdminGiveawayNumbers';
import AdminGiveawayClaims from './pages/AdminGiveawayClaims';

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen relative bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">
      {/* Fixed Viewport Glow Background (Prevents mobile scroll white clipping) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-[#0f172a] dark:via-[#1e1b4b]/30 dark:to-[#0f172a]">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full filter blur-2xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full filter blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-80 h-80 bg-amber-400/10 dark:bg-amber-500/10 rounded-full filter blur-2xl pointer-events-none" />
      </div>

      <Navbar />
      <main className="flex-grow w-full relative z-10">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-[#1e293b]/95 py-8 mt-auto relative z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
          <p className="font-medium">© {new Date().getFullYear()} OTESS Phone Number Verification System. All rights reserved.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Built for verifying data bundle order lists before purchasing.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: '#1e293b',
            color: '#fff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
          },
          success: {
            iconTheme: {
              primary: '#2563EB',
              secondary: '#fff',
            },
          },
        }} 
      />
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="verify" element={<Verify />} />
          <Route path="submit" element={<SubmitNumber />} />
          <Route path="track" element={<Track />} />
          <Route path="contact" element={<Contact />} />
          <Route path="giveaway" element={<GiveawayPage />} />
          <Route path="login" element={<Login />} />
        </Route>
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="verified" element={<AdminVerified />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="codes" element={<CodeManagement />} />
          <Route path="giveaway-numbers" element={<AdminGiveawayNumbers />} />
          <Route path="giveaway-claims" element={<AdminGiveawayClaims />} />
          <Route path="sms-config" element={<AdminSMSConfig />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="batches" element={<AdminBatches />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
      </Routes>
    </>
  );
}
