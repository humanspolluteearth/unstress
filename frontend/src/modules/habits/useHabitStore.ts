import { create } from 'zustand';
import { Result } from '../../core/results';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

export interface HabitLog {
  timestamp: string;
  value: number;
}

export interface Habit {
  id: string;
  name: string;
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
  weeklyInsight: string;
  isLoading: boolean;
  error: string | null;
  fetchHabits: () => Promise<Result<Habit[], string>>;
  createHabit: (habit: Omit<Habit, 'id' | 'logs'>) => Promise<Result<Habit, string>>;
  logHabit: (habitId: string, value: number) => Promise<Result<any, string>>;
  updateHabitLog: (habitId: string, value: number) => Promise<Result<any, string>>;
  deleteHabit: (habitId: string) => Promise<Result<any, string>>;
  updateHabit: (habitId: string, data: Partial<Habit>) => Promise<Result<any, string>>;
  setWeeklyInsight: (insight: string) => void;
  calculateStreak: (habit: Habit) => number;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  weeklyInsight: "Steady progress. Focus on hitting 'Normal' thresholds more consistently.",
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.HABITS}`);
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.HABITS}`, {
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.HABITS}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, value }),
      });
      const result = await response.json();
      if (result.success) {
        await get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to log' };
    }
  },

  updateHabitLog: async (habitId, value) => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.HABITS}/log`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, value }),
      });
      const result = await response.json();
      if (result.success) {
        await get().fetchHabits();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to update log' };
    }
  },

  deleteHabit: async (habitId) => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.HABITS}/${habitId}`, {
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.HABITS}/${habitId}`, {
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

  setWeeklyInsight: (insight: string) => set({ weeklyInsight: insight }),

  calculateStreak: (habit: Habit) => {
    if (habit.logs.length === 0) return 0;
    const logDates = new Set(habit.logs.map(l => l.timestamp.split('T')[0]));
    const sortedDates = Array.from(logDates).sort((a, b) => b.localeCompare(a));
    
    let streak = 0;
    const today = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA');

    let currentDateStr = sortedDates[0];
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
