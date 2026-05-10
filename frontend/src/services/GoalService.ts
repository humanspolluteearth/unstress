import { Result } from '../core/results';

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
  links: string[];
  references: string[];
  tasks: { id: string; text: string; completed: boolean }[];
}

const API_BASE = "http://localhost:8000/api";

export class GoalService {
  static async createGoal(data: Omit<Goal, 'id'>): Promise<Result<any>> {
    try {
      const response = await fetch(`${API_BASE}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return { success: false, error: `Failed with status: ${response.status}` };
      }
      return { success: true, data: await response.json() };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }

  static async getGoals(): Promise<Result<Goal[], string>> {
    try {
      const response = await fetch(`${API_BASE}/goals`);
      if (!response.ok) {
        return { success: false, error: `Failed with status: ${response.status}` };
      }
      return { success: true, data: await response.json() };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }
}
