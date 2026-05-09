import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2,
  X,
  LayoutGrid,
  List,
  CalendarDays,
  Target,
  Trophy,
  Activity,
  CheckCircle2
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
    frequency: 'daily' as ViewType,
    unit: 'rep' as 'rep' | 'min',
    two_min_threshold: 1,
    normal_threshold: 5,
    hard_threshold: 10,
    impossible_threshold: 20
  });

  const [logValues, setLogValues] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title) return;
    
    const result = await createHabit(newHabit);
    if (result.success) {
      setIsAdding(false);
      setNewHabit({ 
        title: '', 
        frequency: 'daily', 
        unit: 'rep', 
        two_min_threshold: 1,
        normal_threshold: 5,
        hard_threshold: 10,
        impossible_threshold: 20
      });
    }
  };

  const handleLog = async (id: string) => {
    const value = logValues[id] || 0;
    if (value <= 0) return;
    
    const result = await logHabit(id, value);
    if (result.success) {
      setLogValues({ ...logValues, [id]: 0 });
    }
  };

  const filteredHabits = habits.filter(h => h.frequency === view);

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Habits</h2>
          <p className="text-muted-foreground text-sm">Consistency is the foundation of high performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-none border">
            <button
              onClick={() => setView('daily')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                view === 'daily' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid size={14} /> Daily
            </button>
            <button
              onClick={() => setView('weekly')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                view === 'weekly' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={14} /> Weekly
            </button>
            <button
              onClick={() => setView('monthly')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                view === 'monthly' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays size={14} /> Monthly
            </button>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Habit
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="bg-card border rounded-none p-6 shadow-lg animate-in slide-in-from-top-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Title</label>
                <input
                  type="text"
                  required
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                  className="w-full bg-muted/50 border rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Habit Name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Frequency</label>
                <select
                  value={newHabit.frequency}
                  onChange={(e) => setNewHabit({...newHabit, frequency: e.target.value as any})}
                  className="w-full bg-muted/50 border rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Unit</label>
                <select
                  value={newHabit.unit}
                  onChange={(e) => setNewHabit({...newHabit, unit: e.target.value as any})}
                  className="w-full bg-muted/50 border rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="rep">Reps</option>
                  <option value="min">Minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">2-Min</label>
                <input
                  type="number"
                  required
                  value={newHabit.two_min_threshold}
                  onChange={(e) => setNewHabit({...newHabit, two_min_threshold: parseInt(e.target.value) || 0})}
                  className="w-full bg-muted/50 border rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Normal</label>
                <input
                  type="number"
                  required
                  value={newHabit.normal_threshold}
                  onChange={(e) => setNewHabit({...newHabit, normal_threshold: parseInt(e.target.value) || 0})}
                  className="w-full bg-muted/50 border rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Hard</label>
                <input
                  type="number"
                  required
                  value={newHabit.hard_threshold}
                  onChange={(e) => setNewHabit({...newHabit, hard_threshold: parseInt(e.target.value) || 0})}
                  className="w-full bg-muted/50 border rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Impossible</label>
                <input
                  type="number"
                  required
                  value={newHabit.impossible_threshold}
                  onChange={(e) => setNewHabit({...newHabit, impossible_threshold: parseInt(e.target.value) || 0})}
                  className="w-full bg-muted/50 border rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-tighter hover:bg-muted border border-transparent transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-tighter shadow-sm hover:bg-primary/90 transition-all"
              >
                Save Habit
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHabits.map((habit) => {
          const streak = calculateStreak(habit);
          const today = new Date().toISOString().split('T')[0];
          const dailyLogs = habit.logs.filter(l => l.timestamp.startsWith(today));
          const dailyTotal = dailyLogs.reduce((acc, l) => acc + l.value, 0);

          let points = 0;
          if (dailyTotal >= habit.impossible_threshold) points = 4;
          else if (dailyTotal >= habit.hard_threshold) points = 3;
          else if (dailyTotal >= habit.normal_threshold) points = 2;
          else if (dailyTotal >= habit.two_min_threshold) points = 1;

          return (
            <div 
              key={habit.id}
              className={clsx(
                "group relative bg-card border p-6 transition-all duration-300",
                points > 0 ? "border-primary/40 bg-primary/5" : "hover:border-primary/20"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {habit.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    <span>{habit.unit === 'rep' ? 'Reps' : 'Mins'}</span>
                    <span>•</span>
                    <span>{habit.frequency}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={logValues[habit.id] || ''}
                    onChange={(e) => setLogValues({ ...logValues, [habit.id]: parseFloat(e.target.value) || 0 })}
                    placeholder={`Enter ${habit.unit === 'rep' ? 'reps' : 'mins'}`}
                    className="flex-1 bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => handleLog(habit.id)}
                    className="p-2 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[8px] font-bold uppercase tracking-tighter text-center">
                  <div className={clsx("p-1 border", dailyTotal >= habit.two_min_threshold ? "bg-primary/20 border-primary/40 text-primary" : "text-muted-foreground/40")}>2m</div>
                  <div className={clsx("p-1 border", dailyTotal >= habit.normal_threshold ? "bg-primary/20 border-primary/40 text-primary" : "text-muted-foreground/40")}>Norm</div>
                  <div className={clsx("p-1 border", dailyTotal >= habit.hard_threshold ? "bg-primary/20 border-primary/40 text-primary" : "text-muted-foreground/40")}>Hard</div>
                  <div className={clsx("p-1 border", dailyTotal >= habit.impossible_threshold ? "bg-primary/20 border-primary/40 text-primary" : "text-muted-foreground/40")}>Imp</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-black">{streak}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-black text-primary">{points}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Points</span>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {dailyTotal} Total Today
                </div>
              </div>

              {/* Progress bar visualizer */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${Math.min((dailyTotal / habit.normal_threshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {filteredHabits.length === 0 && !isAdding && (
        <div className="text-center py-20 bg-muted/20 rounded-none border border-dashed border-muted/50">
          <h3 className="text-xl font-bold text-muted-foreground">No {view} habits defined</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
            Start small. Define your first {view} commitment to begin building momentum.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-none font-bold"
          >
            Create Your First Habit
          </button>
        </div>
      )}
    </div>
  );
};
