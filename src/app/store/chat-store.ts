import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './auth-store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  error?: boolean;
}

interface ModelDef {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ChatInstance {
  _id: string;
  title: string;
  isPinned?: boolean;
  updatedAt: string;
}

interface ChatStore {
  models: ModelDef[];
  selectedModels: string[];
  history: ChatInstance[];
  currentChatId: string | null;
  messages: Message[];
  cachedChats: Record<string, Message[]>; // Optimization: Instant switching
  isGenerating: boolean;
  isLoadingChat: boolean;
  toggleModel: (modelId: string) => void;
  sendMessage: (prompt: string, image?: string | null, pdfText?: string | null) => Promise<void>;
  clearMessages: () => void;
  fetchHistory: () => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pinChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  copyFullChat: () => void;
  copyMessage: (content: string) => void;
  loadChat: (chatId: string) => Promise<void>;
  pagination?: any;
}

/* ─── Build full conversation history for multi-turn context ────────────── */
const buildHistory = (messages: Message[]): { role: string; content: string }[] => {
  return messages
    .filter(m => m.content.trim().length > 0 && !m.error)
    .map(m => ({
      role: m.role,
      content: m.content,
    }));
};

/* ─── Parse SSE stream robustly ─────────────────────────────────────────── */
const parseSSE = async (
  resp: Response,
  onToken: (text: string) => void,
  onError: (msg: string) => void,
  onChatId?: (id: string) => void
) => {
  if (!resp.body) { onError('No response body'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;

      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') return;

      try {
        const data = JSON.parse(dataStr);
        if (data.chatId && onChatId) onChatId(data.chatId);
        if (data.text) onToken(data.text);
        if (data.error) onError(data.error);
      } catch {
        // Malformed chunk — skip
      }
    }
  }
};

/* ─── Store ─────────────────────────────────────────────────────────────── */
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      models: [
        { id: 'gemini',   name: 'Gemini 2.5 Flash', color: '#4285f4', icon: '✨' },
        { id: 'groq',     name: 'Groq (Llama 3.3)',  color: '#8b5cf6', icon: '🔥' },
        { id: 'openai',   name: 'OpenAI (GPT-4o)',   color: '#10a37f', icon: '🤖' },
        { id: 'deepseek', name: 'DeepSeek-V3',      color: '#0000ff', icon: '🧠' },
      ],
      selectedModels: ['gemini', 'groq'],
      history: [],
      currentChatId: null,
      messages: [],
      cachedChats: {},
      isGenerating: false,
      isLoadingChat: false,
      searchTerm: '',

      setSearchTerm: (term) => {
        set({ searchTerm: term });
        get().fetchHistory();
      },

