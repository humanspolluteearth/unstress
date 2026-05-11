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
  const [unit, setUnit] = useState(habit.unit);
  const [two_min, setTwoMin] = useState(habit.two_min_threshold);
  const [normal, setNormal] = useState(habit.normal_threshold);
  const [hard, setHard] = useState(habit.hard_threshold);
  const [impossible, setImpossible] = useState(habit.impossible_threshold);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateHabit(habit.id, { 
      title, 
      frequency, 
      unit,
      two_min_threshold: two_min,
      normal_threshold: normal,
      hard_threshold: hard,
      impossible_threshold: impossible
    });
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
            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Title</label>
            <input
              type="text"
              required
              className="w-full bg-background border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Frequency</label>
              <select
                className="w-full bg-background border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Unit</label>
              <select
                className="w-full bg-background border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
              >
                <option value="rep">Reps</option>
                <option value="min">Minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">2-Min</label>
              <input
                type="number"
                required
                className="w-full bg-background border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={two_min}
                onChange={(e) => setTwoMin(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Normal</label>
              <input
                type="number"
                required
                className="w-full bg-background border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={normal}
                onChange={(e) => setNormal(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Hard</label>
              <input
                type="number"
                required
                className="w-full bg-background border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={hard}
                onChange={(e) => setHard(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Impossible</label>
              <input
                type="number"
                required
                className="w-full bg-background border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={impossible}
                onChange={(e) => setImpossible(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-tighter hover:bg-muted rounded-none border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-tighter rounded-none hover:bg-primary/90 shadow-sm transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
