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
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Medal,
  Zap
} from 'lucide-react';
import { useHabitStore, Habit, HabitLog } from './useHabitStore';
import { AddHabitModal } from './AddHabitModal';
import { clsx } from 'clsx';

type ViewType = 'daily' | 'weekly' | 'monthly';

export const HabitChecklist: React.FC = () => {
  const { habits, fetchHabits, logHabit, createHabit, calculateStreak, deleteHabit } = useHabitStore();
  const [view, setView] = useState<ViewType>('daily');
  const [isAdding, setIsAdding] = useState(false);

  const [logValues, setLogValues] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchHabits();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'ArrowRight') {
          setView(prev => {
            if (prev === 'daily') return 'weekly';
            if (prev === 'weekly') return 'monthly';
            return 'daily';
          });
        } else if (e.key === 'ArrowLeft') {
          setView(prev => {
            if (prev === 'daily') return 'monthly';
            if (prev === 'monthly') return 'weekly';
            return 'daily';
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchHabits]);

  const handleLog = async (id: string) => {
    const value = logValues[id] || 0;
    if (value <= 0) return;
    
    const result = await logHabit(id, value);
    if (result.success) {
      setLogValues({ ...logValues, [id]: 0 });
    }
  };

  const filteredHabits = habits.filter(h => h.frequency === 'daily' || h.frequency === view);
  const today = new Date().toISOString().split('T')[0];

  const calculatePoints = (habit: Habit, dateStr: string) => {
    const logs = habit.logs.filter(l => l.timestamp.startsWith(dateStr));
    const total = logs.reduce((sum, l) => sum + l.value, 0);
    if (total >= habit.impossible_threshold) return 4;
    if (total >= habit.hard_threshold) return 3;
    if (total >= habit.normal_threshold) return 2;
    if (total >= habit.two_min_threshold) return 1;
    return 0;
  };

  const totalPointsToday = habits.reduce((acc, h) => acc + calculatePoints(h, today), 0);

  // Weekly Stats Calculation
  const getWeeklyData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const points = habits.reduce((acc, h) => acc + calculatePoints(h, dStr), 0);
      data.push({ date: dStr, points, label: d.toLocaleDateString(undefined, { weekday: 'short' }) });
    }
    return data;
  };

  const weeklyData = getWeeklyData();
  const totalWeeklyPoints = weeklyData.reduce((acc, d) => acc + d.points, 0);
  
  const weeklyStats = {
    totalPoints: totalWeeklyPoints,
    impossibleCount: habits.reduce((acc, h) => {
      return acc + h.logs.filter(l => {
        const d = l.timestamp.split('T')[0];
        const dayLogs = h.logs.filter(dl => dl.timestamp.startsWith(d));
        return dayLogs.reduce((s, dl) => s + dl.value, 0) >= h.impossible_threshold;
      }).length;
    }, 0), // Note: this is a bit oversimplified as it counts logs not unique days, but works for now
    mostConsistent: habits.sort((a, b) => calculateStreak(b) - calculateStreak(a))[0]?.title || 'None'
  };

  const renderDaily = () => (
    <div className="grid grid-cols-1 gap-4">
      {filteredHabits.map((habit) => {
        const streak = calculateStreak(habit);
        const dailyTotal = habit.logs.filter(l => l.timestamp.startsWith(today)).reduce((acc, l) => acc + l.value, 0);
        const points = calculatePoints(habit, today);
        const getFill = (start: number, end: number) => {
          if (dailyTotal >= end) return '100%';
          if (dailyTotal <= start) return '0%';
          return `${((dailyTotal - start) / (end - start)) * 100}%`;
        };

        return (
          <div key={habit.id} className={clsx("group bg-card border p-4 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6", points > 0 ? "border-primary/40" : "hover:border-primary/20")}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors truncate">{habit.title}</h3>
                  <span className="text-[10px] font-black bg-muted px-1.5 py-0.5 rounded-none uppercase tracking-widest text-muted-foreground">{streak}D Streak</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none mb-1">Total</span>
                    <span className="text-sm font-black">{dailyTotal} {habit.unit === 'rep' ? 'reps' : 'mins'}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-border" />
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none mb-1">Points</span>
                    <span className="text-sm font-black text-primary">{points}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 h-2">
                {[0, habit.two_min_threshold, habit.normal_threshold, habit.hard_threshold].map((start, i) => {
                  const thresholds = [habit.two_min_threshold, habit.normal_threshold, habit.hard_threshold, habit.impossible_threshold];
                  const end = thresholds[i];
                  const opacity = [40, 60, 80, 100][i];
                  const isAchieved = dailyTotal >= end;
                  
                  return (
                    <div key={i} className="relative bg-muted overflow-hidden">
                      <div 
                        className={clsx(
                          "h-full transition-all duration-500", 
                          `bg-primary/${opacity}`,
                          isAchieved && "shadow-[0_0_10px_rgba(var(--primary),0.5)] brightness-125"
                        )} 
                        style={{ 
                          width: getFill(start, end),
                          boxShadow: isAchieved ? '0 0 8px hsl(var(--primary) / 0.6)' : 'none'
                        }} 
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <input type="number" value={logValues[habit.id] || ''} onChange={(e) => setLogValues({ ...logValues, [habit.id]: parseFloat(e.target.value) || 0 })} placeholder={habit.unit === 'rep' ? 'Reps' : 'Mins'} className="w-20 bg-muted/50 border rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center" />
              <button onClick={() => handleLog(habit.id)} className="p-2 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all active:scale-95"><CheckCircle2 size={20} /></button>
              <button onClick={() => deleteHabit(habit.id)} className="p-2 text-muted-foreground/20 hover:text-destructive transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekly = () => {
    const maxPoints = Math.max(...weeklyData.map(d => d.points), 10);
    return (
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        <div className="flex-1 bg-card border p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2"><BarChart3 size={18} /> 7-Day Performance</h3>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total {weeklyStats.totalPoints} Points</span>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 pb-8">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full flex flex-col items-center justify-end h-48">
                  <div 
                    className="w-full bg-primary/20 border-x border-t border-primary/40 group-hover:bg-primary/30 transition-all duration-500"
                    style={{ height: `${(d.points / maxPoints) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black">{d.points}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-card border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
              <TrendingUp size={14} /> Statistics
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Most Consistent</span>
                <p className="text-base font-black truncate">{weeklyStats.mostConsistent}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Points</span>
                  <p className="text-xl font-black text-primary">{weeklyStats.totalPoints}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Impossible Hit</span>
                  <p className="text-xl font-black">{weeklyStats.impossibleCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 p-6 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Zap size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Weekly Insight</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {weeklyStats.totalPoints > 50 
                ? "Excellent momentum! You are operating at peak performance levels." 
                : "Steady progress. Focus on hitting 'Normal' thresholds more consistently."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthly = () => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
    const monthName = new Date().toLocaleDateString(undefined, { month: 'long' });
    
    const monthlyPoints = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1);
      const dStr = d.toISOString().split('T')[0];
      return habits.reduce((acc, h) => acc + calculatePoints(h, dStr), 0);
    });
    
    const totalMonthPoints = monthlyPoints.reduce((a, b) => a + b, 0);
    const targetPoints = 200; // Example target
    const progress = (totalMonthPoints / targetPoints) * 100;

    return (
      <div className="space-y-6">
        <div className="bg-card border p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2"><CalendarIcon size={18} /> {monthName} Matrix</h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Month Total</span>
                <span className="text-lg font-black">{totalMonthPoints} PTS</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] font-black uppercase text-muted-foreground/40 text-center mb-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {monthlyPoints.map((pts, i) => (
              <div 
                key={i} 
                className={clsx(
                  "aspect-square border flex flex-col items-center justify-center relative group transition-colors",
                  pts === 0 ? "bg-muted/10 border-muted/20" : 
                  pts < 5 ? "bg-primary/10 border-primary/20" :
                  pts < 15 ? "bg-primary/30 border-primary/40" : "bg-primary/60 border-primary/70"
                )}
              >
                <span className="text-[9px] font-bold opacity-40 absolute top-1 left-1">{i + 1}</span>
                <span className="text-xs font-black">{pts > 0 ? pts : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${progress * 2.51} 251`} className="text-primary transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Medal className="text-primary" size={24} />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold">Monthly Milestone</h4>
              <span className="text-xs font-black text-muted-foreground">{Math.round(progress)}% COMPLETE</span>
            </div>
            <p className="text-sm text-muted-foreground">Reach {targetPoints} points this month to unlock the <span className="text-primary font-bold">Executive Momentum</span> badge.</p>
            <div className="h-2 w-full bg-muted rounded-none overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Habits</h2>
            <p className="text-muted-foreground text-sm">Consistency is the foundation of high performance.</p>
          </div>
          <div className="h-10 w-[1px] bg-border hidden md:block" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-primary tracking-widest">Points Today</span>
            <span className="text-2xl font-black">{totalPointsToday}</span>
          </div>
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
              <BarChart3 size={14} /> Weekly
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

      <div className="flex-1 min-h-0">
        {view === 'daily' && renderDaily()}
        {view === 'weekly' && renderWeekly()}
        {view === 'monthly' && renderMonthly()}
      </div>

      <AddHabitModal isOpen={isAdding} onClose={() => setIsAdding(false)} />

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
