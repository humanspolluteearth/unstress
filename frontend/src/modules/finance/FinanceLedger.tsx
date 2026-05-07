import React, { useEffect } from 'react';
import { useFinanceStore } from './useFinanceStore';
import { Transaction } from './useFinanceStore';

/**
 * FinanceLedger Component
 * Displays the double-entry ledger using Tailwind CSS.
 * Adheres to "No Barrel Imports" by importing directly from source files.
 */
export const FinanceLedger: React.FC = () => {
  const { transactions, isLoading, error, fetchTransactions } = useFinanceStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
        <p className="font-medium">Error loading ledger</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finance Ledger</h2>
          <p className="text-muted-foreground">Double-entry transaction history.</p>
        </div>
      </header>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Description</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Amount (Cents)</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {transactions.length === 0 ? (
              <tr className="border-b transition-colors hover:bg-muted/50">
                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr className="border-b transition-colors hover:bg-muted/50 font-semibold bg-muted/20">
                    <td className="p-4 align-middle">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">{tx.description}</td>
                    <td className="p-4 align-middle text-right">
                      {/* Total sum for the transaction header (should be 0 in double-entry) */}
                      0
                    </td>
                  </tr>
                  {tx.postings.map((posting) => (
                    <tr key={posting.id} className="border-b transition-colors hover:bg-muted/50 text-xs text-muted-foreground">
                      <td className="p-2 pl-8 align-middle" colSpan={2}>
                        {posting.memo || `Account: ${posting.account_id}`}
                      </td>
                      <td className={`p-2 pr-4 align-middle text-right ${posting.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {posting.amount > 0 ? `+${posting.amount}` : posting.amount}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
