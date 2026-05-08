import { create } from 'zustand';
import { Result } from '../../core/results';
import { listen } from '@tauri-apps/api/event';

export type GoalTier = 'Yearly' | 'Monthly' | 'Weekly';

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: 'cents' | 'tasks' | 'percentage';
  goal_type: 'finance' | 'task' | 'manual';
  tier: GoalTier;
  is_focus: boolean;
  linked_id?: string;
}

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<Result<Goal[], string>>;
  createGoal: (goal: Omit<Goal, 'id' | 'current' | 'is_focus'>) => Promise<Result<Goal, string>>;
  setFocus: (goalId: string) => Promise<Result<Goal, string>>;
  adjustProgress: (goalId: string, current: number) => Promise<Result<Goal, string>>;
  setupListeners: () => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/goals/`);
      const result: Result<Goal[], string> = await response.json();
      if (result.success && result.data) {
        set({ goals: result.data, isLoading: false });
        return result;
      }
      set({ error: result.error || 'Failed', isLoading: false });
      return result;
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  createGoal: async (data) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/goals/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        get().fetchGoals();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to create' };
    }
  },

  setFocus: async (goalId) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/goals/${goalId}/focus`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        // Update locally
        const goals = get().goals.map(g => ({
          ...g,
          is_focus: g.id === goalId
        }));
        set({ goals });
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to set focus' };
    }
  },

  adjustProgress: async (goalId, current) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/goals/${goalId}/adjust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current }),
      });
      const result = await response.json();
      if (result.success) {
        // Update locally immediately
        const goals = get().goals.map(g => g.id === goalId ? { ...g, current } : g);
        set({ goals });
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to adjust' };
    }
  },

  setupListeners: async () => {
    // Listen for background updates from the backend
    await listen('GOAL_UPDATE', (event: any) => {
      // In a real implementation with Tauri events, we'd handle this.
      // For now, we rely on the ActionDispatcher refreshes or manual adjustments.
      get().fetchGoals();
    });
  }
}));
