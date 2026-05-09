import { ActionService, GoalCreate } from '../../core/ActionService';
import { Result } from '../../core/results';

export class GoalService {
  static async createGoal(data: GoalCreate): Promise<Result<any>> {
    return ActionService.createGoal(data);
  }

  static async getGoals(): Promise<Result<any[]>> {
    const port = (window as any).__BACKEND_PORT__ || 8000;
    try {
      const response = await fetch(`http://localhost:${port}/goals/`);
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }
}
