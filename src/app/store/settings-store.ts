import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'dark' | 'light';
  defaultModel: string;
  streaming: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setDefaultModel: (model: string) => void;
  setStreaming: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
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
