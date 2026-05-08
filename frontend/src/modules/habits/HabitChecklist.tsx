import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Activity, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trophy,
  Trash2,
  X
} from 'lucide-react';
import { useHabitStore, Habit } from './useHabitStore';
import { clsx } from 'clsx';

type ViewType = 'daily' | 'weekly' | 'monthly';

export const HabitChecklist: React.FC = () => {
  const { habits, fetchHabits, logHabit, createHabit, calculateStreak, deleteHabit } = useHabitStore();
  const [view, setView] = useState<ViewType>('daily');
  const [isAdding, setIsAdding] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    target: 1,
    habit_type: 'reps' as 'reps' | 'timed',
    duration_minutes: 30
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title) return;
    
    const result = await createHabit(newHabit);
    if (result.success) {
      setIsAdding(false);
      setNewHabit({ title: '', frequency: 'daily', target: 1, habit_type: 'reps', duration_minutes: 30 });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this habit? All momentum will be lost.')) {
      await deleteHabit(id);
    }
  };

  const getMilestone = (streak: number) => {
    if (streak >= 100) return { icon: <Trophy className="text-amber-500" size={14} />, label: 'Century' };
    if (streak >= 30) return { icon: <Flame className="text-orange-500" size={14} />, label: 'Monthly' };
    if (streak >= 7) return { icon: <Flame className="text-red-500" size={14} />, label: 'Weekly' };
    return null;
  };

  const filteredHabits = habits.filter(h => h.frequency === view);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Habits</h2>
          <p className="text-muted-foreground">Consistency is the foundation of high performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all uppercase tracking-tighter",
                  view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="bg-card border rounded-xl p-6 shadow-lg animate-in slide-in-from-top-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                  className="w-full bg-muted/50 border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="E.g., Morning Meditiation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Frequency</label>
                <select
                  value={newHabit.frequency}
                  onChange={(e) => setNewHabit({...newHabit, frequency: e.target.value as any})}
                  className="w-full bg-muted/50 border-none rounded-lg px-4 py-2 outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Type</label>
                <div className="flex bg-muted/50 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setNewHabit({...newHabit, habit_type: 'reps'})}
                    className={clsx(
                      "flex-1 py-1 text-xs font-bold rounded",
                      newHabit.habit_type === 'reps' ? "bg-background text-primary" : "text-muted-foreground"
                    )}
                  >
                    REPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewHabit({...newHabit, habit_type: 'timed'})}
                    className={clsx(
                      "flex-1 py-1 text-xs font-bold rounded",
                      newHabit.habit_type === 'timed' ? "bg-background text-primary" : "text-muted-foreground"
                    )}
                  >
                    TIMED
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  {newHabit.habit_type === 'reps' ? 'Target Count' : 'Duration (min)'}
                </label>
                <input
                  type="number"
                  value={newHabit.habit_type === 'reps' ? newHabit.target : newHabit.duration_minutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (newHabit.habit_type === 'reps') {
                      setNewHabit({...newHabit, target: val});
                    } else {
                      setNewHabit({...newHabit, duration_minutes: val});
                    }
                  }}
                  className="w-full bg-muted/50 border-none rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-lg"
                >
                  Save Habit
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHabits.map((habit) => {
          const streak = calculateStreak(habit);
          const milestone = getMilestone(streak);
          const today = new Date().toISOString().split('T')[0];
          const isDoneToday = habit.logs.some(l => l.startsWith(today));

          return (
            <div 
              key={habit.id}
              className={clsx(
                "group relative bg-card border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl",
                isDoneToday ? "border-primary/40 bg-primary/5" : "hover:border-primary/20"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {habit.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    {habit.habit_type === 'timed' ? (
                      <span className="flex items-center gap-1"><Clock size={10} /> {habit.duration_minutes}m</span>
                    ) : (
                      <span className="flex items-center gap-1"><Activity size={10} /> {habit.target}x</span>
                    )}
                    <span>•</span>
                    <span>{habit.frequency}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => logHabit(habit.id)}
                    className={clsx(
                      "p-3 rounded-xl transition-all",
                      isDoneToday 
                        ? "bg-primary text-primary-foreground shadow-inner" 
                        : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                    )}
                  >
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Flame size={16} className={clsx(streak > 0 ? "text-orange-500" : "text-muted-foreground/30")} />
                    <span className="text-xl font-black">{streak}</span>
                  </div>
                  {milestone && (
                    <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                      {milestone.icon}
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{milestone.label}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-[10px] text-muted-foreground font-mono">
                  {habit.logs.length} Total Logs
                </div>
              </div>

              {/* Progress bar visualizer */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-2xl">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: isDoneToday ? '100%' : '0%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {filteredHabits.length === 0 && !isAdding && (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted/50">
          <Activity className="mx-auto text-muted-foreground mb-4 opacity-20" size={48} />
          <h3 className="text-xl font-bold text-muted-foreground">No {view} habits defined</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
            Start small. Define your first {view} commitment to begin building momentum.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold"
          >
            Create Your First Habit
          </button>
        </div>
      )}
    </div>
  );
};
