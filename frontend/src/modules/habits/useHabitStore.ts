import { create } from 'zustand';
import { Result } from '../../core/results';

export interface HabitLog {
  timestamp: string;
  value: number;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  unit: 'rep' | 'min';
  two_min_threshold: number;
  normal_threshold: number;
  hard_threshold: number;
  impossible_threshold: number;
  logs: HabitLog[];
}

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  fetchHabits: () => Promise<Result<Habit[], string>>;
  createHabit: (habit: Omit<Habit, 'id' | 'logs'>) => Promise<Result<Habit, string>>;
  logHabit: (habitId: string, value: number) => Promise<Result<any, string>>;
  updateHabitLog: (habitId: string, value: number) => Promise<Result<any, string>>;
  deleteHabit: (habitId: string) => Promise<Result<any, string>>;
  updateHabit: (habitId: string, data: Partial<Habit>) => Promise<Result<any, string>>;
  calculateStreak: (habit: Habit) => number;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/habits/`);
      const result: Result<Habit[], string> = await response.json();
      if (result.success && result.data) {
        set({ habits: result.data, isLoading: false });
        return result;
      }
      set({ error: result.error || 'Failed', isLoading: false });
      return result;
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  createHabit: async (data) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/habits/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: Result<Habit, string> = await response.json();
      if (result.success) {
        await get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to create' };
    }
  },

  logHabit: async (habitId, value) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/habits/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, value }),
      });
      const result = await response.json();
      if (result.success) {
        // Optimistic local update
        const currentHabits = get().habits;
        const updatedHabits = currentHabits.map(h => {
          if (h.id === habitId) {
            return {
              ...h,
              logs: [...h.logs, { timestamp: new Date().toISOString(), value }]
            };
          }
          return h;
        });
        set({ habits: updatedHabits });

        await get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to log' };
    }
  },

  updateHabitLog: async (habitId, value) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/habits/log`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, value }),
      });
      const result = await response.json();
      if (result.success) {
        // Optimistic local update to ensure immediate UI sync
        const today = new Date().toLocaleDateString('en-CA');
        const currentHabits = get().habits;
        const updatedHabits = currentHabits.map(h => {
          if (h.id === habitId) {
            // Replace today's logs
            const filteredLogs = h.logs.filter(l => !l.timestamp.startsWith(today));
            return {
              ...h,
              logs: [...filteredLogs, { timestamp: new Date().toISOString(), value }]
            };
          }
          return h;
        });
        set({ habits: updatedHabits });
        
        await get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to update log' };
    }
  },

  deleteHabit: async (habitId) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/habits/${habitId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to delete' };
    }
  },

  updateHabit: async (habitId, data) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        await get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to update' };
    }
  },

  calculateStreak: (habit: Habit) => {
    if (habit.logs.length === 0) return 0;
    
    // Group logs by date
    const logDates = new Set(habit.logs.map(l => l.timestamp.split('T')[0]));
    const sortedDates = Array.from(logDates).sort((a, b) => b.localeCompare(a));
    
    let streak = 0;
    const today = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA');

    let currentDateStr = sortedDates[0];

    // If last log is not today or yesterday, streak is broken
    if (currentDateStr !== today && currentDateStr !== yesterday) return 0;

    streak = 1;
    let curr = new Date(currentDateStr);

    while (true) {
      curr.setDate(curr.getDate() - 1);
      const d = curr.toLocaleDateString('en-CA');
      if (logDates.has(d)) {
        streak++;
      } else {
        break;
      }
    }

    
    return streak;
  }
}));
