import { create } from 'zustand';
import { Result } from '../../core/results';
import { listen } from '@tauri-apps/api/event';
import { ActionService, GoalCreate } from '../../core/ActionService';

export type GoalTier = 'weekly' | 'monthly' | 'yearly';

export interface Goal {
  id: string;
  name: string;
  type: GoalTier;
  description: string;
  is_current_focus: boolean;
  progress: number;
  parent_id?: string;
  priority?: 'low' | 'med' | 'high';
  category?: string;
  deadline?: string;
}

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<Result<Goal[], string>>;
  createGoal: (goal: GoalCreate) => Promise<Result<Goal, string>>;
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
      const result = await ActionService.fetchGoals();
      if (result.success && result.data) {
        // Map backend Goal to frontend Goal
        const mappedGoals: Goal[] = result.data.map((g: any) => ({
          id: g.id,
          name: g.title,
          type: g.time_frame,
          description: g.description,
          is_current_focus: g.is_current_focus,
          progress: g.progress || 0,
          priority: g.priority,
          category: g.category,
          deadline: g.deadline
        }));
        set({ goals: mappedGoals, isLoading: false });
        return { success: true, data: mappedGoals };
      }
      set({ error: result.error || 'Failed', isLoading: false });
      return { success: false, error: result.error || 'Failed' };
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  createGoal: async (data) => {
    try {
      const result = await ActionService.createGoal(data);
      if (result.success) {
        await get().fetchGoals();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to create' };
    }
  },

  setFocus: async (goalId) => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/api/goals/${goalId}/focus`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        // Update locally
        const goals = get().goals.map(g => ({
          ...g,
          is_current_focus: g.id === goalId
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
