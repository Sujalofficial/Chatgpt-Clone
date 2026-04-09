import { useSettingsStore } from '../store/settings-store';
import { X, Moon, Sun, Cpu, Zap } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { theme, setTheme, defaultModel, setDefaultModel, streaming, setStreaming } = useSettingsStore();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Dynamic backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300"></div>
      
      <div 
        className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-[#0f172a]/50">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Workspace Configuration</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mt-1">System Preferences</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Theme Section */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl shadow-sm border border-amber-500/20">
                <Sun className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="font-black text-sm tracking-tight">Appearance Theme</p>
                <p className="text-xs text-muted font-bold opacity-60">Adaptive Dark & Light layers</p>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-[#0f172a] p-1.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${theme === 'light' ? 'bg-white text-primary shadow-xl scale-105' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${theme === 'dark' ? 'bg-primary text-white shadow-xl scale-105 shadow-primary/20' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
            </div>
          </div>

          {/* Model selection */}
          <div className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-sm border border-primary/20">
                 <Cpu className="w-6 h-6" />
               </div>
               <div className="space-y-0.5">
                  <p className="font-black text-sm tracking-tight">Default Multi-Model</p>
                  <p className="text-xs text-muted font-bold opacity-60">Preferred initialization core</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               {[
                 { id: 'groq', name: 'Groq Cloud', subtitle: 'Llama 3.3 70B' },
                 { id: 'gemini', name: 'Google Studio', subtitle: 'Gemini 1.5 Flash' }
               ].map((m) => (
                 <button
                   key={m.id}
                   onClick={() => setDefaultModel(m.id)}
                   className={`p-4 rounded-[1.5rem] border text-left transition-all relative overflow-hidden group ${defaultModel === m.id ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                 >
                   <div className="text-sm font-black tracking-tight">{m.name}</div>
                   <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{m.subtitle}</div>
                   {defaultModel === m.id && (
                     <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50 animate-pulse"></div>
                   )}
                 </button>
               ))}
             </div>
          </div>

          {/* Streaming toggle */}
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-[#0f172a]/50 rounded-[1.75rem] border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="font-black text-sm tracking-tight">Real-time Computation</p>
                <p className="text-xs text-muted font-bold opacity-60 italic">Token stream optimization</p>
              </div>
            </div>
            <button 
              onClick={() => setStreaming(!streaming)}
              className={`w-14 h-8 rounded-full transition-all relative ${streaming ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${streaming ? 'left-8' : 'left-1.5'}`}></div>
            </button>
          </div>
        </div>

        <div className="p-8 bg-slate-50/80 dark:bg-[#0f172a]/80 text-center border-t border-slate-100 dark:border-slate-800">
            <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl uppercase tracking-widest text-xs">
              Commit Changes
            </button>
        </div>
      </div>
    </div>
  );
}
