import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from './store/auth-store';
import { useChatStore } from './store/chat-store';
import { useSettingsStore } from './store/settings-store';
import AuthPage from './components/AuthPage';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';
import FileUpload from './components/FileUpload';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE } from './config';
import { 
  Plus, 
  Mic, 
  Volume2, 
  Copy, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown,
  Menu,
  Sun,
  Moon,
  Trash2,
  Edit2,
  ChevronDown,
  ArrowUp,
  LogOut,
  Pin,
  MoreHorizontal
} from 'lucide-react';

export default function App() {
  const { loading, initialize, signOut, user, profile } = useAuthStore();
  const { 
    selectedModels, 
    models, 
    messages, 
    isGenerating, 
    history, 
    fetchHistory,
    currentChatId,
    loadChat,
    isLoadingChat,
    clearMessages,
    deleteChat,
    pinChat,
    renameChat,
    copyMessage
  } = useChatStore((state) => state);
  const { theme, setTheme } = useSettingsStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeFileUrl, setActiveFileUrl] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('image');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSendMessage = () => {
    const val = textareaRef.current?.value || '';
    if (!val.trim() && !activeFileUrl) return;
    
    useChatStore.getState().sendMessage(val, activeFileUrl || undefined, extractedText || undefined);
    
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
    setActiveFileUrl(null);
    setPreviewUrl(null);
    setExtractedText(null);
  };

  // Sync theme with HTML class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isGenerating]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  const speak = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (textareaRef.current) {
        const currentValue = textareaRef.current.value;
        textareaRef.current.value += currentValue ? ` ${transcript}` : transcript;
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted text-sm font-black animate-pulse uppercase tracking-widest">Initializing Core...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-heading">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in transition-all"
        />
      )}

      {/* Sidebar - ChatGPT Style */}
      <div 
        className={`fixed md:relative z-50 h-full bg-[#f9f9f9] dark:bg-[#171717] border-r border-slate-200 dark:border-white/5 text-slate-900 dark:text-white transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:w-0'
        } overflow-hidden`}
      >
        <div className="p-3 flex flex-col h-full">
          <button 
            onClick={() => clearMessages()}
            className="flex items-center justify-between w-full p-3 mb-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#212121] transition-all group"
          >
            <div className="flex items-center gap-3">
               <div className="w-7 h-7 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-slate-600 dark:text-white" />
               </div>
               <span className="text-[14px] font-medium text-slate-700 dark:text-white">New chat</span>
            </div>
            <Edit2 className="w-4 h-4 text-slate-400 dark:text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="flex-1 overflow-y-auto mt-4 space-y-1 custom-scrollbar scrollbar-none">
            <div className="px-2 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Recents</div>
            {history.map((chat) => (
              <ChatSidebarItem 
                key={chat._id} 
                chat={chat} 
                currentChatId={currentChatId} 
                loadChat={loadChat}
                deleteChat={deleteChat}
                pinChat={pinChat}
                renameChat={renameChat}
                setSidebarOpen={setSidebarOpen}
              />
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 space-y-1">
            <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-[#212121] transition-all">
               <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden">
                 {profile?.profilePic ? (
                    <img src={profile.profilePic.startsWith('http') ? profile.profilePic : `${API_BASE}${profile.profilePic}`} alt="" className="w-full h-full object-cover" />
                 ) : (
                    user?.sandbox ? 'G' : (profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase())
                 )}
               </div>
               <div className="flex-1 text-left overflow-hidden">
                  <div className="text-[14px] font-medium leading-none text-slate-700 dark:text-white truncate">
                    {user?.sandbox ? 'Guest User' : (profile?.name || user?.email?.split('@')[0])}
                  </div>
               </div>
            </button>
            <button onClick={signOut} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-[#212121] transition-all text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white">
               <LogOut className="w-4 h-4" />
               <span className="text-[14px]">Log out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[var(--background)] animate-in fade-in duration-1000 overflow-hidden relative">
         {/* Ultraminimalist Header */}
         <div className="h-14 flex items-center px-4 justify-between bg-[var(--background)]/70 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-500/5 rounded-xl transition-all text-slate-400"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Contextual Model Selector */}
              <div className="relative">
                <button 
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-500/5 rounded-lg transition-all text-slate-700 dark:text-slate-300"
                >
                  <span className="text-[16px] font-semibold">Synapse AI</span>
                  <ChevronDown className="w-4 h-4 opacity-40 ml-0.5" />
                </button>
                
                {modelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setModelDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#2f2f2f] border border-slate-200 dark:border-white/5 rounded-xl shadow-2xl p-2 transition-all animate-in fade-in zoom-in-95 duration-200 z-50">
                   {models.map((m) => (
                      <div key={m.id} onClick={() => useChatStore.getState().toggleModel(m.id)} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 ${selectedModels.includes(m.id) ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                           <span className="text-base">{m.icon}</span>
                           <span className="text-[13px] font-medium">{m.name}</span>
                        </div>
                      </div>
                   ))}
                </div>
                </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
               {user?.sandbox && (
                 <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mr-2 shadow-sm">
                   <span>Sandbox Mode</span>
                   <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                 </div>
               )}
               <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 text-emerald-600 rounded-full text-[11px] font-bold hover:bg-emerald-600/20 transition-all mr-1">
                  ✨ Get Plus
               </button>
               <button 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="p-2 hover:bg-slate-500/5 rounded-xl transition-all text-slate-400"
               >
                 {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </button>
               <button className="p-2 hover:bg-slate-500/5 rounded-xl transition-all text-slate-400">
                  <MoreHorizontal className="w-4 h-4" />
               </button>
            </div>
         </div>

         {/* Chat Context */}
         <div ref={chatContainerRef} className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative overflow-x-hidden">
            <div className="max-w-[768px] mx-auto w-full flex flex-col min-h-full">
              {isLoadingChat ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 animate-pulse">
                  <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 text-sm font-medium">Recalling conversation...</p>
                </div>
              ) : messages.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-6 pb-24 fade-in">
                <div className="w-16 h-16 bg-gradient-to-tr from-[#4F8CFF] to-[#8A5CFF] rounded-[24px] mb-10 flex items-center justify-center text-white text-2xl shadow-[0_0_40px_rgba(79,140,255,0.3)] animate-pulse transition-all">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                       <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                    </div>
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-white/20 rounded-full blur-[1px]"></div>
                  </div>
                </div>
                <h1 className="text-[28px] sm:text-[32px] font-bold mb-10 text-slate-800 dark:text-slate-100 tracking-[-0.02em] px-4">
                  How can I help you today?
                </h1>
                   <div className="flex flex-wrap justify-center gap-2.5 w-full max-w-xl px-4">
                       {[
                         { t: 'Draft a contract', i: '⚖️' },
                         { t: 'Explain React', i: '⚛️' },
                         { t: 'Summarize text', i: '📄' },
                         { t: 'Write a query', i: '📈' }
                       ].map(item => (
                          <button 
                            key={item.t} 
                            onClick={() => useChatStore.getState().sendMessage(item.t)} 
                            className="flex items-center gap-3 px-5 py-4 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all text-[13px] font-medium text-slate-600 dark:text-slate-400 shadow-sm"
                          >
                            <span className="opacity-70">{item.i}</span>
                            <span>{item.t}</span>
                          </button>
                       ))}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-16 py-12 px-4 w-full">
                   {messages.reduce((acc, msg) => {
                     if (msg.role === 'user') {
                       acc.push({ userMsg: msg, replies: [] });
                     } else if (msg.role === 'assistant') {
                       if (acc.length > 0) acc[acc.length - 1].replies.push(msg);
                       else acc.push({ userMsg: null, replies: [msg] });
                     }
                     return acc;
                   }, []).map((turn, i) => (
                     <div key={i} className="flex flex-col gap-10 w-full animate-message">
                       {turn.userMsg && (
                         <div className="flex justify-end">
                           <div className="bg-slate-100 dark:bg-white/[0.05] text-[var(--foreground)] px-6 py-4 rounded-xl max-w-[80%] text-[15px] leading-relaxed shadow-sm relative group/user">
                              {turn.userMsg.content}
                              <button 
                                onClick={() => copyMessage(turn.userMsg.content)}
                                className="absolute -right-10 top-2 p-2 opacity-0 group-hover/user:opacity-100 hover:bg-slate-500/10 rounded-lg text-slate-400 transition-all focus:opacity-100"
                                title="Copy message"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                           </div>
                         </div>
                       )}
   
                       {turn.replies.length > 0 && (
                         <div className={`grid grid-cols-1 ${selectedModels.length > 1 ? 'md:grid-cols-2' : ''} gap-6 w-full`}>
                           {selectedModels.map((modelId) => {
                              const aiMsg = turn.replies.find((m) => m.model === modelId);
                              if (!aiMsg && !isGenerating) return null;
                              const msgToRender = aiMsg || { content: '', id: `loading-${modelId}` };
                              const modelDef = models.find((m) => m.id === modelId);
                              
                              return (
                                 <div key={modelId} className="ai-card w-full flex flex-col p-7 group/msg">
                                   <div className="flex items-center gap-3 mb-6">
                                     <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold shadow-md">
                                        {modelDef?.icon}
                                     </div>
                                     <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.25em]">{modelDef?.name}</span>
                                   </div>
                                   
                                   <div className="chat-markdown prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                                     {msgToRender.content ? (
                                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                         {msgToRender.content}
                                       </ReactMarkdown>
                                     ) : (
                                       isGenerating ? (
                                           <div className="flex gap-2 py-5">
                                              <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                              <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                              <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                           </div>
                                       ) : (
                                         <div className="text-xs opacity-20 font-black uppercase tracking-widest py-3">Terminated</div>
                                       )
                                     )}
                                   </div>
                                   
                                   <div className="flex items-center gap-1 mt-8 pt-6 border-t border-slate-50 dark:border-white/[0.02] opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                     <button 
                                       onClick={() => speak(msgToRender.content)} 
                                       className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-300 transition-all"
                                     >
                                       <Volume2 className="w-3.5 h-3.5" />
                                     </button>
                                     <button 
                                       onClick={() => copyMessage(msgToRender.content)} 
                                       className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-300 transition-all"
                                       title="Copy response"
                                     >
                                       <Copy className="w-3.5 h-3.5" />
                                     </button>
                                     <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-300 transition-all">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                     </button>
                                     <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-300 transition-all">
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                     </button>
                                     <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-300 transition-all">
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                     </button>
                                   </div>
                                 </div>
                              );
                           })}
                         </div>
                       )}
                     </div>
                   ))}
                </div>
              )}
            </div>
         </div>

         {/* ChatGPT Signature Input Console */}
         <div className="bg-[var(--background)] pb-4 pt-2 px-4 md:px-6 sticky bottom-0 z-40">
            <div className="max-w-[768px] mx-auto w-full relative">
              {previewUrl && (
                <div className="absolute bottom-full left-0 mb-4 p-3 bg-white dark:bg-[#18181b] border border-slate-100 dark:border-white/[0.05] rounded-xl flex items-center gap-4 animate-in slide-in-from-bottom-2 shadow-2xl">
                  <div className="relative">
                    {previewType === 'image' ? (
                      <img src={previewUrl} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="Preview" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-xl shadow-inner">📄</div>
                    )}
                    <button onClick={() => { setPreviewUrl(null); setActiveFileUrl(null); setExtractedText(null); }} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full p-1 shadow-xl hover:rotate-90 transition-all">
                      <Plus className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                  <div className="flex-1 pr-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Context Loaded</div>
                  </div>
                </div>
              )}

              <div className="relative flex items-center w-full bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[32px] px-2 py-1.5 transition-all group focus-within:shadow-md">
                <div className="flex items-center">
                   <FileUpload onPreview={(url, type) => { setPreviewUrl(url); if (type) setPreviewType(type); }} onUploadComplete={(url, result) => { setActiveFileUrl(url); if (result?.extractedText) setExtractedText(result.extractedText); }} />
                </div>

                <div className="flex-1 flex flex-col">
                  <textarea 
                    ref={textareaRef}
                    placeholder="Ask anything"
                    className="w-full bg-transparent border-none text-[15px] font-medium placeholder-slate-500 dark:placeholder-slate-400 resize-none px-2 pt-2.5 pb-2.5 focus:ring-0 outline-none max-h-52 leading-tight"
                    rows={1}
                    disabled={isGenerating}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onChange={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5 pr-1.5">
                  <button onClick={startListening} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                    <Mic className="w-5 h-5" />
                  </button>
                  <button 
                    disabled={isGenerating}
                    onClick={handleSendMessage}
                    className={`p-1.5 rounded-full transition-all ${isGenerating ? 'opacity-20' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80 active:scale-90 shadow-lg'}`}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center mt-3">
                 <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 opacity-60 flex items-center gap-1.5 tracking-tight">
                    ChatGPT can make mistakes. Check important info. • <span className="cursor-pointer hover:underline">Privacy Policy</span>
                 </p>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function ChatSidebarItem({ 
  chat, 
  currentChatId, 
  loadChat, 
  deleteChat, 
  pinChat, 
  renameChat,
  setSidebarOpen 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(chat.title);
  
  const handleRename = (e) => {
    e.stopPropagation();
    if (tempTitle.trim() && tempTitle !== chat.title) {
       renameChat(chat._id, tempTitle);
    }
    setIsEditing(false);
  };

  return (
    <div 
      className={`group relative flex items-center gap-2 px-3 py-3 rounded-lg cursor-pointer transition-all mb-0.5 ${currentChatId === chat._id ? 'bg-slate-200 dark:bg-[#212121]' : 'hover:bg-slate-100 dark:hover:bg-[#212121]'}`}
      onClick={() => {
        if (!isEditing) {
          loadChat(chat._id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }
      }}
    >
      {isEditing ? (
        <input 
          autoFocus
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => { if(e.key === 'Enter') handleRename(e); if(e.key === 'Escape') setIsEditing(false); }}
          className="bg-transparent text-[14px] font-medium border-none outline-none w-full text-slate-900 dark:text-white"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex-1 truncate text-[14px] font-medium text-slate-600 dark:text-white/80">
          {chat.title}
        </div>
      )}
      
      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isEditing ? 'hidden' : ''}`}>
         <button onClick={(e) => { e.stopPropagation(); pinChat(chat._id); }} className={`p-1 transition-colors ${chat.isPinned ? 'text-emerald-500' : 'text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'}`}>
           <Pin className="w-3.5 h-3.5 transition-transform hover:scale-110" />
         </button>
         <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors">
           <Edit2 className="w-3.5 h-3.5" />
         </button>
         <button onClick={(e) => { e.stopPropagation(); deleteChat(chat._id); }} className="p-1 text-slate-400 dark:text-white/40 hover:text-red-400 transition-colors">
           <Trash2 className="w-3.5 h-3.5" />
         </button>
      </div>
    </div>
  );
}
