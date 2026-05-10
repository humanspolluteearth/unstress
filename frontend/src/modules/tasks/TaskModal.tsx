import React, { useState, useEffect } from 'react';
import { useTaskStore, Task } from './useTaskStore';
import { GoalService, Goal } from '../../services/GoalService';
import { X, Tag, Calendar, Link as LinkIcon, AlertCircle, Target } from 'lucide-react';
import { CustomSelect } from '../../core/CustomSelect';
import { clsx } from 'clsx';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task; // If provided, we are in edit mode
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task }) => {
  const { createTask, updateTask } = useTaskStore();
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [tags, setTags] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [goalId, setGoalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchGoals = async () => {
        const result = await GoalService.getGoals();
        if (result.success && result.data) {
          setAvailableGoals(result.data);
        }
      };
      fetchGoals();

      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setTags(task.tags.join(', '));
        setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
        setProjectLink(task.projectLink || '');
        setGoalId(task.goalId || '');
      } else {
        // Reset form for new task
        setTitle('');
        setDescription('');
        setPriority(0);
        setTags('');
        setDeadline('');
        setProjectLink('');
        setGoalId('');
      }
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const taskData = {
      title,
      description: description || undefined,
      priority,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      deadline: deadline || undefined,
      project_link: projectLink || undefined,
      goal_id: goalId || undefined
    };

    let result;
    if (task) {
      result = await updateTask(task.id, taskData);
    } else {
      result = await createTask(taskData);
    }

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || `Failed to ${task ? 'update' : 'create'} task`);
    }
  };

  const priorityOptions = [
    { label: 'Low', value: 0 },
    { label: 'Medium', value: 1 },
    { label: 'High', value: 2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-[#050505] border border-white/10 rounded-none shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
            {task ? 'Modify System Task' : 'Initialize New Task'}
          </h3>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-widest">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Task Title</label>
            <input
              autoFocus required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 p-3 text-sm text-white focus:border-primary outline-none transition-colors"
              placeholder="Operational objective..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 p-3 text-sm text-white min-h-[80px] focus:border-primary outline-none resize-none"
              placeholder="Detailed parameters..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Priority</label>
               <select 
                 value={priority}
                 onChange={(e) => setPriority(Number(e.target.value))}
                 className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 text-xs text-white focus:border-primary outline-none appearance-none"
               >
                 <option value={0}>LOW</option>
                 <option value={1}>MEDIUM</option>
                 <option value={2}>HIGH</option>
               </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 p-2 text-xs text-white focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Link to Goal Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1.5">
              <Target size={10} /> Link to Goal
            </label>
            <select 
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 text-xs text-white focus:border-primary outline-none appearance-none"
            >
              <option value="">NO LINKED GOAL</option>
              {availableGoals.map(g => (
                <option key={g.id} value={g.id}>{g.title.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full bg-white text-black py-3 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-30 shadow-lg"
            >
              {isSubmitting ? 'PROCESSING...' : (task ? 'UPDATE SYSTEM TASK' : 'INITIALIZE TASK')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

