import { create } from 'zustand';
import { Result } from '../../core/results';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';
import { ActionService } from '../../core/ActionService';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  tags: string[];
  date: string;
  description: string;
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  assets: number;
  liabilities: number;
  total: number;
}

interface SummaryItem {
  label: string;
  value: number;
}

interface FinanceState {
  transactions: Transaction[];
  netWorthHistory: NetWorthSnapshot[];
  weeklySummary: SummaryItem[];
  yearlySummary: SummaryItem[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (timeframe?: string) => Promise<Result<Transaction[], string>>;
  fetchNetWorth: () => Promise<Result<NetWorthSnapshot[], string>>;
  fetchSummaries: () => Promise<Result<{ weekly: SummaryItem[], yearly: SummaryItem[] }, string>>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  netWorthHistory: [],
  weeklySummary: [],
  yearlySummary: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (timeframe) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ActionService.fetchTransactions(timeframe);
      
      if (result.success && result.data) {
        set({ transactions: result.data, isLoading: false });
        return result;
      } else {
        set({ error: result.error || 'Failed to fetch', isLoading: false });
        return result;
      }
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  fetchNetWorth: async () => {
    try {
      const result = await ActionService.fetchNetWorth();
      
      if (result.success && result.data) {
        set({ netWorthHistory: result.data });
        return result;
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  },

  fetchSummaries: async () => {
    try {
      const result = await ActionService.fetchSummaries();
      
      if (result.success && result.data) {
        set({ 
          weeklySummary: result.data.weekly, 
          yearlySummary: result.data.yearly 
        });
        return result;
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }
}));
