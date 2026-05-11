import React, { useState } from 'react';
import { useHabitStore } from './useHabitStore';
import { X, RefreshCw, AlertCircle, Zap, Target, Flame, Activity, Trophy } from 'lucide-react';
import { CustomSelect } from '../../core/CustomSelect';
import { clsx } from 'clsx';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose }) => {
  const { createHabit } = useHabitStore();
  
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [unit, setUnit] = useState<'rep' | 'min'>('rep');
  const [two_min_threshold, setTwoMin] = useState(1);
  const [normal_threshold, setNormal] = useState(5);
  const [hard_threshold, setHard] = useState(10);
  const [impossible_threshold, setImpossible] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createHabit({
      title,
      frequency,
      unit,
      two_min_threshold,
      normal_threshold,
      hard_threshold,
      impossible_threshold
    });

    setIsSubmitting(false);

    if (result.success) {
      onClose();
      // Reset
      setTitle('');
      setFrequency('daily');
      setUnit('rep');
      setTwoMin(1);
      setNormal(5);
      setHard(10);
      setImpossible(20);
    } else {
      setError(result.error || 'Failed to create habit');
    }
  };

  const frequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  const unitOptions = [
    { label: 'Reps (Count)', value: 'rep' },
    { label: 'Minutes (Time)', value: 'min' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add New Habit</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
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
            <label className="text-sm font-medium">Title</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="e.g., Morning Meditation, Deep Work, Gym..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Frequency"
              icon={<RefreshCw size={14} />}
              value={frequency}
              onChange={setFrequency}
              options={frequencyOptions}
            />
            <CustomSelect
              label="Log Unit"
              icon={<Activity size={14} />}
              value={unit}
              onChange={setUnit}
              options={unitOptions}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Progression Thresholds ({unit === 'rep' ? 'reps' : 'mins'})</label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Zap size={12} className="text-yellow-500" /> 2-Min (Easy)
                </label>
                <input
                  type="number"
                  required
                  value={two_min_threshold}
                  onChange={(e) => setTwoMin(parseInt(e.target.value) || 0)}
                  className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Target size={12} className="text-blue-500" /> Normal
                </label>
                <input
                  type="number"
                  required
                  value={normal_threshold}
                  onChange={(e) => setNormal(parseInt(e.target.value) || 0)}
                  className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Flame size={12} className="text-orange-500" /> Hard
                </label>
                <input
                  type="number"
                  required
                  value={hard_threshold}
                  onChange={(e) => setHard(parseInt(e.target.value) || 0)}
                  className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Trophy size={12} className="text-amber-500" /> Impossible
                </label>
                <input
                  type="number"
                  required
                  value={impossible_threshold}
                  onChange={(e) => setImpossible(parseInt(e.target.value) || 0)}
                  className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
