import React, { useState, useEffect } from 'react';
import { X, Trophy, Target, LayoutGrid, BarChart3, CalendarDays, AlertCircle, Plus } from 'lucide-react';
import { ActionService, GoalCreate } from '../../core/ActionService';
import { CustomSelect } from '../../core/CustomSelect';
import { clsx } from 'clsx';

interface GoalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (goal: any) => void;
  existingGoals: { id: string, name: string }[];
}

export const GoalCreateModal: React.FC<GoalCreateModalProps> = ({ isOpen, onClose, onSuccess, existingGoals }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [initialTasks, setInitialTasks] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);
    const data: GoalCreate = {
      name,
      type,
      description,
      parent_id: parentId || undefined,
    };

    const result = await ActionService.createGoal(data);
    if (result.success) {
      // Create initial tasks if any
      const createdGoal = result.data;
      for (const taskTitle of initialTasks) {
        if (taskTitle.trim()) {
          await ActionService.createTask({
            title: taskTitle.trim(),
            goal_id: createdGoal.id,
          });
        }
      }
      onSuccess(createdGoal);
      onClose();
      // Reset state
      setName('');
      setType('weekly');
      setParentId('');
      setDescription('');
      setInitialTasks(['']);
    } else {
      setError(result.error || 'Failed to create goal');
    }
    setIsSubmitting(false);
  };

  const handleAddTaskField = () => setInitialTasks([...initialTasks, '']);
  const handleTaskChange = (index: number, val: string) => {
    const updated = [...initialTasks];
    updated[index] = val;
    setInitialTasks(updated);
  };

  const tierOptions = [
    { label: 'Weekly', value: 'weekly', icon: <BarChart3 size={14} /> },
    { label: 'Monthly', value: 'monthly', icon: <CalendarDays size={14} /> },
    { label: 'Yearly', value: 'yearly', icon: <Trophy size={14} /> },
  ];

  const goalOptions = [
    { label: 'No parent goal', value: '' },
    ...existingGoals.map(g => ({ label: g.name, value: g.id }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-none shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
             <Trophy size={18} className="text-primary" />
             Establish New Goal
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-none border border-destructive/20">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Title</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="What is your north star?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Tier"
              value={type}
              onChange={setType}
              options={tierOptions}
            />
            <CustomSelect
              label="Parent Goal (Optional)"
              icon={<Target size={14} />}
              value={parentId}
              onChange={setParentId}
              options={goalOptions}
              placeholder="No parent goal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              placeholder="Detailed objectives and success criteria..."
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Initial Action Items</label>
              <button
                type="button"
                onClick={handleAddTaskField}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <Plus size={10} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {initialTasks.map((task, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => handleTaskChange(idx, e.target.value)}
                    className="flex-1 bg-muted/30 border border-border/50 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder={`Action ${idx + 1}...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  {initialTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInitialTasks(initialTasks.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={clsx(
                "px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-none shadow-sm transition-all hover:bg-primary/90",
                (isSubmitting || !name.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? 'Establishing...' : 'Establish Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
