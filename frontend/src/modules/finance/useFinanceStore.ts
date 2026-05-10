import { create } from 'zustand';
import { Result } from '../../core/results';
import { getBaseUrl } from '../../core/apiConfig';

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

interface FinanceState {
  transactions: Transaction[];
  netWorthHistory: NetWorthSnapshot[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (timeframe?: string) => Promise<Result<Transaction[], string>>;
  fetchNetWorth: () => Promise<Result<NetWorthSnapshot[], string>>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  transactions: [],
  netWorthHistory: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (timeframe) => {
    set({ isLoading: true, error: null });
    try {
      const baseUrl = getBaseUrl();
      const url = timeframe 
        ? `${baseUrl}/api/finance/transactions?timeframe=${timeframe}`
        : `${baseUrl}/api/finance/transactions`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // The new api/finance returns raw list, not Result object
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
      const response = await fetch(`${baseUrl}/api/finance/net-worth`);
      const data = await response.json();
      
      if (response.ok) {
        set({ netWorthHistory: data });
        return { success: true, data };
      }
      return { success: false, error: 'Failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }
}));
