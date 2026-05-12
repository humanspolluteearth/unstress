import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus,
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
  const { habits, fetchHabits, logHabit, createHabit, calculateStreak, deleteHabit, weeklyInsight, setWeeklyInsight } = useHabitStore();
  const [view, setView] = useState<ViewType>('daily');
  const [isAdding, setIsAdding] = useState(false);
  const [logValues, setLogValues] = useState<Record<string, number>>({});
  const [isEditingInsight, setIsEditingInsight] = useState(false);
  const [insightValue, setInsightValue] = useState(weeklyInsight);

  useEffect(() => {
    setInsightValue(weeklyInsight);
  }, [weeklyInsight]);

  const handleInsightSave = () => {
    setWeeklyInsight(insightValue);
    setIsEditingInsight(false);
  };

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

  const handleLog = async (id: string, multiplier: number = 1) => {
    const inputValue = logValues[id];
    const amount = (inputValue !== undefined && inputValue !== 0) ? inputValue : 1;
    const value = amount * multiplier;

    if (value === 0) return;

    const result = await logHabit(id, value);
    if (result.success) {
      setLogValues({ ...logValues, [id]: 0 });
    }
  };
  const filteredHabits = habits.filter(h => h.frequency === 'daily' || h.frequency === view);
  const today = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD

  const calculatePoints = (habit: Habit, dateStr: string) => {
    const logs = habit.logs.filter(l => l.timestamp.startsWith(dateStr));
    const total = logs.reduce((sum, l) => sum + l.value, 0);
    
    if (habit.habit_type === 'binary' || habit.unit === 'check') {
      return total > 0 ? 1 : 0;
    }

    if (total >= habit.impossible_threshold) return 4;
    if (total >= habit.hard_threshold) return 3;
    if (total >= habit.normal_threshold) return 2;
    if (total >= habit.two_min_threshold) return 1;
    return 0;
  };

  // Weekly Stats Calculation
  const getWeeklyData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toLocaleDateString('en-CA');
      const score = habits.reduce((acc, h) => acc + calculatePoints(h, dStr), 0);
      data.push({ date: dStr, score, label: d.toLocaleDateString(undefined, { weekday: 'short' }) });
    }
    return data;
  };

  const weeklyData = getWeeklyData();
  const totalWeeklyScore = weeklyData.reduce((acc, d) => acc + d.score, 0);
  
  const weeklyStats = {
    totalScore: totalWeeklyScore,
    impossibleCount: habits.reduce((acc, h) => {
      return acc + h.logs.filter(l => {
        const d = l.timestamp.split('T')[0];
        const dayLogs = h.logs.filter(dl => dl.timestamp.startsWith(d));
        return dayLogs.reduce((s, dl) => s + dl.value, 0) >= h.impossible_threshold;
      }).length;
    }, 0), 
    mostConsistent: habits.sort((a, b) => calculateStreak(b) - calculateStreak(a))[0]?.name || 'None'
  };

  const renderDaily = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredHabits.map((habit) => {
        const streak = calculateStreak(habit);
        const dailyTotal = habit.logs.filter(l => l.timestamp.startsWith(today)).reduce((acc, l) => acc + l.value, 0);
        const active = calculatePoints(habit, today) > 0;
        const isBinary = habit.habit_type === 'binary' || habit.unit === 'check';

        return (
          <div key={habit.id} className={clsx("group bg-card border p-5 transition-all duration-300 flex flex-col gap-5", active ? "border-primary/40" : "hover:border-primary/20 shadow-sm")}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors truncate pr-2">{habit.name}</h3>
                <span className="text-[9px] font-black bg-muted px-1.5 py-0.5 rounded-none uppercase tracking-widest text-muted-foreground shrink-0">{streak}D Streak</span>
              </div>
              
              {!isBinary ? (
                <div className="grid grid-cols-4 gap-1 h-1.5">
                  {[
                    { s: 0, e: habit.two_min_threshold, i: 0 },
                    { s: habit.two_min_threshold, e: habit.normal_threshold, i: 1 },
                    { s: habit.normal_threshold, e: habit.hard_threshold, i: 2 },
                    { s: habit.hard_threshold, e: habit.impossible_threshold, i: 3 },
                  ].map((range) => {
                    const isAchieved = dailyTotal >= range.e;
                    const isFilling = dailyTotal > range.s && dailyTotal < range.e;
                    const fillWidth = isAchieved ? '100%' : isFilling ? `${((dailyTotal - range.s) / (range.e - range.s)) * 100}%` : '0%';
                    
                    return (
                      <div key={range.i} className="relative bg-muted overflow-hidden h-full">
                        <div 
                          className="h-full transition-all duration-500 bg-primary" 
                          style={{ width: fillWidth }} 
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-muted overflow-hidden h-1.5 w-full">
                  <div 
                    className="h-full transition-all duration-500 bg-primary" 
                    style={{ width: dailyTotal > 0 ? '100%' : '0%' }} 
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block leading-none mb-1">Status</span>
                  <span className="text-sm font-black transition-all duration-300">
                    {isBinary ? (dailyTotal > 0 ? 'Complete' : 'Incomplete') : `${dailyTotal} ${habit.unit}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {isBinary ? (
                    <button 
                      onClick={() => handleLog(habit.id, dailyTotal > 0 ? -1 : 1)}
                      className={clsx(
                        "p-1.5 border transition-all rounded-none",
                        dailyTotal > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-white/5 hover:border-primary/50"
                      )}
                      title={dailyTotal > 0 ? "Mark as Incomplete" : "Mark as Complete"}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleLog(habit.id, -1)}
                        className="p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors bg-muted/20 border border-white/5"
                        title="Subtract progress"
                      >
                        <Minus size={12} />
                      </button>
                      <input 
                        type="number" 
                        value={logValues[habit.id] || ''} 
                        onChange={(e) => setLogValues({ ...logValues, [habit.id]: parseFloat(e.target.value) || 0 })} 
                        onKeyDown={(e) => e.key === 'Enter' && handleLog(habit.id)}
                        placeholder="1" 
                        className="w-10 bg-muted/30 border border-white/5 rounded-none px-1 py-1 text-xs focus:outline-none focus:border-primary text-center appearance-none font-mono" 
                      />
                      <button 
                        onClick={() => handleLog(habit.id, 1)}
                        className="p-1.5 text-muted-foreground/40 hover:text-primary transition-colors bg-muted/20 border border-white/5"
                        title="Add progress"
                      >
                        <Plus size={12} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this habit? All progress logs will be permanently removed.')) {
                        deleteHabit(habit.id);
                      }
                    }} 
                    className="ml-1 p-1.5 text-muted-foreground/20 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekly = () => {
    const maxScore = Math.max(...weeklyData.map(d => d.score), 10);
    return (
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        <div className="flex-1 bg-card border p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2"><BarChart3 size={18} /> 7-Day Performance</h3>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Aggregate Score: {weeklyStats.totalScore}</span>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 pb-8">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full flex flex-col items-center justify-end h-48">
                  <div 
                    className="w-full bg-primary/20 border-x border-t border-primary/40 group-hover:bg-primary/30 transition-all duration-500"
                    style={{ height: `${(d.score / maxScore) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black">{d.score}</div>
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Score</span>
                  <p className="text-xl font-black text-primary">{weeklyStats.totalScore}</p>
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
            {isEditingInsight ? (
              <textarea
                value={insightValue}
                onChange={(e) => setInsightValue(e.target.value)}
                onBlur={handleInsightSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInsightSave();
                  }
                  if (e.key === 'Escape') {
                    setIsEditingInsight(false);
                    setInsightValue(weeklyInsight);
                  }
                }}
                autoFocus
                className="w-full bg-transparent border-none outline-none text-xs text-muted-foreground leading-relaxed resize-none h-24 font-sans"
              />
            ) : (
              <p 
                onClick={() => setIsEditingInsight(true)}
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground transition-colors"
              >
                {weeklyInsight}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthly = () => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const monthName = now.toLocaleDateString(undefined, { month: 'long' });
    
    const monthlyScore = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const dStr = d.toLocaleDateString('en-CA');
      return habits.reduce((acc, h) => acc + calculatePoints(h, dStr), 0);
    });
    
    const totalMonthScore = monthlyScore.reduce((a, b) => a + b, 0);
    const targetScore = 200; // Example target
    const progress = (totalMonthScore / targetScore) * 100;

    return (
      <div className="space-y-6">
        <div className="bg-card border p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2"><CalendarIcon size={18} /> {monthName} Matrix</h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Monthly Aggregate</span>
                <span className="text-lg font-black">{totalMonthScore}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] font-black uppercase text-muted-foreground/40 text-center mb-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {monthlyScore.map((score, i) => (
              <div 
                key={i} 
                className={clsx(
                  "aspect-square border flex flex-col items-center justify-center relative group transition-colors",
                  score === 0 ? "bg-muted/10 border-muted/20" : 
                  score < 5 ? "bg-primary/10 border-primary/20" :
                  score < 15 ? "bg-primary/30 border-primary/40" : "bg-primary/60 border-primary/70"
                )}
              >
                <span className="text-[9px] font-bold opacity-40 absolute top-1 left-1">{i + 1}</span>
                <span className="text-xs font-black">{score > 0 ? score : ''}</span>
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
            <p className="text-sm text-muted-foreground">Reach {targetScore} score units this month to unlock the <span className="text-primary font-bold">Executive Momentum</span> badge.</p>
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

      {view === 'daily' && filteredHabits.length === 0 && !isAdding && (
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
