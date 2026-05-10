import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, BarChart3, CalendarDays, Calendar, Palette, User } from 'lucide-react';
import { GoalService, Goal } from '../../services/GoalService';
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
  const [markdownContent, setMarkdownContent] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [category, setCategory] = useState('General');
  const [labelColor, setLabelColor] = useState('#ffffff');
  const [assigneeInitials, setAssigneeInitials] = useState('UN');
  const [tags, setTags] = useState<string>('');
  const [links, setLinks] = useState<string[]>(['']);
  const [references, setReferences] = useState<string[]>(['']);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setMarkdownContent(goal.markdown_content || '');
      setPriority(goal.priority);
      setTimeFrame(goal.time_frame);
      setCategory(goal.category);
      setLabelColor(goal.label_color);
      setAssigneeInitials(goal.assignee_initials);
      setTags(goal.tags.join(', '));
      setLinks(goal.links.length > 0 ? goal.links : ['']);
      setReferences(goal.references.length > 0 ? goal.references : ['']);
    } else {
      setTitle('');
      setDescription('');
      setMarkdownContent('');
      setPriority('medium');
      setTimeFrame('weekly');
      setCategory('General');
      setLabelColor('#ffffff');
      setAssigneeInitials('UN');
      setTags('');
      setLinks(['']);
      setReferences(['']);
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
        markdown_content: markdownContent,
        priority,
        time_frame: timeFrame,
        category,
        label_color: labelColor,
        assignee_initials: assigneeInitials,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ""),
        links: links.filter(l => l.trim() !== "").map(l => l.trim()),
        references: references.filter(r => r.trim() !== "").map(r => r.trim()),
        tasks: goal ? goal.tasks : []
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#050505] border border-white/10 w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 text-white">
             <Trophy size={14} className="text-primary" />
             {goal ? 'Modify Objective' : 'Establish New Goal'}
          </h3>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-white">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-widest">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Title</label>
            <input
              autoFocus required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-3 text-sm text-white focus:border-primary outline-none transition-colors"
              placeholder="Primary objective..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Tier</label>
              <div className="flex bg-white/5 p-1 border border-white/5">
                {(['weekly', 'monthly', 'yearly'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeFrame(t)}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all",
                      timeFrame === t ? "bg-white text-black" : "text-white/40 hover:text-white"
                    )}
                  >
                    {t === 'weekly' && <BarChart3 size={10} />}
                    {t === 'monthly' && <CalendarDays size={10} />}
                    {t === 'yearly' && <Trophy size={10} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Priority</label>
              <select 
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-white/5 border border-white/5 p-2.5 text-sm text-white focus:border-primary outline-none appearance-none"
              >
                <option value="critical">CRITICAL</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                <Palette size={10} /> Label Color
              </label>
              <input
                type="color"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                className="w-full h-10 bg-white/5 border border-white/5 p-1 cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                <User size={10} /> Assignee Initials
              </label>
              <input
                maxLength={2}
                value={assigneeInitials}
                onChange={(e) => setAssigneeInitials(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/5 p-2.5 text-sm text-white focus:border-primary outline-none text-center"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Brief Description (Card Preview)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-3 text-sm text-white focus:border-primary outline-none transition-colors"
              placeholder="Short summary for the card..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Detailed Intelligence (Markdown Panel)</label>
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-3 text-sm text-white h-32 focus:border-primary outline-none resize-none"
              placeholder="Detailed brief for the side panel..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/5 p-2.5 text-sm text-white focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Tags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-white/5 border border-white/5 p-2.5 text-sm text-white focus:border-primary outline-none"
                placeholder="focus, health, arch..."
              />
            </div>
          </div>
        </form>

        <footer className="p-4 border-t border-white/5 flex justify-end gap-4 bg-black/20">
          <button onClick={onClose} className="text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">Cancel</button>
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !title.trim()}
            className="bg-white text-black px-8 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Establishing...' : 'Establish Goal'}
          </button>
        </footer>
      </div>
    </div>
  );
};
