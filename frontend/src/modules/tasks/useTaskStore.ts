import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Result } from '../../core/results';
import { ActionService, TaskCreate } from '../../core/ActionService';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done' | 'Funded' | 'Pending';
  priority: number;
  tags: string[];
  deadline?: string;
  projectLink?: string;
  goalId?: string;
}

export type ViewMode = 'Kanban' | 'List' | 'Schedule';

interface TaskState {
  tasks: Task[];
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  setViewMode: (mode: ViewMode) => void;
  fetchTasks: () => Promise<Result<Task[], string>>;
  createTask: (task: TaskCreate) => Promise<Result<Task, string>>;
  updateTask: (taskId: string, task: TaskCreate) => Promise<Result<Task, string>>;
  deleteTask: (taskId: string) => Promise<Result<void, string>>;
  updateTaskStatus: (taskId: string, newStatus: Task['status']) => Promise<Result<any, string>>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  viewMode: 'Kanban',
  isLoading: false,
  error: null,

  setViewMode: (mode) => set({ viewMode: mode }),

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const result = await ActionService.fetchTasks();
      
      if (result.success && result.data) {
        const mappedTasks: Task[] = result.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          tags: t.tags || [],
          deadline: t.deadline,
          projectLink: t.project_link,
          goalId: t.goal_id
        }));

        set({ tasks: mappedTasks, isLoading: false });
        return { success: true, data: mappedTasks };
      }
      set({ error: result.error || 'Failed', isLoading: false });
      return { success: false, error: result.error || 'Failed' };
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  createTask: async (taskData) => {
    try {
      const result = await ActionService.createTask(taskData);
      
      if (result.success) {
        const backendTask = result.data;
        const newTask: Task = {
          id: backendTask.id,
          title: backendTask.title,
          description: backendTask.description,
          status: backendTask.status,
          priority: backendTask.priority,
          tags: backendTask.tags || [],
          deadline: backendTask.deadline,
          projectLink: backendTask.project_link,
          goalId: backendTask.goal_id
        };
        set(state => ({ tasks: [newTask, ...state.tasks] }));
        return { success: true, data: newTask };
      }
      return { success: false, error: result.error || 'Failed to create task' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const result = await ActionService.updateTask(taskId, taskData);
      
      if (result.success) {
        const backendTask = result.data;
        const updatedTask: Task = {
          id: backendTask.id,
          title: backendTask.title,
          description: backendTask.description,
          status: backendTask.status,
          priority: backendTask.priority,
          tags: backendTask.tags || [],
          deadline: backendTask.deadline,
          projectLink: backendTask.project_link,
          goalId: backendTask.goal_id
        };
        set(state => ({
          tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
        }));
        return { success: true, data: updatedTask };
      }
      return { success: false, error: result.error || 'Failed to update task' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  },

  deleteTask: async (taskId) => {
    try {
      const result = await ActionService.deleteTask(taskId);
      
      if (result.success) {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId)
        }));
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to delete task' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  },

  updateTaskStatus: async (taskId, newStatus) => {
    const previousTasks = get().tasks;
    
    // 1. Optimistic Update
    const optimisticTasks = previousTasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    set({ tasks: optimisticTasks });

    // 2. Perform Backend Call
    try {
      const result = await ActionService.updateTaskStatus(taskId, newStatus);

      if (!result.success) {
        // Rollback on failure
        set({ tasks: previousTasks, error: result.error });
        return result;
      }

      // 3. Side effects (e.g., updating tray summary)
      if (newStatus === 'Done') {
        const { useGoalStore } = await import('../goals/useGoalStore');
        useGoalStore.getState().fetchGoals();

        const doneCount = optimisticTasks.filter(t => t.status === 'Done').length;
        const total = optimisticTasks.length;
        try {
          await invoke('update_tray_summary', { 
            tasks: `${doneCount}/${total}`,
            balance: "Refreshed" 
          });
        } catch {}
      }

      return result;
    } catch (err) {
      // Rollback on network error
      set({ tasks: previousTasks, error: 'Network error' });
      return { success: false, error: 'Network error' };
    }
  }
}));
