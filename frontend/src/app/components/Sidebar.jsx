/**
 * SIDEBAR.JSX - Direct Store Access Version
 * ---------------------------------------
 * Humne yahan se Props hatakar directly Store use kiya hai.
 */

import React, { useState } from 'react';
import { Plus, Edit2, LogOut, Pin, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chat-store'; // <-- Store import kiya
import { useAuthStore } from '../store/auth-store'; // <-- Store import kiya

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  // Directly store se data lena (No Prop Drilling)
  const chat = useChatStore();
  const auth = useAuthStore();
  const profile = useAuthStore(state => state.profile);

  return (
    <>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />
      )}

      <div className={`fixed md:relative z-50 h-full bg-[#f9f9f9] dark:bg-[#171717] border-r border-slate-200 dark:border-white/5 transition-all duration-300 ${
          sidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:w-0'
        } overflow-hidden`}>
        
        <div className="p-3 flex flex-col h-full">
          
          {/* New Chat Button */}
          <button 
            onClick={() => chat.clearMessages()} 
            className="flex items-center gap-3 w-full p-3 mb-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#212121] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">New chat</span>
          </button>

          {/* History List */}
          <div className="flex-1 overflow-y-auto mt-4">
            <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase">Recents</p>
            {chat.history.map((chatItem) => (
              <SingleChatItem 
                key={chatItem._id} 
                chat={chatItem}
                setSidebarOpen={setSidebarOpen}
              />
            ))}
          </div>

          {/* User profile */}
          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3 p-3">
               <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                 {(profile?.name || auth.user?.name || auth.user?.email || 'G')?.[0].toUpperCase()}
               </div>
               <span className="text-sm truncate">{profile?.name || auth.user?.name || auth.user?.email}</span>
            </div>
            <button onClick={() => auth.signOut()} className="flex items-center gap-3 w-full p-3 text-slate-500">
               <LogOut className="w-4 h-4" />
               <span className="text-sm">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Chhota component bhi store use kar sakta hai
function SingleChatItem({ chat: item, setSidebarOpen }) {
  const chatStore = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);

  return (
    <div 
      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer ${chatStore.currentChatId === item._id ? 'bg-slate-200 dark:bg-[#212121]' : 'hover:bg-slate-100 dark:hover:bg-[#212121]'}`}
      onClick={() => {
        if (!isEditing) {
          chatStore.loadChat(item._id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }
      }}
    >
      {isEditing ? (
        <input 
          autoFocus value={title} 
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { chatStore.renameChat(item._id, title); setIsEditing(false); }}
          className="bg-transparent text-sm w-full outline-none"
        />
      ) : (
        <span className="flex-1 truncate text-sm">{item.title}</span>
      )}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}><Edit2 className="w-3.5 h-3.5"/></button>
        <button onClick={(e) => { e.stopPropagation(); chatStore.deleteChat(item._id); }}><Trash2 className="w-3.5 h-3.5"/></button>
      </div>
    </div>
  );
}

export default Sidebar;
