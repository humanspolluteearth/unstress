import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, Calendar, CreditCard, Tag as TagIcon } from 'lucide-react';
import { useFinanceStore, Transaction } from './useFinanceStore';
import { TransactionModal } from './TransactionModal';
import { ActionDispatcher } from '../../core/ActionDispatcher';
import { clsx } from 'clsx';

/**
 * Lean CSS Bar Chart Component
 */
const CSSBarChart: React.FC<{ data: { label: string; value: number }[], title: string, color: string }> = ({ data, title, color }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);
  
  return (
    <div className="bg-card border rounded-none p-6 space-y-4 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
        <span className="text-lg font-black tracking-tighter">${totalValue.toFixed(2)}</span>
      </div>
      
      <div className="flex items-end justify-between h-32 gap-1.5 pt-4">
        {data.map((item, idx) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
              <div 
                className={clsx(
                  "w-full rounded-none transition-all duration-700 ease-out", 
                  item.value > 0 ? color : "bg-white/[0.03]"
                )}
                style={{ height: `${Math.max(heightPercent, item.value > 0 ? 5 : 2)}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded-none font-bold whitespace-nowrap z-10">
                  ${item.value.toFixed(0)}
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
  const { transactions, weeklySummary, yearlySummary, isLoading, error, fetchTransactions, fetchSummaries } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  useEffect(() => {
    fetchTransactions();
    fetchSummaries();
  }, []);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this entry? Ledger balance will be recalculated.')) {
      await ActionDispatcher.deleteTransaction(id);
      fetchSummaries();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
    fetchSummaries();
  };

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto relative animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CSSBarChart data={weeklySummary} title="Weekly Spending" color="bg-red-500/80" />
        <CSSBarChart data={yearlySummary} title="Yearly Overview" color="bg-blue-500/80" />
      </div>

      {/* Ledger Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Wallet size={20} className="text-primary" /> Double-Entry Ledger
          </h3>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-none border border-white/5">
            Assets = Liabilities + Equity
          </div>
        </div>

        <div className="rounded-none border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transaction</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Flow</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic">
                    The ledger is empty. Start by logging your first transaction.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <React.Fragment key={tx.id}>
                    <tr className="group border-b hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{tx.description}</span>
                            {tx.is_recurring && (
                              <span className="text-[8px] bg-blue-500/10 text-blue-500 font-black px-1.5 py-0.5 rounded-none border border-blue-500/20 uppercase tracking-tighter">Recurring</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(tx.date).toLocaleDateString()}</span>
                            {tx.tags.length > 0 && (
                              <span className="flex items-center gap-1"><TagIcon size={10} /> {tx.tags.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top" colSpan={2}>
                        <div className="space-y-2">
                          {tx.postings.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="font-mono opacity-60 uppercase tracking-tighter">{p.account_id}</span>
                              <span className={clsx(
                                "font-bold",
                                p.amount > 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {p.amount > 0 ? '+' : ''}{(p.amount / 100).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(tx)}
                            className="p-2 hover:bg-muted rounded-none text-muted-foreground hover:text-foreground transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 hover:bg-destructive/10 rounded-none text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
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
