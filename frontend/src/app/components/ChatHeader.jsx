/**
 * CHATHEADER.JSX - Full Featured Version
 * Model selector + Settings + Profile + Theme toggle
 */

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, Settings, ChevronDown, User, Check } from 'lucide-react';
import { useChatStore } from '../store/chat-store';
import { useAuthStore } from '../store/auth-store';
import { useSettingsStore } from '../store/settings-store';

export default function ChatHeader({ sidebarOpen, setSidebarOpen, onSettingsOpen, onProfileOpen }) {
  const models        = useChatStore(state => state.models);
  const selectedModels = useChatStore(state => state.selectedModels);
  const toggleModel   = useChatStore(state => state.toggleModel);
  const user          = useAuthStore(state => state.user);
  const profile       = useAuthStore(state => state.profile);
  const settings      = useSettingsStore();

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build label for the trigger button
  const selectedNames = models
    .filter(m => selectedModels.includes(m.id))
    .map(m => m.name.split(' ')[0]); // first word only, e.g. "Gemini", "Groq"

  return (
    <div className="h-14 flex items-center px-4 justify-between bg-[var(--background)]/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/50 dark:border-white/5">
      
      {/* LEFT — Sidebar toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* CENTER — Model Selector Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowModelDropdown(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10"
        >
          <span className="text-xs">
            {selectedNames.join(' + ')}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown panel */}
        {showModelDropdown && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-2">
              Select Models (max 2)
            </p>
            {models.map((model) => {
              const isSelected = selectedModels.includes(model.id);
              return (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-white/10'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: model.color + '22', color: model.color }}
                  >
                    {model.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{model.name}</p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — Theme / Settings / Profile */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Toggle theme"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onSettingsOpen?.()}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile / Avatar Button */}
        <button
          onClick={() => onProfileOpen?.()}
          className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity overflow-hidden flex-shrink-0 ml-1"
          title="Profile"
        >
          {profile?.profilePic ? (
            <img src={profile.profilePic} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            user?.email?.[0]?.toUpperCase() || <User className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
