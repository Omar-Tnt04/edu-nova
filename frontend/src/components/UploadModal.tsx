import { useState } from "react";
import { X, UploadCloud, File, AlertTriangle, CheckCircle2, Loader2, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadPdf } from "@/lib/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (doc: any) => void;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    
    // Simulate progress for UI feel
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 500);

    try {
      const res = await uploadPdf(file);
      
      clearInterval(interval);
      setProgress(100);
      setStatus('success');
      setResult(res);
      
      // Notify parent
      setTimeout(() => {
        onUploadSuccess(res);
      }, 1500);

    } catch (err: any) {
      clearInterval(interval);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to upload and index document.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/2">
              <h3 className="text-sm font-semibold text-white tracking-[0.1em] uppercase font-display">Add New Source</h3>
              <button 
                onClick={onClose}
                disabled={status === 'uploading'}
                className="text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Upload Complete</h3>
                  <p className="text-gray-400 mb-6 max-w-sm">
                    "{file?.name}" has been successfully parsed and indexed by EduNova.
                  </p>
                  
                  <div className="flex gap-6 p-4 rounded-xl bg-gray-900 border border-gray-800 w-full justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{result?.pages || 0}</p>
                      <p className="text-xs text-gray-500 uppercase font-medium">Pages</p>
                    </div>
                    <div className="w-px bg-gray-800"></div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{result?.chunks || 0}</p>
                      <p className="text-xs text-gray-500 uppercase font-medium">Chunks</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Drag Drop Zone */}
                  {!file && status !== 'uploading' && (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden ${
                        isDragging 
                          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                          : "border-white/10 bg-white/2 hover:border-white/30"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      <UploadCloud className={`mb-4 w-12 h-12 transition-colors duration-300 ${isDragging ? 'text-blue-400' : 'text-neutral-600'}`} strokeWidth={1.5} />
                      <p className="text-sm font-medium text-neutral-200 mb-1">
                        Drag & drop your PDF here
                      </p>
                      <p className="text-xs text-neutral-500 mb-6 font-light">
                        or click to browse your files
                      </p>
                      
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileChange}
                        className="hidden" 
                        id="file-upload"
                      />
                      <label 
                        htmlFor="file-upload" 
                        className="btn-hover-effect cursor-pointer bg-white text-black px-6 py-2.5 rounded-sm font-medium text-xs tracking-widest uppercase shadow-sm transition-all"
                      >
                        Select File
                      </label>
                    </div>
                  )}

                  {file && status !== 'uploading' && (
                    <div className="border border-white/10 bg-white/2 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                          <FileText className="text-blue-400" size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-neutral-500 mt-1 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setFile(null); setErrorMsg(""); }}
                        className="text-neutral-500 hover:text-red-400 p-2 transition-colors rounded-full hover:bg-white/5"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* Errors */}
                  {errorMsg && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                      <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-red-400/90 leading-relaxed font-light">{errorMsg}</p>
                    </div>
                  )}

                  {/* Uploading State */}
                  {status === 'uploading' && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center relative">
                            <FileText className="text-blue-400 absolute" size={24} />
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle 
                            cx="32" cy="32" r="30" 
                            fill="none" 
                            className="stroke-white/10" 
                            strokeWidth="2" 
                          />
                          <motion.circle 
                            cx="32" cy="32" r="30" 
                            fill="none" 
                            className="stroke-blue-500" 
                            strokeWidth="2" 
                            strokeDasharray={188.5}
                            initial={{ strokeDashoffset: 188.5 }}
                            animate={{ strokeDashoffset: 188.5 - (188.5 * progress) / 100 }}
                            transition={{ duration: 0.2 }}
                          />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">Processing Document</h4>
                      <p className="text-xs text-neutral-500 font-mono tracking-widest">{Math.round(progress)}% COMPLETED</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {status !== 'success' && (
              <div className="p-5 border-t border-white/5 bg-black/40 flex justify-end gap-3 backdrop-blur-md">
                <button 
                  onClick={onClose} 
                  disabled={status === 'uploading'}
                  className="px-6 py-2.5 text-xs font-semibold tracking-widest uppercase text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload} 
                  disabled={!file || status === 'uploading'}
                  className="btn-hover-effect px-6 py-2.5 bg-white text-black text-xs font-semibold tracking-widest uppercase rounded-sm disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {status === 'uploading' ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  Index Data
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
