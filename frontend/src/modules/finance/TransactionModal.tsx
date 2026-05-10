import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, FileText, Repeat } from 'lucide-react';
import { Transaction, Posting } from './useFinanceStore';
import { ActionDispatcher } from '../../core/ActionDispatcher';
import { clsx } from 'clsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

type TxType = 'spending' | 'income';

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction }) => {
  const [type, setType] = useState<TxType>('spending');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setNotes(transaction.notes || '');
      setTags(transaction.tags);
      setIsRecurring(transaction.is_recurring);
      // Heuristic to determine type
      const hasExpense = transaction.postings.some(p => p.account_id === 'acc-expenses');
      setType(hasExpense ? 'spending' : 'income');
      // Amount usually from the positive side
      const mainAmount = Math.abs(transaction.postings[0].amount);
      setAmount(mainAmount / 100);
    } else {
      setDescription('');
      setAmount(0);
      setNotes('');
      setTags([]);
      setIsRecurring(false);
      setType('spending');
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountCents = Math.round(amount * 100);
    if (amountCents <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    // Automated Double-Entry Postings
    let postings: any[] = [];
    if (type === 'spending') {
      postings = [
        { account_id: 'acc-expenses', amount: amountCents, memo: 'Expense' },
        { account_id: 'acc-assets', amount: -amountCents, memo: 'Payment' }
      ];
    } else {
      postings = [
        { account_id: 'acc-assets', amount: amountCents, memo: 'Revenue Deposit' },
        { account_id: 'acc-revenue', amount: -amountCents, memo: 'Income' }
      ];
    }

    const data = { 
      description, 
      postings, 
      tags, 
      notes, 
      is_recurring: isRecurring 
    };

    const result = transaction 
      ? await ActionDispatcher.updateTransaction(transaction.id, data as any)
      : await ActionDispatcher.createTransaction(data as any);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to save transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-none shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold tracking-tight uppercase">
            {transaction ? 'Update Entry' : (type === 'spending' ? 'Log Spending' : 'Log Income')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-none">
            <X size={20} />
          </button>
        </div>

        <div className="flex p-1 bg-muted mx-4 mt-4 rounded-none border border-white/5">
          <button
            onClick={() => setType('spending')}
            className={clsx(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-none transition-all",
              type === 'spending' ? "bg-background text-red-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            SPENDING
          </button>
          <button
            onClick={() => setType('income')}
            className={clsx(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-none transition-all",
              type === 'income' ? "bg-background text-green-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            INCOME
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-none border border-destructive/20 animate-in shake-1">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  className="w-full bg-muted/30 border-none rounded-none pl-10 pr-4 py-4 text-3xl font-bold focus:ring-2 focus:ring-primary outline-none"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Description</label>
              <input
                type="text"
                required
                className="w-full bg-muted/30 border-none rounded-none px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                <Tag size={10} /> Tags (Press Enter)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-none border border-primary/20 flex items-center gap-1">
                    {tag} <X size={10} className="cursor-pointer" onClick={() => removeTag(tag)} />
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-muted/30 border-none rounded-none px-4 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                placeholder="Add tags..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                <FileText size={10} /> Notes
              </label>
              <textarea
                className="w-full bg-muted/30 border-none rounded-none px-4 py-3 text-xs focus:ring-2 focus:ring-primary outline-none resize-none h-20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional details..."
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-none border border-white/5">
              <div className="flex items-center gap-2">
                <Repeat size={16} className="text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recurring Fee</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={clsx(
                  "relative inline-flex h-5 w-10 items-center rounded-none border transition-colors",
                  isRecurring ? "bg-primary border-primary" : "bg-muted border-white/10"
                )}
              >
                <span className={clsx(
                  "inline-block h-3 w-3 transform rounded-none bg-white transition-transform",
                  isRecurring ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>
        </form>

        <div className="p-4 border-t flex gap-3 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-none border border-transparent hover:border-white/5 transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            className={clsx(
              "flex-[2] py-3 text-[10px] font-black uppercase tracking-widest rounded-none shadow-lg transition-all active:scale-95",
              type === 'spending' ? "bg-red-500 text-white" : "bg-green-500 text-white"
            )}
          >
            {transaction ? 'UPDATE ENTRY' : (type === 'spending' ? 'LOG SPENDING' : 'LOG INCOME')}
          </button>
        </div>
      </div>
    </div>
  );
};