      pinChat: async (chatId) => {
        try {
          const authState = (await import('./auth-store')).useAuthStore.getState();
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
          const token = supabaseSession?.access_token || authState.manualSession?.access_token;
          
          await fetch(`${API_BASE}/chat/pin`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ chatId }),
          });
          get().fetchHistory();
        } catch (err) { console.error('Pin failed', err); }
      },

      toggleModel: (modelId) =>
        set((state) => {
          const cur = state.selectedModels;
          if (cur.includes(modelId)) {
            if (cur.length === 1) return state; // keep at least one
            return { selectedModels: cur.filter(id => id !== modelId) };
          }
          if (cur.length >= 2) return state; // max 2 for split-screen
          return { selectedModels: [...cur, modelId] };
        }),

      copyFullChat: () => {
        const { messages } = get();
        if (messages.length === 0) return;
        
        const markdown = messages.map(m => {
          const role = m.role === 'user' ? '**You**' : `**Synapse AI (${m.model || 'Assistant'})**`;
          return `${role}:\n${m.content}\n\n---`;
        }).join('\n\n');
        
        navigator.clipboard.writeText(markdown);
      },

      copyMessage: (content: string) => {
        navigator.clipboard.writeText(content);
      },

      clearMessages: () => set({ messages: [], currentChatId: null }),

      fetchHistory: async () => {
        try {
          const authState = (await import('./auth-store')).useAuthStore.getState();
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
          const token = supabaseSession?.access_token || authState.manualSession?.access_token;
          if (!token) return;

          const { searchTerm } = get();
          const url = `${API_BASE}/chat/history${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
          const resp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (resp.ok) {
            const result = await resp.json();
            // Handle the new production-ready wrapper { success, data, pagination }
            const historyData = result.data || result; 
            set({ 
              history: Array.isArray(historyData) ? historyData : [],
              pagination: result.pagination || null
            });
          }
        } catch (err) { console.error('Fetch history failed', err); }
      },

      renameChat: async (chatId, title) => {
        try {
          const authState = (await import('./auth-store')).useAuthStore.getState();
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
          const token = supabaseSession?.access_token || authState.manualSession?.access_token;

          await fetch(`${API_BASE}/chat/rename`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ chatId, title }),
          });
          get().fetchHistory();
        } catch (err) { console.error('Rename failed', err); }
      },

      deleteChat: async (chatId) => {
        try {
          const authState = (await import('./auth-store')).useAuthStore.getState();
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
          const token = supabaseSession?.access_token || authState.manualSession?.access_token;

          await fetch(`${API_BASE}/chat/${chatId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (get().currentChatId === chatId) {
            get().clearMessages();
          }

          // Clean up cache
          const newCache = { ...get().cachedChats };
          delete newCache[chatId];
          set({ cachedChats: newCache });

          get().fetchHistory();
        } catch (err) { console.error('Delete failed', err); }
      },

      loadChat: async (chatId) => {
        const { cachedChats } = get();

        // Instant switch from cache
        if (cachedChats[chatId]) {
          set({ currentChatId: chatId, messages: cachedChats[chatId], isLoadingChat: false });
        } else {
          set({ currentChatId: chatId, messages: [], isLoadingChat: true });
        }
        
        try {
          const authState = (await import('./auth-store')).useAuthStore.getState();
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
          const token = supabaseSession?.access_token || authState.manualSession?.access_token;
          if (!token) return;

          const resp = await fetch(`${API_BASE}/chat/${chatId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (resp.ok) {
            const result = await resp.json();
            const fullChat = result.data || result;
            const columns = fullChat.columns || {};
            
            // Comprehensive Merge & Deduplicate
            const mergedMap = new Map<string, Message>();
            
            Object.entries(columns).forEach(([modelId, modelMessages]) => {
              (modelMessages as any[]).forEach((msg, index) => {
                const msgKey = msg.role === 'user' 
                  ? `user-${index}-${msg.content.substring(0, 50)}` 
                  : `${modelId}-${index}-${msg.id || Date.now()}`;

                if (!mergedMap.has(msgKey)) {
                  mergedMap.set(msgKey, {
                    ...msg,
                    id: msg.id || msgKey,
                    model: msg.role === 'assistant' ? modelId : undefined,
                  });
                }
              });
            });

            const finalMessages = Array.from(mergedMap.values());

            set((state) => ({
              messages: state.currentChatId === chatId ? finalMessages : state.messages,
              cachedChats: { ...state.cachedChats, [chatId]: finalMessages },
              isLoadingChat: false
            }));
          }
        } catch (err) {
          console.error('[loadChat] Error:', err);
          set({ isLoadingChat: false });
        }
      },

      sendMessage: async (prompt, image = null, pdfText = null) => {
        const { selectedModels, messages } = get();
        if (!prompt.trim() && !image) return;

        // 1. Prepare messages
        const userMsg: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: prompt.trim(),
        };
        
        const responseIds: Record<string, string> = {};
        selectedModels.forEach(mId => {
          responseIds[mId] = `${mId}-${Date.now()}`;
        });

        const placeholders: Message[] = selectedModels.map(mId => ({
          id: responseIds[mId],
          role: 'assistant',
          content: '',
          model: mId,
        }));
        
        const updatedMessages = [...messages, userMsg, ...placeholders];
        set({ messages: updatedMessages, isGenerating: true });

        // Build history for API
        const fullHistory = buildHistory([...messages, userMsg]);

        try {
          const authState = (await import('./auth-store')).useAuthStore.getState();
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
          const token = supabaseSession?.access_token || authState.manualSession?.access_token;

          await Promise.all(selectedModels.map(async (modelId) => {
            try {
              const resp = await fetch(`${API_BASE}/chat/stream`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                  model: modelId, 
                  messages: fullHistory,
                  chatId: get().currentChatId, // Use fresh ID from store
                  image: image,
                  file: image,
                  hasFile: !!image,
                  pdfText: pdfText
                }),
              });

              if (!resp.ok) {
                const errText = await resp.text().catch(() => resp.statusText);
                set(state => ({
                  messages: state.messages.map(m =>
                    m.id === responseIds[modelId]
                      ? { ...m, content: `❌ Server error: ${errText}`, error: true }
                      : m
                  ),
                }));
                return;
              }

              await parseSSE(
                resp,
                (text) => {
                  set((state) => ({
                    messages: state.messages.map(m =>
                      m.id === responseIds[modelId]
                        ? { ...m, content: m.content + text }
                        : m
                    ),
                  }));
                },
                (errMsg) => {
                  set((state) => ({
                    messages: state.messages.map(m =>
                      m.id === responseIds[modelId]
                        ? { ...m, content: `❌ ${errMsg}`, error: true }
                        : m
                    ),
                  }));
                },
                (chatId) => {
                  if (!get().currentChatId) {
                    set({ currentChatId: chatId });
                  }
                }
              );
            } catch (err: any) {
              console.error(`[${modelId}] fetch error:`, err);
            }
          }));

          // Final update cache
          const finalMessages = get().messages;
          const finalChatId = get().currentChatId;
          if (finalChatId) {
            set((state) => ({
              cachedChats: { ...state.cachedChats, [finalChatId]: finalMessages }
            }));
          }

          get().fetchHistory();
        } finally {
          set({ isGenerating: false });
        }
      },
    }),
    {
      name: 'synapse-ai-v3',
      partialize: (state) => ({
        selectedModels: state.selectedModels,
        cachedChats: state.cachedChats, // Persist cache for offline/reload support
      }),
    }
  )
);
