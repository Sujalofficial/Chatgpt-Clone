import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { API_BASE, AUTH_URL } from '../../config';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface SignupPageProps {
  onToggle: () => void;
}

export default function SignupPage({ onToggle }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (resp.ok) {
        const { token, user } = await resp.json();
        (useAuthStore.getState() as any).setSessionFromPassport(token, user);
      } else {
        const err = await resp.json();
        setError(err.message || 'Signup failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${AUTH_URL}/google`;
  };

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 mx-auto py-2">
      <div className="bg-[var(--sidebar)] rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-6 sm:p-8 border border-[var(--border)] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto shadow-xl shadow-emerald-500/20 rotate-3 group-hover:rotate-6 transition-all duration-500">
             🚀
          </div>
          <h1 className="text-2xl font-black tracking-tighter mb-1 uppercase leading-none">Create Account</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-60">Neural Hub Network</p>
        </div>

        <button 
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg hover:translate-y-[-1px] transition-all mb-6 group/btn active:scale-95"
        >
          <GoogleIcon />
          <span className="text-slate-600 dark:text-slate-300">Sign Up with Google</span>
        </button>

        <div className="relative mb-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]"></div>
          </div>
          <span className="relative px-4 bg-[var(--sidebar)] text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Account Details</span>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
             <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-3 mb-0.5">Full Name</div>
             <div className="relative group">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Full Name" 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 required
                 className="w-full pl-11 pr-5 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all dark:text-white font-bold text-xs tracking-tight"
               />
             </div>
          </div>

          <div className="space-y-1.5">
             <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-3 mb-0.5">Email Address</div>
             <div className="relative group">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                 type="email" 
                 placeholder="Email Address" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="w-full pl-11 pr-5 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all dark:text-white font-bold text-xs tracking-tight"
               />
             </div>
          </div>

          <div className="space-y-1.5">
             <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-3 mb-0.5">Password</div>
             <div className="relative group">
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                 type={showPassword ? "text" : "password"} 
                 placeholder="Password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 className="w-full pl-11 pr-12 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all dark:text-white font-bold text-xs tracking-tight"
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group/submit uppercase tracking-widest text-[10px]"
          >
            {loading ? 'Processing...' : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/submit:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 text-[8px] font-black uppercase tracking-widest text-center anim">
             ❌ ERROR: {error}
          </div>
        )}

        <div className="mt-6 text-center text-[10px] font-bold text-slate-500">
          Already have an account? {' '}
          <button 
            onClick={onToggle}
            className="text-emerald-600 font-black hover:underline uppercase tracking-tight ml-1"
          >
             Login
          </button>
        </div>
      </div>
    </div>
  );
}
