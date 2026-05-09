import React, { useState, useEffect, useRef } from 'react';
import { useScheduleStore, TimeBlock } from './useScheduleStore';
import { X, Calendar, Clock, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { CustomSelect } from '../../core/CustomSelect';
import { clsx } from 'clsx';

interface EventEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: TimeBlock | null;
}

export const EventEditorModal: React.FC<EventEditorModalProps> = ({ isOpen, onClose, block }) => {
  const { updateBlock, deleteBlock } = useScheduleStore();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [repeat, setRepeat] = useState<'Daily' | 'Weekly' | 'Monthly' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (block && isOpen) {
      setTitle(block.title);
      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      
      setDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndTime(end.toTimeString().slice(0, 5));
      setRepeat(block.repeat_pattern || '');
      setIsEditing(true);
    }
  }, [block, isOpen]);

  useEffect(() => {
    const handleCommandBarClosed = () => {
      if (isOpen && isEditing) {
        // Restore focus to title if command bar closed and we are still editing
        formRef.current?.querySelector('input')?.focus();
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && isEditing) {
        handleCancel();
      }
    };

    window.addEventListener('command-bar-closed', handleCommandBarClosed);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('command-bar-closed', handleCommandBarClosed);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isEditing]);

  if (!isOpen || !block) return null;

  const handleCancel = () => {
    setIsEditing(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      if (end <= start) {
        setError('End time must be after start time.');
        setIsSubmitting(false);
        return;
      }

      const result = await updateBlock(block.id, {
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        repeat_pattern: repeat || null
      });

      if (result.success) {
        setIsEditing(false);
        onClose();
      } else {
        setError(result.error || 'Failed to update event');
      }
    } catch (err) {
      console.error({ success: false, error: 'MODAL_STATE_INTERRUPTED', details: err });
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event?')) {
      const result = await deleteBlock(block.id);
      if (result.success) {
        setIsEditing(false);
        onClose();
      } else {
        setError(result.error || 'Failed to delete event');
      }
    }
  };

  const repeatOptions = [
    { label: 'One-time', value: '' },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        // Close modal only if clicking the backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-card border rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Event</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDelete}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete Event"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-4">
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
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Calendar size={14} /> Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Clock size={14} /> Start
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Clock size={14} /> End
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <CustomSelect
            label="Repeat"
            icon={<RefreshCw size={14} />}
            value={repeat}
            onChange={(val: any) => setRepeat(val)}
            options={repeatOptions}
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
