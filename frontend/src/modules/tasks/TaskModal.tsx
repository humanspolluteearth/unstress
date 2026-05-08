import React, { useState, useEffect } from 'react';
import { useTaskStore, Task } from './useTaskStore';
import { useGoalStore } from '../goals/useGoalStore';
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
  const { goals, fetchGoals } = useGoalStore();
  
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
  }, [isOpen, fetchGoals, task]);

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

  const goalOptions = [
    { label: 'No linked goal', value: '' },
    ...goals.map(g => ({ label: `[${g.tier}] ${g.title}`, value: g.id }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-none shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{task ? 'Edit Task' : 'Add New Task'}</h3>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="What needs to be done?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={priorityOptions}
            />
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

          <CustomSelect
            label="Strategic Goal (Optional)"
            icon={<Target size={14} />}
            value={goalId}
            onChange={setGoalId}
            options={goalOptions}
            placeholder="No linked goal"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Tag size={14} /> Tags (comma separated)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="e.g. work, urgent, hobby"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <LinkIcon size={14} /> Project Link
            </label>
            <input
              type="url"
              value={projectLink}
              onChange={(e) => setProjectLink(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="https://..."
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
              {isSubmitting ? (task ? 'Saving...' : 'Adding...') : (task ? 'Save Changes' : 'Add Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
