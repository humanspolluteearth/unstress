import React, { useState, useEffect } from 'react';
import { useFinanceStore, Transaction, NetWorthSnapshot } from './useFinanceStore';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Wallet, Calendar, Plus } from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { transactions, netWorthHistory, fetchTransactions, fetchNetWorth } = useFinanceStore();
  const [filter, setFilter] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchTransactions(filter === 'monthly' ? 'monthly' : 'yearly');
    fetchNetWorth();
  }, [filter]);

  const currentSnapshot = netWorthHistory[0] || { assets: 0, liabilities: 0, total: 0 };

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
          <p className="text-muted-foreground text-sm">Strategic capital allocation and automated ledgering.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-none border">
            {(['monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={clsx(
                  "px-4 py-1.5 rounded-none text-xs font-medium transition-all uppercase tracking-wider",
                  filter === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95">
            <Plus size={18} /> Add Entry
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Net Worth View (Col 1) */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-card border rounded-none p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-3">Monthly Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Assets</span>
                <span className="font-mono text-emerald-500 font-bold">${currentSnapshot.assets.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Liabilities</span>
                <span className="font-mono text-crimson-500 font-bold">${currentSnapshot.liabilities.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-tight">Net Worth</span>
                <span className="text-xl font-black tracking-tighter text-foreground">${currentSnapshot.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-none p-4 h-48 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 flex items-end justify-between px-2 pb-2">
                {[40, 70, 45, 90, 65, 80, 50, 75, 40, 85].map((h, i) => (
                  <div key={i} className="bg-primary w-2" style={{ height: `${h}%` }} />
                ))}
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground z-10 opacity-50">Trend Visualization</span>
          </div>
        </div>

        {/* Income/Spending List (Col 2 & 3) */}
        <div className="lg:col-span-2 bg-card border rounded-none flex flex-col shadow-sm min-h-0 overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Ledger</h3>
            <span className="text-[9px] font-mono text-muted-foreground uppercase">{transactions.length} entries</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tags</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black uppercase tracking-tighter text-foreground px-2 py-1 bg-muted rounded-none border border-white/5">
                        {tx.category}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {tx.tags.map(t => (
                          <span key={t} className="text-[11px] text-muted-foreground/60">#{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className={clsx(
                      "px-6 py-4 text-right font-mono font-bold",
                      tx.type === 'income' ? "text-emerald-500" : "text-red-500"
                    )}>
                      {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-center opacity-30">
                <Wallet size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest">No capital flow detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
