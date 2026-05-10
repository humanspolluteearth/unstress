import { create } from 'zustand';
import { Result } from '../../core/results';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

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
      const baseUrl = getBaseUrl();
      const url = timeframe 
        ? `${baseUrl}${API_ENDPOINTS.FINANCE}/transactions?timeframe=${timeframe}`
        : `${baseUrl}${API_ENDPOINTS.FINANCE}/transactions`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        set({ transactions: data, isLoading: false });
        return { success: true, data };
      } else {
        set({ error: 'Failed to fetch', isLoading: false });
        return { success: false, error: 'Failed to fetch' };
      }
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  fetchNetWorth: async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.FINANCE}/net-worth`);
      const data = await response.json();
      
      if (response.ok) {
        set({ netWorthHistory: data });
        return { success: true, data };
      }
      return { success: false, error: 'Failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  },

  fetchSummaries: async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.FINANCE}/summaries`);
      const result = await response.json();
      
      if (result.success && result.data) {
        set({ 
          weeklySummary: result.data.weekly, 
          yearlySummary: result.data.yearly 
        });
        return result;
      }
      return { success: false, error: 'Failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }
}));
