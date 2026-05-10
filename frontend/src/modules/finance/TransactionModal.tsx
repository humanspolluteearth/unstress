import React, { useState, useEffect } from 'react';
import { X, Tag, FileText } from 'lucide-react';
import { Transaction, useFinanceStore } from './useFinanceStore';
import { getBaseUrl } from '../../core/apiConfig';
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
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setType(transaction.type === 'expense' ? 'spending' : 'income');
      setCategory(transaction.category);
      setTags(transaction.tags);
    } else {
      setDescription('');
      setAmount(0);
      setType('spending');
      setCategory('General');
      setTags([]);
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
    setIsSubmitting(true);

    if (amount <= 0) {
      setError("Amount must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      amount,
      type: type === 'spending' ? 'expense' : 'income',
      category,
      tags,
      description,
    };

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/finance/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onClose();
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to save transaction');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-none shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-black/20">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
            {transaction ? 'Modify Transaction' : 'Initialize Capital Flow'}
          </h3>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex p-1 bg-muted mx-4 mt-4 rounded-none border border-white/5">
          <button
            onClick={() => setType('spending')}
            className={clsx(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-none transition-all",
              type === 'spending' ? "bg-background text-red-500 shadow-sm" : "text-white/20 hover:text-white"
            )}
          >
            SPENDING
          </button>
          <button
            onClick={() => setType('income')}
            className={clsx(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-none transition-all",
              type === 'income' ? "bg-background text-emerald-500 shadow-sm" : "text-white/20 hover:text-white"
            )}
          >
            INCOME
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-widest">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/20">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  className="w-full bg-white/5 border-none rounded-none pl-10 pr-4 py-4 text-3xl font-black text-white focus:ring-1 focus:ring-primary outline-none"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Description</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/5 rounded-none px-4 py-3 text-sm text-white focus:border-primary outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Category</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/5 rounded-none px-4 py-3 text-sm text-white focus:border-primary outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Business, Personal, etc."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1">
                <Tag size={10} /> Tags (Press Enter)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-none border border-primary/20 flex items-center gap-1 uppercase">
                    {tag} <X size={10} className="cursor-pointer" onClick={() => removeTag(tag)} />
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-white/5 border border-white/5 rounded-none px-4 py-2 text-xs text-white focus:border-primary outline-none"
                placeholder="Add tags..."
              />
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-white/5 flex gap-3 bg-black/20">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={clsx(
              "flex-[2] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-none shadow-lg transition-all active:scale-95 text-white",
              type === 'spending' ? "bg-red-500" : "bg-emerald-500",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'PROCESSING...' : (transaction ? 'UPDATE ENTRY' : 'COMMIT LOG')}
          </button>
        </div>
      </div>
    </div>
  );
};
