import React, { useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { X, Camera, User as UserIcon, Mail, Check, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';

export default function ProfileModal({ onClose }) {
  const { user, profile, updateProfile, manualSession } = useAuthStore();
  const [name, setName] = useState(profile?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePfpUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Attempt to extract session natively first, fallback to manual auth session wrapper
      const state = useAuthStore.getState();
      const token = state.session?.access_token || state.manualSession?.access_token;

      const resp = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (resp.ok) {
        const result = await resp.json();
        await updateProfile({ profilePic: result.url });
      } else {
        alert('Upload failed. Check backend console.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Connection error.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({ name });
      onClose();
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300"></div>
      
      <div 
        className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-[#0f172a]/50">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Profile Identity</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mt-1">Personal Settings</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl font-black text-primary shadow-2xl ring-4 ring-white dark:ring-slate-800 rotate-3">
                {profile?.profilePic ? (
                  <img src={`${API_BASE}${profile.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.charAt(0).toUpperCase()
                )}
              </div>
              <label 
                className={`absolute inset-0 bg-primary/80 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-hover:rotate-0 transition-all cursor-pointer rotate-3 ${uploading ? 'opacity-100 pointer-events-none' : ''}`}
              >
                <input type="file" className="hidden" accept="image/*" onChange={handlePfpUpload} disabled={uploading} />
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-white mb-2" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Photo</span>
                  </>
                )}
              </label>
            </div>
            <div className="mt-6 text-center">
              <p className="text-lg font-black tracking-tight">{profile?.name || 'Anonymous User'}</p>
              <p className="text-xs font-bold text-muted mt-1 uppercase tracking-widest opacity-50">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <UserIcon className="w-4 h-4 text-primary" />
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Public Display Name</label>
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm" 
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <Mail className="w-4 h-4 text-slate-400" />
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account email</label>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl opacity-60 text-sm font-bold flex justify-between items-center group">
                   <span>{user?.email || ''}</span>
                   <Check className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/80 dark:bg-[#0f172a]/80 flex gap-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-2 py-4 px-10 bg-primary text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Identity'}
            </button>
        </div>
      </div>
    </div>
  );
}
