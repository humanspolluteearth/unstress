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

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: number;
  status?: string;
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

export interface GoalCreate {
  title: string;
  description: string;
  markdown_content?: string;
  priority: string;
  category: string;
  time_frame: string;
  deadline?: string;
  label_color?: string;
  assignee_initials?: string;
  tags?: string[];
  links?: string[];
  references?: string[];
  internal_tasks?: any[];
}

export interface HabitCreate {
  name: string;
  frequency: string;
  unit?: string;
  habit_type?: 'numeric' | 'binary';
  two_min_threshold: number;
  normal_threshold: number;
  hard_threshold: number;
  impossible_threshold: number;
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

  // --- Goals ---

  static async fetchGoals(): Promise<Result<any[]>> {
    return this.request('GET', API_ENDPOINTS.GOALS);
  }

  static async createGoal(data: GoalCreate): Promise<Result<any>> {
    return this.request('POST', API_ENDPOINTS.GOALS, data);
  }

  static async updateGoal(id: string, data: GoalCreate): Promise<Result<any>> {
    return this.request('PUT', `${API_ENDPOINTS.GOALS}/${id}`, data);
  }

  // --- Transactions ---

  static async fetchTransactions(timeframe?: string): Promise<Result<any[]>> {
    const url = timeframe ? `${API_ENDPOINTS.FINANCE}/transactions?timeframe=${timeframe}` : `${API_ENDPOINTS.FINANCE}/transactions`;
    return this.request('GET', url);
  }

  static async fetchNetWorth(): Promise<Result<any[]>> {
    return this.request('GET', `${API_ENDPOINTS.FINANCE}/net-worth`);
  }

  static async fetchSummaries(): Promise<Result<any>> {
    return this.request('GET', `${API_ENDPOINTS.FINANCE}/summaries`);
  }

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

  static async fetchTasks(): Promise<Result<any[]>> {
    return this.request('GET', API_ENDPOINTS.TASKS);
  }

  static async createTask(data: TaskCreate): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.TASKS}`, data);
  }

  static async updateTask(id: string, data: TaskUpdate): Promise<Result<any>> {
    return this.request('PATCH', `${API_ENDPOINTS.TASKS}/${id}`, data);
  }

  static async deleteTask(id: string): Promise<Result<any>> {
    return this.request('DELETE', `${API_ENDPOINTS.TASKS}/${id}`);
  }

  static async updateTaskStatus(id: string, status: string): Promise<Result<any>> {
    return this.request('PATCH', `${API_ENDPOINTS.TASKS}/${id}`, { status });
  }

  // --- Habits ---

  static async fetchHabits(): Promise<Result<any[]>> {
    return this.request('GET', API_ENDPOINTS.HABITS);
  }

  static async createHabit(data: HabitCreate): Promise<Result<any>> {
    return this.request('POST', API_ENDPOINTS.HABITS, data);
  }

  static async createHabitLog(data: HabitLogCreate): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.HABITS}/log`, data);
  }

  static async deleteHabit(id: string): Promise<Result<any>> {
    return this.request('DELETE', `${API_ENDPOINTS.HABITS}/${id}`);
  }

  // --- Schedules ---

  static async getSchedules(): Promise<Result<any[]>> {
    return this.request('GET', API_ENDPOINTS.SCHEDULES);
  }

  static async createScheduleEvent(data: ScheduleEventCreate): Promise<Result<any>> {
    return this.request('POST', `${API_ENDPOINTS.SCHEDULES}`, data);
  }

  static async updateScheduleEvent(id: string, data: Partial<ScheduleEventCreate>): Promise<Result<any>> {
    return this.request('PUT', `${API_ENDPOINTS.SCHEDULES}/${id}`, data);
  }

  static async deleteScheduleEvent(id: string): Promise<Result<any>> {
    return this.request('DELETE', `${API_ENDPOINTS.SCHEDULES}/${id}`);
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
