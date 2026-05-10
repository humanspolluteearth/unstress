import { Result } from './results';
import { getBaseUrl, API_ENDPOINTS } from './apiConfig';

export interface PostingCreate {
  account_id: string;
  amount: number;
  memo?: string;
}

export interface TransactionCreate {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  tags?: string[];
  description: string;
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

export interface ScheduleEventCreate {
  title: string;
  start_time: string;
  end_time: string;
  repeat_pattern?: 'Daily' | 'Weekly' | 'Monthly' | null;
  goal_id?: string;
}

export class ActionService {
  private static async request<T, R>(method: string, endpoint: string, data?: T): Promise<Result<R>> {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return await response.json();
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown network error',
      };
    }
  }

  // --- Transactions ---

  static async createTransaction(data: TransactionCreate): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.FINANCE}/transactions`, data);
  }

  static async updateTransaction(id: string, data: TransactionCreate): Promise<Result<any>> {
    return this.request('PUT', `${API_ENDPOINTS.FINANCE}/transactions/${id}`, data);
  }

  static async deleteTransaction(id: string): Promise<Result<any>> {
    return this.request('DELETE', `${API_ENDPOINTS.FINANCE}/transactions/${id}`);
  }

  // --- Tasks ---

  static async createTask(data: TaskCreate): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.TASKS}`, data);
  }

  static async updateTask(id: string, data: TaskCreate): Promise<Result<any>> {
    return this.request('PATCH', `${API_ENDPOINTS.TASKS}/${id}`, data);
  }

  static async deleteTask(id: string): Promise<Result<any>> {
    return this.request('DELETE', `${API_ENDPOINTS.TASKS}/${id}`);
  }

  static async updateTaskStatus(id: string, status: string): Promise<Result<any>> {
    // Note: The backend api/tasks.py doesn't have a specific status endpoint yet, 
    // it uses update_task for general updates. Standardizing on PATCH /{id}.
    return this.request('PATCH', `${API_ENDPOINTS.TASKS}/${id}`, { status });
  }

  // --- Habits ---

  static async createHabitLog(data: HabitLogCreate): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.HABITS}/log`, data);
  }

  static async deleteHabit(id: string): Promise<Result<any>> {
    return this.request('DELETE', `${API_ENDPOINTS.HABITS}/${id}`);
  }

  // --- Schedules ---

  static async createScheduleEvent(data: ScheduleEventCreate): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.SCHEDULES}`, data);
  }

  static async updateScheduleEvent(id: string, data: Partial<ScheduleEventCreate>): Promise<Result<any>> {
    return this.request('PUT', `${API_ENDPOINTS.SCHEDULES}/${id}`, data);
  }

  static async deleteScheduleEvent(id: string): Promise<Result<any>> {
    return this.request('DELETE', `${API_ENDPOINTS.SCHEDULES}/${id}`);
  }

  static async getSchedules(): Promise<Result<any[]>> {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.SCHEDULES}`);
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Failed to fetch schedules' };
    }
  }

  // --- Infrastructure ---

  static async performBackup(): Promise<Result<string>> {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('perform_backup');
  }

  static async resetModule(module: string): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.ACTIONS}/system/reset-module?module=${module}`, {});
  }

  static async clearEvents(): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.ACTIONS}/system/clear-events`, {});
  }
}
