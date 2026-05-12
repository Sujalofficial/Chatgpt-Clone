// ---------------------------------------------------------
// APP.JSX - Refactored Layout (No Prop Drilling)
// ---------------------------------------------------------

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from './store/auth-store';
import { useChatStore } from './store/chat-store';

import AuthPage from './components/AuthPage';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';

import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';

function App() {
  const auth = useAuthStore();
  const chat = useChatStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const typeBox = useRef(null);
  const chatWindow = useRef(null);

  /**
   * SECTION: INITIALIZATION & SESSION RESTORATION
   */

  useEffect(() => {
    auth.initialize();
  }, [auth]);

  useEffect(() => {
    if (auth.user) {
      chat.fetchHistory();
    }
  }, [auth.user, chat]);

  useEffect(() => {
    // Restore last chat on refresh
    if (auth.user && chat.currentChatId && chat.messages.length === 0) {
      chat.loadChat(chat.currentChatId);
    }
  }, [auth.user, chat.currentChatId, chat.messages.length, chat]);

  /**
   * SECTION: RENDER
   */

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="animate-pulse font-bold">Waking up Synapse...</p>
      </div>
    );
  }

  if (!auth.user) {
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
