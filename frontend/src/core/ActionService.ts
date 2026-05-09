import { Result } from './results';

export interface PostingCreate {
  account_id: string;
  amount: number;
  memo?: string;
}

export interface TransactionCreate {
  description: string;
  postings: PostingCreate[];
  tags?: string[];
  notes?: string;
  is_recurring?: boolean;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: number;
  tags?: string[];
  deadline?: string;
  project_link?: string;
  goal_id?: string;
}

export interface HabitLogCreate {
  habit_id: string;
  value: number;
}

export interface GoalCreate {
  name: string;
  description?: string;
  type: string;
  parent_id?: string;
}

export interface ScheduleEventCreate {
  title: string;
  start_time: string;
  end_time: string;
  repeat_pattern?: 'Daily' | 'Weekly' | 'Monthly' | null;
  goal_id?: string;
}

export class ActionService {
  private static async post<T, R>(path: string, data: T): Promise<Result<R>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/actions${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown network error',
      };
    }
  }

  static async createTransaction(data: TransactionCreate): Promise<Result<any>> {
    return this.post('/finance/transaction', data);
  }

  static async createTask(data: TaskCreate): Promise<Result<any>> {
    return this.post('/tasks/task', data);
  }

  static async updateTask(id: string, data: TaskCreate): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/actions/tasks/task/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Update failed' };
    }
  }

  static async deleteTask(id: string): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/actions/tasks/task/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Deletion failed' };
    }
  }

  static async updateTaskStatus(id: string, status: string): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/actions/tasks/task/${id}/status?status=${status}`, {
        method: 'PATCH',
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Status update failed' };
    }
  }

  static async createHabitLog(data: HabitLogCreate): Promise<Result<any>> {
    return this.post('/habits/log', data);
  }

  static async deleteHabit(id: string): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/habits/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Deletion failed' };
    }
  }

  static async updateTransaction(id: string, data: TransactionCreate): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/finance/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Update failed' };
    }
  }

  static async deleteTransaction(id: string): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/finance/transactions/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Deletion failed' };
    }
  }

  static async performBackup(): Promise<Result<string>> {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('perform_backup');
  }

  static async resetModule(module: string): Promise<Result<any>> {
    return this.post(`/system/reset-module?module=${module}`, {});
  }

  static async clearEvents(): Promise<Result<any>> {
    return this.post('/system/clear-events', {});
  }

  static async createScheduleEvent(data: ScheduleEventCreate): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/schedules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Failed to create event' };
    }
  }

  static async updateScheduleEvent(id: string, data: Partial<ScheduleEventCreate>): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Failed to update event' };
    }
  }

  static async deleteScheduleEvent(id: string): Promise<Result<any>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/schedules/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Failed to delete event' };
    }
  }

  static async getSchedules(): Promise<Result<any[]>> {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://127.0.0.1:${port}/schedules/`);
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Failed to fetch schedules' };
    }
  }
}
