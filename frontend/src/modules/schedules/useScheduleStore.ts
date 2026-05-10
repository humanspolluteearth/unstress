import { create } from 'zustand';
import { Result } from '../../core/results';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

export interface TimeBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  item_type: 'event' | 'task' | 'habit' | 'time_block';
  is_conflict?: boolean;
  repeat_pattern?: 'Daily' | 'Weekly' | 'Monthly' | null;
}

interface ScheduleState {
  blocks: TimeBlock[];
  selectedBlockId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchBlocks: () => Promise<Result<TimeBlock[], string>>;
  createBlock: (block: any) => Promise<Result<any, string>>;
  updateBlock: (id: string, data: any) => Promise<Result<any, string>>;
  deleteBlock: (id: string) => Promise<Result<boolean, string>>;
  markConflicts: (ids: string[]) => void;
  setSelectedBlockId: (id: string | null) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  isLoading: false,
  error: null,

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  markConflicts: (ids) => {
    set(state => ({
      blocks: state.blocks.map(b => ids.includes(b.id) ? { ...b, is_conflict: true } : b)
    }));
  },

  fetchBlocks: async () => {
    set({ isLoading: true });
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.SCHEDULES}`);
      const data = await response.json();
      
      // The persistent API returns a raw list or a Result object depending on the implementation
      // Standardizing on raw list for GET collections
      const resultData = Array.isArray(data) ? data : (data.success ? data.data : []);

      set({ blocks: resultData, isLoading: false });
      return { success: true, data: resultData };
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  createBlock: async (data) => {
    try {
      const { ActionService } = await import('../../core/ActionService');
      const result = await ActionService.createScheduleEvent(data);
      if (result.success) {
        get().fetchBlocks();
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to create' };
    }
  },

  updateBlock: async (id, data) => {
    const previousBlocks = get().blocks;
    set(state => ({
      blocks: state.blocks.map(b => b.id === id ? { ...b, ...data } : b)
    }));

    try {
      const { ActionService } = await import('../../core/ActionService');
      const result = await ActionService.updateScheduleEvent(id, data);
      if (!result.success) {
        set({ blocks: previousBlocks });
      } else {
        get().fetchBlocks();
      }
      return result;
    } catch (err) {
      set({ blocks: previousBlocks });
      return { success: false, error: 'Failed to update' };
    }
  },

  deleteBlock: async (id) => {
    const previousBlocks = get().blocks;
    set(state => ({
      blocks: state.blocks.filter(b => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId
    }));

    try {
      const { ActionService } = await import('../../core/ActionService');
      const result = await ActionService.deleteScheduleEvent(id);
      if (!result.success) {
        set({ blocks: previousBlocks });
      }
      return result;
    } catch (err) {
      set({ blocks: previousBlocks });
      return { success: false, error: 'Failed to delete' };
    }
  }
}));
