import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Result } from '../../core/results';
import { TaskCreate } from '../../core/ActionService';

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
    // Mock fetch with more detailed data
    const mockTasks: Task[] = [
      { 
        id: 'task-1', 
        title: 'Implement ActionService', 
        description: 'Implement the core action service for backend communication.',
        status: 'In Progress',
        priority: 2,
        tags: ['core', 'frontend'],
        deadline: new Date().toISOString(),
        projectLink: 'https://github.com/unstress/core'
      },
      { 
        id: 'task-2', 
        title: 'Fix Sidecar Path', 
        description: 'Ensure the sidecar executable is correctly located in all environments.',
        status: 'Done',
        priority: 1,
        tags: ['tauri', 'linux'],
        deadline: new Date().toISOString()
      },
      { 
        id: 'task-3', 
        title: 'Design Task Board', 
        description: 'Create a multi-view task board with Kanban and List views.',
        status: 'Todo',
        priority: 2,
        tags: ['ui', 'ux'],
        deadline: new Date(Date.now() + 86400000).toISOString()
      },
      { 
        id: 'task-4', 
        title: 'Verify Finance CRUD', 
        description: 'Test all finance operations against the mock backend.',
        status: 'Funded',
        priority: 1,
        tags: ['finance', 'testing'],
        deadline: new Date(Date.now() + 172800000).toISOString()
      },
    ];
    set({ tasks: mockTasks, isLoading: false });
    return { success: true, data: mockTasks };
  },

  createTask: async (taskData) => {
    try {
      const { ActionService } = await import('../../core/ActionService');
      const result = await ActionService.createTask(taskData);
      
      if (result.success && result.data && result.data.data) {
        const backendTask = result.data.data;
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
      const { ActionService } = await import('../../core/ActionService');
      const result = await ActionService.updateTask(taskId, taskData);
      
      if (result.success && result.data && result.data.data) {
        const backendTask = result.data.data;
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
      const { ActionService } = await import('../../core/ActionService');
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
      const { ActionService } = await import('../../core/ActionService');
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
