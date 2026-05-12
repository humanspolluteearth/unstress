import { create } from 'zustand';
import { Result } from '../../core/results';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';
import { ActionService } from '../../core/ActionService';

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
      const result = await ActionService.getSchedules();
      
      if (result.success && result.data) {
        set({ blocks: result.data, isLoading: false });
        return { success: true, data: result.data };
      }
      set({ error: result.error || 'Failed', isLoading: false });
      return { success: false, error: result.error || 'Failed' };
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  createBlock: async (data) => {
    try {
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
    const baseId = id.split('_')[0];
    const previousBlocks = get().blocks;
    set(state => ({
      blocks: state.blocks.map(b => b.id === id ? { ...b, ...data } : b)
    }));

    try {
      const result = await ActionService.updateScheduleEvent(baseId, data);
      if (!result.success) {
        set({ blocks: previousBlocks });
      } else {
        get().fetchBlocks();
      }
      return result;
    } catch (err) {
      set({ blocks: previousBlocks });
      return { success: false, error: 'Network error' };
    }
  },

  deleteBlock: async (id) => {
    const baseId = id.split('_')[0];
    const previousBlocks = get().blocks;
    set(state => ({
      blocks: state.blocks.filter(b => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId
    }));

    try {
      const result = await ActionService.deleteScheduleEvent(baseId);
      if (!result.success) {
        set({ blocks: previousBlocks });
      } else {
        get().fetchBlocks();
      }
      return result;
    } catch (err) {
      set({ blocks: previousBlocks });
      return { success: false, error: 'Network error' };
    }
  }
}));
