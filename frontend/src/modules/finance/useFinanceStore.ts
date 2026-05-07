import { create } from 'zustand';
import { Result } from '../../core/results';

export interface Posting {
  id: string;
  account_id: string;
  amount: number;
  memo: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  date: string;
  postings: Posting[];
}

interface FinanceState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<Result<Transaction[], string>>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Retrieve the dynamic port from the global window object injected by Tauri
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/finance/transactions`);
      
      const result: Result<Transaction[], string> = await response.json();
      
      if (result.success && result.data) {
        set({ transactions: result.data, isLoading: false });
        return result;
      } else {
        const errorMsg = result.error || 'Failed to fetch transactions';
        set({ error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown network error';
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },
}));
