import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, LayoutGrid, BarChart3, CalendarDays, Trophy } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { GoalCreateModal } from './GoalCreateModal';
import { GoalService, Goal } from '../../services/GoalService';
import { useTaskStore } from '../tasks/useTaskStore';

export const GoalDashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { tasks: allTasks, fetchTasks } = useTaskStore();
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const result = await GoalService.getGoals();
      if (result.success && result.data) {
        setGoals(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchTasks();
  }, []);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingGoal(null);
  };

  const filteredGoals = filter === 'all' 
    ? goals 
    : goals.filter(g => g.time_frame === filter);

  const priorityWeight: Record<string, number> = {
    'critical': 0,
    'high': 1,
    'medium': 2,
    'low': 3
  };

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    // Current focus always at top
    if (a.is_current_focus && !b.is_current_focus) return -1;
    if (!a.is_current_focus && b.is_current_focus) return 1;
    
    return (priorityWeight[a.priority] ?? 4) - (priorityWeight[b.priority] ?? 4);
  });

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Goals</h2>
          <p className="text-muted-foreground text-sm">Define your north star. Navigate with precision.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-none border">
            {(['all', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                  filter === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === 'all' && <LayoutGrid size={14} />}
                {t === 'weekly' && <BarChart3 size={14} />}
                {t === 'monthly' && <CalendarDays size={14} />}
                {t === 'yearly' && <Trophy size={14} />}
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} /> Establish Goal
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Grid List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedGoals.map((goal, index) => (
              <GoalCard 
                key={goal.id || index}
                goal={goal}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={fetchGoals}
                onEdit={handleEditGoal}
                availableTasks={allTasks.filter(t => !t.goalId || t.goalId === goal.id)}
              />
            ))}
          </div>
          {!isLoading && sortedGoals.length === 0 && (
            <div className="text-center py-20 bg-muted/20 rounded-none border border-dashed border-muted/50 w-full mt-4">
              <h3 className="text-xl font-bold text-muted-foreground">No {filter === 'all' ? '' : filter} goals established</h3>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                Define your north star. Establish your first {filter === 'all' ? '' : filter} goal to begin your journey.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-none font-bold transition-all active:scale-95"
              >
                Establish First Goal
              </button>
            </div>
          )}
        </div>
      </div>

      <GoalCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={closeCreateModal}
        onSuccess={fetchGoals}
        goal={editingGoal}
      />
    </div>
  );
};
