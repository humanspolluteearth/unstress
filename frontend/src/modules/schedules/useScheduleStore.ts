import { create } from 'zustand';
import { Result } from '../../core/results';

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
  isLoading: boolean;
  error: string | null;
  fetchBlocks: () => Promise<Result<TimeBlock[], string>>;
  createBlock: (block: any) => Promise<Result<any, string>>;
  markConflicts: (ids: string[]) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  blocks: [],
  isLoading: false,
  error: null,

  markConflicts: (ids) => {
    set(state => ({
      blocks: state.blocks.map(b => ids.includes(b.id) ? { ...b, is_conflict: true } : b)
    }));
  },

  fetchBlocks: async () => {
    set({ isLoading: true });
    try {
      const { ActionService } = await import('../../core/ActionService');
      const result = await ActionService.getSchedules();
      if (result.success && result.data) {
        set({ blocks: result.data, isLoading: false });
        return result;
      }
      set({ error: result.error || 'Failed', isLoading: false });
      return result;
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
  }
}));
