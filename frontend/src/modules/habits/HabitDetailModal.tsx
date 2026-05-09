import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Habit, useHabitStore } from './useHabitStore';

interface HabitDetailModalProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({ habit, isOpen, onClose }) => {
  const { updateHabit } = useHabitStore();
  const [title, setTitle] = useState(habit.title);
  const [frequency, setFrequency] = useState(habit.frequency);
  const [target, setTarget] = useState(habit.target);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateHabit(habit.id, { title, frequency, target });
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-none shadow-lg w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Habit Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-none">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input
              type="text"
              required
              className="w-full bg-background border rounded-none px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Frequency</label>
            <select
              className="w-full bg-background border rounded-none px-3 py-2 text-sm"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Target (times per period)</label>
            <input
              type="number"
              required
              min="1"
              className="w-full bg-background border rounded-none px-3 py-2 text-sm"
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-none border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-none hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
