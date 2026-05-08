import { Result } from './results';
import { ActionService, TransactionCreate, TaskCreate, HabitLogCreate } from './ActionService';
import { useFinanceStore } from '../modules/finance/useFinanceStore';
import { useTaskStore } from '../modules/tasks/useTaskStore';
import { useGoalStore } from '../modules/goals/useGoalStore';

/**
 * Frontend ActionDispatcher that coordinates backend calls with frontend store updates.
 */
export class ActionDispatcher {
  static async createTransaction(data: TransactionCreate): Promise<Result<any>> {
    const result = await ActionService.createTransaction(data);
    if (result.success) {
      // Reactive Update: Refresh Stores
      useFinanceStore.getState().fetchTransactions();
      useFinanceStore.getState().fetchSummaries();
      useGoalStore.getState().fetchGoals();
    }
    return result;
  }

  static async createTask(data: TaskCreate): Promise<Result<any>> {
    const result = await ActionService.createTask(data);
    if (result.success) {
      // Reactive Update: Refresh Stores
      useTaskStore.getState().fetchTasks();
      useGoalStore.getState().fetchGoals();
    }
    return result;
  }

  static async createHabitLog(data: HabitLogCreate): Promise<Result<any>> {
    const result = await ActionService.createHabitLog(data);
    if (result.success) {
      // Reactive Update: Refresh Habit Store
      const { useHabitStore } = await import('../modules/habits/useHabitStore');
      useHabitStore.getState().fetchHabits();
    }
    return result;
  }

  static async deleteHabit(id: string): Promise<Result<any>> {
    const result = await ActionService.deleteHabit(id);
    if (result.success) {
      const { useHabitStore } = await import('../modules/habits/useHabitStore');
      useHabitStore.getState().fetchHabits();
    }
    return result;
  }

  static async updateTransaction(id: string, data: TransactionCreate): Promise<Result<any>> {
    const result = await ActionService.updateTransaction(id, data);
    if (result.success) {
      useFinanceStore.getState().fetchTransactions();
      useFinanceStore.getState().fetchSummaries();
    }
    return result;
  }

  static async deleteTransaction(id: string): Promise<Result<any>> {
    const result = await ActionService.deleteTransaction(id);
    if (result.success) {
      useFinanceStore.getState().fetchTransactions();
      useFinanceStore.getState().fetchSummaries();
    }
    return result;
  }
}
