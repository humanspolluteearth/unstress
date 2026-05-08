import { create } from 'zustand';
import { Result } from '../../core/results';

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  habit_type: 'reps' | 'timed';
  duration_minutes?: number;
  logs: string[]; // ISO timestamps
}

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  fetchHabits: () => Promise<Result<Habit[], string>>;
  createHabit: (habit: Omit<Habit, 'id' | 'logs'>) => Promise<Result<Habit, string>>;
  logHabit: (habitId: string) => Promise<Result<any, string>>;
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
        get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to create' };
    }
  },

  logHabit: async (habitId) => {
    try {
      const { ActionDispatcher } = await import('../../core/ActionDispatcher');
      const result = await ActionDispatcher.createHabitLog({
        habit_id: habitId,
        status: 'completed'
      });
      if (result.success) {
        get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to log' };
    }
  },

  deleteHabit: async (habitId) => {
    try {
      const { ActionDispatcher } = await import('../../core/ActionDispatcher');
      const result = await ActionDispatcher.deleteHabit(habitId);
      if (result.success) {
        get().fetchHabits();
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
        get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to update' };
    }
  },

  calculateStreak: (habit: Habit) => {
    if (habit.logs.length === 0) return 0;
    
    // Sort logs descending
    const sortedLogs = [...habit.logs]
      .map(l => new Date(l))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(sortedLogs[0]);
    currentDate.setHours(0, 0, 0, 0);
    
    // If last log is not today or yesterday, streak is broken
    const diff = (now.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);
    if (diff > 1) return 0;
    
    streak = 1;
    for (let i = 1; i < sortedLogs.length; i++) {
      const prevDate = new Date(sortedLogs[i]);
      prevDate.setHours(0, 0, 0, 0);
      
      const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
      if (dayDiff === 1) {
        streak++;
        currentDate = prevDate;
      } else if (dayDiff > 1) {
        break;
      }
    }
    
    return streak;
  }
}));
