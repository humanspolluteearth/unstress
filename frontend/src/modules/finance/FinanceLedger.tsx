import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wallet, Calendar, Tag as TagIcon, BarChart3, TrendingUp } from 'lucide-react';
import { useFinanceStore, Transaction, NetWorthSnapshot } from './useFinanceStore';
import { TransactionModal } from './TransactionModal';
import { ActionDispatcher } from '../../core/ActionDispatcher';
import { clsx } from 'clsx';

/**
 * Lean CSS Bar Chart Component
 */
const CSSBarChart: React.FC<{ data: { label: string; value: number }[], title: string, color: string }> = ({ data, title, color }) => {
  const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);
  
  return (
    <div className="bg-card border rounded-none p-6 space-y-4 shadow-sm relative overflow-hidden text-white/90">
      <div className="flex justify-between items-start">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
        <span className={clsx(
          "text-lg font-black tracking-tighter",
          totalValue >= 0 ? "text-emerald-500" : "text-red-500"
        )}>
          {totalValue >= 0 ? '+' : ''}<span className="mr-1">৳</span>{totalValue.toFixed(2)}
        </span>
      </div>
      
      <div className="flex items-end justify-between h-32 gap-1.5 pt-4">
        {data.map((item, idx) => {
          const heightPercent = (Math.abs(item.value) / maxValue) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
              <div 
                className={clsx(
                  "w-full rounded-none transition-all duration-700 ease-out", 
                  item.value > 0 ? "bg-emerald-500" : item.value < 0 ? "bg-red-500" : "bg-white/[0.03]"
                )}
                style={{ height: `${Math.max(heightPercent, Math.abs(item.value) > 0 ? 5 : 2)}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded-none font-bold whitespace-nowrap z-10">
                  <span className="mr-0.5">৳</span>{item.value.toFixed(0)}
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FinanceLedger: React.FC = () => {
  const { 
    transactions, 
    netWorthHistory, 
    weeklySummary, 
    yearlySummary, 
    isLoading, 
    error, 
    fetchTransactions, 
    fetchNetWorth, 
    fetchSummaries 
  } = useFinanceStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [filter, setFilter] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchTransactions(filter);
    fetchNetWorth();
    fetchSummaries();
  }, [filter]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this entry?')) {
      const result = await ActionDispatcher.deleteTransaction(id);
      if (result.success) {
        fetchTransactions(filter);
        fetchSummaries();
        fetchNetWorth();
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
    fetchTransactions(filter);
    fetchSummaries();
    fetchNetWorth();
  };

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto relative animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Finance</h2>
          <p className="text-muted-foreground text-sm">Strategic capital allocation and automated ledgering.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} /> Log Transaction
          </button>
        </div>
      </header>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CSSBarChart data={weeklySummary} title="Recent Cashflow" color="bg-emerald-500/80" />
        <CSSBarChart data={yearlySummary} title="Net Worth Overview" color="bg-blue-500/80" />
      </div>

      {/* Ledger Section */}
      <div className="space-y-4 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2 text-white/90">
            <Wallet size={20} className="text-primary" /> Double-Entry Ledger
          </h3>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-none border border-white/5">
            Assets = Liabilities + Equity
          </div>
        </div>

        <div className="rounded-none border bg-card overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transaction</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tags</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Synchronizing Ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-zinc-500 italic text-xs uppercase tracking-widest">
                      The ledger is empty. Start by logging your first transaction.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
                      <td className="px-6 py-5 text-xs text-muted-foreground">
                        {tx.date ? new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '---'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-sm text-white/90">{tx.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400 px-2 py-0.5 bg-muted rounded-none border border-white/5 inline-block">
                          {tx.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">
                          {tx.tags && tx.tags.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-none bg-white/5 text-white/50 border border-white/5 lowercase tracking-tight">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={clsx(
                        "px-6 py-5 text-right font-mono font-bold",
                        tx.type === 'income' ? "text-emerald-500" : "text-red-500"
                      )}>
                        {tx.type === 'income' ? '+' : '-'}<span className="mr-1">৳</span>{Math.abs(tx.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(tx)}
                            className="p-1.5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        transaction={editingTransaction} 
      />
    </div>
  );
};
