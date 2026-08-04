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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 overflow-x-hidden">
      <Navbar />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#1e293b] py-8 mt-auto shadow-lg">
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
