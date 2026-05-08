import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  performanceMode: boolean;
  togglePerformanceMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      performanceMode: false,
      togglePerformanceMode: () => set((state) => ({ performanceMode: !state.performanceMode })),
    }),
    {
      name: 'unstress-settings',
    }
  )
);
