import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, FileSpreadsheet, X, CheckCircle, ClipboardPaste, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUpload = () => {
  const [tab, setTab] = useState('file'); // 'file' or 'paste'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // Paste tab state
  const [pastedNumbers, setPastedNumbers] = useState('');
  const [pasting, setPasting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadFile = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('File uploaded successfully!');
        setResult(res.data.summary || res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handlePasteUpload = async () => {
    const lines = pastedNumbers.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('Please paste at least one phone number.');
      return;
    }
    setPasting(true);
    setResult(null);
    try {
      const res = await axios.post('/api/admin/verified/bulk-add', {
        phoneNumbers: lines
      });
      if (res.data.success) {
        toast.success(`${res.data.summary?.added || lines.length} numbers added successfully!`);
        setResult(res.data.summary || { total: lines.length, added: lines.length, duplicates: 0, invalid: 0 });
        setPastedNumbers('');
      }
    } catch (error) {
      // fallback: try upload as txt file
      try {
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const txtFile = new File([blob], 'pasted_numbers.txt', { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', txtFile);
        const res2 = await axios.post('/api/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res2.data.success) {
          toast.success('Numbers uploaded successfully!');
          setResult(res2.data.summary || res2.data);
          setPastedNumbers('');
        }
      } catch (err2) {
        toast.error(err2.response?.data?.message || 'Failed to upload numbers');
      }
    } finally {
      setPasting(false);
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPastedNumbers(prev => prev ? prev + '\n' + text : text);
      toast.success('Numbers pasted from clipboard!');
    } catch {
      toast.error('Could not read clipboard. Please paste manually using Ctrl+V.');
    }
  };

  const lineCount = pastedNumbers.split(/[\n,]+/).map(p => p.trim()).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Bulk Upload Verified Numbers</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Upload a file or paste numbers directly to add multiple verified numbers at once.</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
        <button
          onClick={() => { setTab('file'); setResult(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${tab === 'file' ? 'bg-white dark:bg-[#1e293b] text-[#2563eb] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <UploadIcon size={18} /> Upload File (.xlsx / .csv / .txt)
        </button>
        <button
          onClick={() => { setTab('paste'); setResult(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${tab === 'paste' ? 'bg-white dark:bg-[#1e293b] text-[#2563eb] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <ClipboardPaste size={18} /> Copy & Paste Numbers
        </button>
      </div>

      {tab === 'file' ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-10 text-center">
          {!file ? (
            <div
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-[#2563eb] rounded-full flex items-center justify-center">
                <UploadIcon size={32} />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-500">Supports .xlsx, .xls, .csv, .txt</p>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-6">
              <div className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileSpreadsheet className="text-[#2563eb] flex-shrink-0" size={24} />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button onClick={clearFile} disabled={uploading} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <button
                onClick={handleUploadFile}
                disabled={uploading}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <span>Uploading...</span> : <><UploadIcon size={20} /><span>Process File</span></>}
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv,.txt" className="hidden" />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Smartphone size={16} className="text-[#2563eb]" />
              Paste Phone Numbers (one per line or comma separated)
            </label>
            <div className="flex items-center gap-2">
              {lineCount > 0 && (
                <span className="text-xs font-bold bg-[#2563eb]/10 text-[#2563eb] px-2 py-1 rounded-lg">
                  {lineCount} number{lineCount !== 1 ? 's' : ''} detected
                </span>
              )}
              <button
                onClick={handleClipboardPaste}
                className="flex items-center gap-1.5 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] bg-[#2563eb]/10 hover:bg-[#2563eb]/20 px-3 py-1.5 rounded-lg transition-all"
              >
                <ClipboardPaste size={14} /> Paste from Clipboard
              </button>
            </div>
          </div>

          <textarea
            value={pastedNumbers}
            onChange={(e) => setPastedNumbers(e.target.value)}
            placeholder="Paste numbers here...&#10;0241234567&#10;0209876543&#10;0551122334&#10;&#10;or comma separated:&#10;0241234567, 0209876543, 0551122334"
            rows={10}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-y"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => { setPastedNumbers(''); setResult(null); }}
              className="text-sm text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X size={15} /> Clear
            </button>
            <button
              onClick={handlePasteUpload}
              disabled={pasting || lineCount === 0}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#2563eb]/20"
            >
              {pasting ? 'Uploading...' : <><CheckCircle size={18} /> Add {lineCount > 0 ? lineCount : ''} Numbers to Database</>}
            </button>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
          <div className="w-full">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-400 mb-4">✅ Upload Complete!</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Total Processed</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{result.total || 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Successfully Added</p>
                <p className="text-xl font-bold text-green-600">{result.added || 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Duplicates Skipped</p>
                <p className="text-xl font-bold text-amber-500">{result.duplicates || 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Invalid Format</p>
                <p className="text-xl font-bold text-red-500">{result.invalid || 0}</p>
              </div>
            </div>
            {result.batchId && (
              <p className="mt-4 text-sm text-green-700 dark:text-green-500">
                Batch ID: <span className="font-mono bg-white/50 dark:bg-black/20 px-2 py-1 rounded">{result.batchId}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;
