import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './Auth/LoginPage';
import SignupPage from './Auth/SignupPage';
import AuthCallback from './Auth/AuthCallback';
import ResetPasswordPage from './Auth/ResetPasswordPage';

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 relative scroll-smooth">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen w-screen">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[42%] bg-primary/20 blur-[130px] rounded-full animate-pulse transition-all duration-1000"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[42%] bg-indigo-500/10 blur-[130px] rounded-full delay-1000 animate-pulse transition-all duration-1000"></div>
          <div className="absolute top-[20%] right-[10%] w-[15%] h-[15%] bg-emerald-500/10 rounded-full blur-[90px] animate-bounce duration-[15s]"></div>
          
          {/* Abstract Grid Path - Cleaned */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]" 
               style={{ backgroundImage: `radial-gradient(var(--color-primary) 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}></div>
      </div>

       <div className="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-1000 relative z-10 w-full max-w-lg">
          {/* Synapse AI Logo Mark */}
          <div className="w-16 h-16 bg-gradient-to-tr from-[#4F8CFF] to-[#8A5CFF] rounded-[24px] mb-8 flex items-center justify-center text-white text-2xl shadow-[0_0_40px_rgba(79,140,255,0.2)] animate-pulse transition-all">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
              </div>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-white/20 rounded-full blur-[1px]"></div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-1 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
             <span className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-800 dark:text-white">Synapse AI Access</span>
             <div className="w-8 h-1 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
          </div>
          <h2 className="text-[11px] font-black text-emerald-600/60 uppercase tracking-[0.4em]">Neural Intelligence Framework</h2>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <Routes>
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/login" element={<LoginPage onToggle={() => navigate('/signup')} />} />
          <Route path="/signup" element={<SignupPage onToggle={() => navigate('/login')} />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>

      <div className="mt-12 text-center z-10 w-full max-w-md animate-in fade-in duration-1000 delay-500">
         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.6em] opacity-80">
           Beyond Chat • Into Intelligence
         </p>
      </div>
    </div>
  );
}
