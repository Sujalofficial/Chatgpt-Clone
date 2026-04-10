import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { API_URL } from '../../config';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const err = await resp.json();
        setError(err.message || 'Reset failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6">
      <div className="bg-[var(--sidebar)] rounded-[2.5rem] border border-[var(--border)] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-600 opacity-50"></div>
        
        {success ? (
          <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
             <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
             </div>
             <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Success!</h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Password updated. Redirecting to login...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-2xl font-black uppercase tracking-tighter">New Password</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Update security credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                    placeholder="Enter new password"
                  />
                   <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-500/10 rounded-lg text-slate-400 transition-all focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-500 text-[10px] font-black text-center uppercase tracking-widest">
                  ⚠️ {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black shadow-lg shadow-primary/20 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
