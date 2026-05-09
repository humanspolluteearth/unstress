import { ActionService, GoalCreate } from '../../core/ActionService';
import { Result } from '../../core/results';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

export class GoalService {
  static async createGoal(data: GoalCreate): Promise<Result<any>> {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.GOALS}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }

  static async getGoals(): Promise<Result<any[]>> {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.GOALS}`);
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }
}
