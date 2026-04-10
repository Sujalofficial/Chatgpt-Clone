import React, { useRef, useState } from 'react';
import { Image, FileText, Video, Music, Paperclip, Loader2, X } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { API_BASE } from '../config';

export default function FileUpload({ onUploadComplete, onPreview }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { session, manualSession } = useAuthStore();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    const localUrl = URL.createObjectURL(file);
    let type = 'image';
    if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('video')) type = 'video';
    else if (file.type.includes('audio')) type = 'audio';
    
    onPreview(localUrl, type);
    setShowMenu(false);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // We'll simulate progress since fetch doesn't support it easily without XHR
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const token = session?.access_token || manualSession?.access_token;
      const resp = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (resp.ok) {
        const result = await resp.json();
        onUploadComplete(result.url, result);
      } else {
        const err = await resp.json();
        alert(`Upload failed: ${err.message || 'Unknown error'}`);
        onPreview(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading file. Make sure the backend is running.');
      onPreview(null);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const menuItems = [
    { id: 'image', label: 'Image', icon: Image, accept: 'image/*', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'doc', label: 'Document', icon: FileText, accept: 'application/pdf,.doc,.docx,.txt', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'video', label: 'Video', icon: Video, accept: 'video/*', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'audio', label: 'Audio', icon: Music, accept: 'audio/*', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Upload Hub Menu */}
      {showMenu && (
        <div className="absolute bottom-full left-0 mb-4 w-52 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in slide-in-from-bottom-3 duration-200 z-50">
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-2">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Media Pipeline</span>
             <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
               <X className="w-3 h-3" />
             </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = item.accept;
                    fileInputRef.current.click();
                  }
                }}
                className="flex items-center gap-3 w-full p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all group"
              >
                <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-105 transition-transform`}>
                   <item.icon className="w-4 h-4 shadow-sm" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isUploading}
        className={`p-3 rounded-2xl transition-all relative ${isUploading ? 'text-primary' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-white'} ${showMenu ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white' : ''}`}
        title="Upload Multimodal Files"
      >
        {isUploading ? (
          <div className="relative">
            <Loader2 className="w-5 h-5 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-[6px] font-bold">{uploadProgress}%</div>
            </div>
          </div>
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
