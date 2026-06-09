import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create()(
  persist(
    (set) => ({
      theme: 'dark',
      defaultModel: 'groq',
      streaming: true,
      setTheme: (theme) => {
        // Directly update DOM — no React/useEffect needed
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },
      setDefaultModel: (defaultModel) => set({ defaultModel }),
      setStreaming: (streaming) => set({ streaming }),
    }),
    { 
      name: 'hybrid-ai-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme class immediately when store loads from localStorage
        if (state) {
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    }
  )
);
