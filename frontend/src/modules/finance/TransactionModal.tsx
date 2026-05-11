import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, Wallet, Calendar, FileText } from 'lucide-react';
import { Transaction } from './useFinanceStore';
import { ActionDispatcher } from '../../core/ActionDispatcher';
import { CustomSelect } from '../../core/CustomSelect';
import { clsx } from 'clsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

type TxType = 'expense' | 'income';

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction }) => {
  const [type, setType] = useState<TxType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setType(transaction.type);
      setCategory(transaction.category);
      setTags(transaction.tags.join(', '));
      setDate(transaction.date);
    } else {
      setDescription('');
      setAmount(0);
      setType('expense');
      setCategory('General');
      setTags('');
      setDate(new Date().toISOString());
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (amount <= 0) {
      setError("Amount must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      amount,
      type,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      description,
      date,
    };

    try {
      let result;
      if (transaction) {
        result = await ActionDispatcher.updateTransaction(transaction.id, payload);
      } else {
        result = await ActionDispatcher.createTransaction(payload);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to save transaction');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { label: 'Spending (Expense)', value: 'expense' },
    { label: 'Income', value: 'income' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{transaction ? 'Edit Transaction' : 'Log Capital Flow'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-none border border-destructive/20">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (TK)</label>
            <div className="relative">
              <span className={clsx(
                "absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold",
                type === 'income' ? "text-emerald-500/20" : "text-red-500/20"
              )}>৳</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                className={clsx(
                  "w-full bg-muted/30 border-none rounded-none pl-10 pr-4 py-4 text-3xl font-black focus:ring-1 focus:ring-primary/50 outline-none transition-colors",
                  type === 'income' ? "text-emerald-500" : "text-red-500"
                )}
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <CustomSelect
            label="Transaction Type"
            icon={<Wallet size={14} />}
            value={type}
            onChange={setType}
            options={typeOptions}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <FileText size={14} /> Description
            </label>
            <input
              type="text"
              required
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                type="text"
                required
                className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Food, Rent..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar size={14} /> Date
              </label>
              <input
                type="datetime-local"
                required
                className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={new Date(date).toISOString().slice(0, 16)}
                onChange={(e) => setDate(new Date(e.target.value).toISOString())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Tag size={14} /> Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="finance, work, lifestyle..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-none shadow-sm transition-all hover:bg-primary/90",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? 'Processing...' : (transaction ? 'Update Transaction' : 'Log Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
