// ---------------------------------------------------------
// APP.JSX - Refactored Layout (No Prop Drilling)
// ---------------------------------------------------------

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from './store/auth-store';
import { useChatStore } from './store/chat-store';
import { useSettingsStore } from './store/settings-store';

import AuthPage from './components/AuthPage';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';

import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';

function App() {
  // ✅ Use stable selectors — avoids infinite re-render loops
  const authLoading  = useAuthStore(state => state.loading);
  const user         = useAuthStore(state => state.user);
  const initialize   = useAuthStore(state => state.initialize);

  const fetchHistory   = useChatStore(state => state.fetchHistory);
  const loadChat       = useChatStore(state => state.loadChat);
  const currentChatId  = useChatStore(state => state.currentChatId);
  const messagesLength = useChatStore(state => state.messages.length);

  const theme = useSettingsStore(state => state.theme);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const typeBox = useRef(null);
  const chatWindow = useRef(null);

  // Apply dark/light class to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  /**
   * SECTION: INITIALIZATION & SESSION RESTORATION
   */

  useEffect(() => {
    initialize();
  }, []); // ✅ Run once on mount

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]); // ✅ Only re-runs when user actually changes

  useEffect(() => {
    // Restore last chat on refresh
    if (user && currentChatId && messagesLength === 0) {
      loadChat(currentChatId);
    }
  }, [user, currentChatId, messagesLength]); // ✅ All stable primitives

  /**
   * SECTION: RENDER
   */

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="animate-pulse font-bold">Waking up Synapse...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-[#09090b] text-slate-900 dark:text-white overflow-hidden">
      
      {/* Modals */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}

      {/* Sidebar - No more prop drilling for Chat/Auth data! */}
      <Sidebar 
        sidebarOpen={isSidebarOpen} 
        setSidebarOpen={setIsSidebarOpen} 
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <ChatHeader 
          sidebarOpen={isSidebarOpen} 
          setSidebarOpen={setIsSidebarOpen}
          onSettingsOpen={() => setIsSettingsOpen(true)}
          onProfileOpen={() => setIsProfileOpen(true)}
        />

        {/* Message View Area */}
        <div ref={chatWindow} className="flex-1 overflow-y-auto">
          <MessageList />
        </div>

        {/* Input Console */}
        <ChatInput typeBoxRef={typeBox} />

      </div>
    </div>
  );
}

export default App;
