/**
 * CHATHEADER.JSX - Simplified Store Version
 */

import React from 'react';
import { Menu, ChevronDown, Sun, Moon } from 'lucide-react';
import { useChatStore } from '../store/chat-store';
import { useAuthStore } from '../store/auth-store';
import { useSettingsStore } from '../store/settings-store';

export default function ChatHeader({ sidebarOpen, setSidebarOpen }) {
  // Direct Store Access
  const chat = useChatStore();
  const auth = useAuthStore();
  const settings = useSettingsStore();

  return (
    <div className="h-14 flex items-center px-4 justify-between bg-[var(--background)]/70 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-400">
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="px-2 py-1.5 text-slate-700 dark:text-slate-300 font-semibold">
           Synapse AI
        </div>
      </div>
      
      <div className="flex items-center gap-3">
         <button 
           onClick={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
           className="p-2 text-slate-400"
         >
           {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
         </button>
      </div>
    </div>
  );
}
