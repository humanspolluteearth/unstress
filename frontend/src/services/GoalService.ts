import { Result } from '../core/results';

export interface Goal {
  id: string;
  title: string;
  description: string;
  markdown_content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  time_frame: 'weekly' | 'monthly' | 'yearly';
  deadline: string | null;
  label_color: string;
  assignee_initials: string;
  progress: number;
  total_tasks: number;
  completed_tasks: number;
  is_current_focus: boolean;
  tags: string[];
  links: string[];
  references: string[];
  tasks: { id: string; text: string; completed: boolean }[];
}

const API_BASE = "http://127.0.0.1:8000/api";

export class GoalService {
  private static async request<T>(method: string, url: string, data?: any): Promise<Result<T>> {
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        return { success: false, error: `Failed with status: ${response.status}` };
      }
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }

  static async createGoal(data: Omit<Goal, 'id' | 'progress' | 'total_tasks' | 'completed_tasks'>): Promise<Result<any>> {
    return this.request('POST', `${API_BASE}/goals`, data);
  }

  static async getGoals(): Promise<Result<Goal[], string>> {
    return this.request('GET', `${API_BASE}/goals`);
  }

  static async updateGoal(id: string, data: Partial<Goal>): Promise<Result<Goal, string>> {
    return this.request('PUT', `${API_BASE}/goals/${id}`, data);
  }

  static async deleteGoal(id: string): Promise<Result<boolean, string>> {
    return this.request('DELETE', `${API_BASE}/goals/${id}`);
  }

  static async setFocus(id: string): Promise<Result<boolean, string>> {
    return this.request('POST', `${API_BASE}/goals/${id}/focus`);
  }
}
