import { create } from 'zustand';
import { Result } from '../../core/results';

export interface Posting {
  id?: string;
  account_id: string;
  amount: number;
  memo?: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  date: string;
  postings: Posting[];
  tags: string[];
  notes?: string;
  is_recurring: boolean;
}

interface SummaryItem {
  label: string;
  value: number;
}

interface FinanceState {
  transactions: Transaction[];
  weeklySummary: SummaryItem[];
  yearlySummary: SummaryItem[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<Result<Transaction[], string>>;
  fetchSummaries: () => Promise<Result<{ weekly: SummaryItem[], yearly: SummaryItem[] }, string>>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  weeklySummary: [],
  yearlySummary: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/finance/transactions`);
      const result: Result<Transaction[], string> = await response.json();
      
      if (result.success && result.data) {
        set({ transactions: result.data, isLoading: false });
        return result;
      } else {
        set({ error: result.error || 'Failed', isLoading: false });
        return { success: false, error: result.error || 'Failed' };
      }
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
      return { success: false, error: 'Network error' };
    }
  },

  fetchSummaries: async () => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/finance/summaries`);
      const result: Result<{ weekly: SummaryItem[], yearly: SummaryItem[] }, string> = await response.json();
      
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
