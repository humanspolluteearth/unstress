import { ActionService, GoalCreate } from '../../core/ActionService';
import { Result } from '../../core/results';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

export class GoalService {
  static async createGoal(data: GoalCreate): Promise<Result<any>> {
    try {
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}${API_ENDPOINTS.GOALS}/`;
      console.log(`[GoalService] Establishing goal at: ${url}`, data);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.status === 404) {
        console.error(`[GoalService] 404 Not Found: ${url}`);
        return { success: false, error: `API Endpoint Not Found: ${url}` };
      }
      return await response.json();
    } catch (err) {
      console.error(`[GoalService] Fetch error:`, err);
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
