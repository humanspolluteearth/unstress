import React, { useState, useEffect } from 'react';
import { X, Trophy, Target, AlertCircle, Plus } from 'lucide-react';
import { GoalService } from '../../services/GoalService';
import { clsx } from 'clsx';

interface GoalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoalCreateModal: React.FC<GoalCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState<string>('');
  const [links, setLinks] = useState<string[]>(['']);
  const [references, setReferences] = useState<string[]>(['']);
  const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  
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
    if (!title.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
        priority,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ""),
        links: links.filter(l => l.trim() !== "").map(l => l.trim()),
        references: references.filter(r => r.trim() !== "").map(r => r.trim()),
        tasks: tasks
      };

      const result = await GoalService.createGoal(payload as any);
      if (result.success) {
        onSuccess();
        onClose();
        // Reset
        setTitle('');
        setDescription('');
        setPriority('medium');
        setCategory('General');
        setTags('');
        setLinks(['']);
        setReferences(['']);
        setTasks([]);
      } else {
        setError(result.error || 'Establishment failure');
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
          <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
             <Trophy size={14} className="text-primary" />
             Establish New Goal
          </h3>
          <button onClick={onClose} className="text-white/20 hover:text-white"><X size={18} /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
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
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Priority</label>
              <select 
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-white/5 border border-white/5 p-2.5 text-sm text-white focus:border-primary outline-none"
              >
                <option value="critical">CRITICAL</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/5 p-2.5 text-sm text-white focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Description (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-3 text-sm text-white h-24 focus:border-primary outline-none resize-none"
              placeholder="Detailed brief..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Mission Links</label>
            {links.map((link, idx) => (
              <input
                key={idx}
                value={link}
                onChange={(e) => {
                  const newLinks = [...links];
                  newLinks[idx] = e.target.value;
                  setLinks(newLinks);
                }}
                className="w-full bg-white/5 border border-white/5 p-2 text-[11px] text-white focus:border-primary outline-none"
                placeholder="https://..."
              />
            ))}
            <button 
              type="button" 
              onClick={() => setLinks([...links, ''])}
              className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              + Add Link
            </button>
          </div>
        </form>

        <footer className="p-4 border-t border-white/5 flex justify-end gap-4">
          <button onClick={onClose} className="text-[10px] font-black uppercase text-white/20 hover:text-white">Cancel</button>
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !title.trim()}
            className="bg-white text-black px-8 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all disabled:opacity-30"
          >
            {isSubmitting ? 'Establishing...' : 'Establish Goal'}
          </button>
        </footer>
      </div>
    </div>
  );
};
