import React, { useState, useEffect } from 'react';
import { X, Trophy, Plus } from 'lucide-react';
import { ActionService, GoalCreate } from '../../core/ActionService';
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
      console.error('Failed to create goal:', result.error);
    }
    setIsSubmitting(false);
  };

  const handleAddTaskField = () => setInitialTasks([...initialTasks, '']);
  const handleTaskChange = (index: number, val: string) => {
    const updated = [...initialTasks];
    updated[index] = val;
    setInitialTasks(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-white/20 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-white/10 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Create New Goal</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Goal Title</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full bg-black border border-white/10 p-3 text-white outline-none focus:border-primary transition-colors"
              placeholder="What do you want to achieve?"
              required
            />
          </div>

          {/* Type & Parent */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Tier</label>
              <div className="flex bg-black border border-white/10 p-1">
                {(['weekly', 'monthly', 'yearly'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={clsx(
                      "flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all",
                      type === t ? "bg-white text-black" : "text-white/40 hover:text-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Parent Goal (Optional)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-black border border-white/10 p-2.5 text-white text-xs outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="">None</option>
                {existingGoals.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Description (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-white/10 p-3 text-white text-sm outline-none focus:border-primary transition-colors h-24 resize-none"
              placeholder="Detailed objectives..."
            />
          </div>

          {/* Initial Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Initial Tasks</label>
              <button
                type="button"
                onClick={handleAddTaskField}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                + Add Task
              </button>
            </div>
            <div className="space-y-2">
              {initialTasks.map((task, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => handleTaskChange(idx, e.target.value)}
                    className="flex-1 bg-black/50 border border-white/5 p-2 text-xs text-white outline-none focus:border-white/20 transition-colors"
                    placeholder={`Task ${idx + 1}`}
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
                      className="text-white/20 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        <footer className="p-4 border-t border-white/10 bg-black flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !name.trim()}
            className="px-8 py-2 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Establish Goal'}
          </button>
        </footer>
      </div>
    </div>
  );
};
