import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, BarChart3, Calendar, ListTodo, Tag, AlignLeft } from 'lucide-react';
import { GoalService, Goal } from '../../services/GoalService';
import { CustomSelect } from '../../core/CustomSelect';
import { clsx } from 'clsx';

interface GoalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal | null;
}

export const GoalCreateModal: React.FC<GoalCreateModalProps> = ({ isOpen, onClose, onSuccess, goal }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [deadline, setDeadline] = useState<string>('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setPriority(goal.priority);
      setTimeFrame(goal.time_frame);
      setDeadline(goal.deadline || '');
      setCategory(goal.category);
      setTags(goal.tags.join(', '));
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setTimeFrame('weekly');
      setDeadline('');
      setCategory('General');
      setTags('');
    }
  }, [goal, isOpen]);

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
    if (!title.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
        priority,
        time_frame: timeFrame,
        deadline: deadline || null,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ""),
        links: goal?.links || [],
        references: goal?.references || [],
        tasks: goal ? goal.tasks : [],
        markdown_content: goal?.markdown_content || "",
        label_color: goal?.label_color || "#ffffff",
        assignee_initials: goal?.assignee_initials || "UN"
      };

      let result;
      if (goal) {
        result = await GoalService.updateGoal(goal.id, payload as any);
      } else {
        result = await GoalService.createGoal(payload as any);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Operation failure');
      }
    } catch (err) {
      setError('System network failure');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  const tierOptions = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-none shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <header className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
             <Trophy size={18} className="text-primary" />
             {goal ? 'Modify Objective' : 'Establish New Goal'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-none border border-destructive/20">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Objective Title</label>
            <input
              autoFocus required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Primary mission objective..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Priority"
              icon={<ListTodo size={14} />}
              value={priority}
              onChange={setPriority}
              options={priorityOptions}
            />
            <CustomSelect
              label="Tier"
              icon={<BarChart3 size={14} />}
              value={timeFrame}
              onChange={setTimeFrame}
              options={tierOptions}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <AlignLeft size={14} /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 h-32 resize-none"
              placeholder="Primary mission objective parameters..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Finance, Health, etc."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar size={14} /> Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Tag size={14} /> Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="focus, annual, milestone..."
            />
          </div>
        </form>

        <footer className="p-4 border-t flex justify-end gap-3 bg-muted/10">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-none transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !title.trim()}
            className={clsx(
              "px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-none shadow-sm transition-all hover:bg-primary/90",
              (isSubmitting || !title.trim()) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Processing...' : (goal ? 'Update Objective' : 'Establish Goal')}
          </button>
        </footer>
      </div>
    </div>
  );
};
