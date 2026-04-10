import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create()(
  persist(
    (set) => ({
      theme: 'dark',
      defaultModel: 'groq',
      streaming: true,
      setTheme: (theme) => set({ theme }),
      setDefaultModel: (defaultModel) => set({ defaultModel }),
      setStreaming: (streaming) => set({ streaming }),
    }),
    { name: 'hybrid-ai-settings' }
  )
);
