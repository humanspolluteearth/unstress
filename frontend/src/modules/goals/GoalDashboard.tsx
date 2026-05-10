import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, LayoutGrid, BarChart3, CalendarDays, Trophy } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { GoalCreateModal } from './GoalCreateModal';
import { GoalDetailPanel } from '../../components/GoalDetailPanel';
import { GoalService, Goal } from '../../services/GoalService';

export const GoalDashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
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
  }, []);

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
  };

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

      <div className="flex flex-1 min-h-0 overflow-hidden gap-6">
        {/* List Panel */}
        <div className={clsx("flex flex-col transition-all duration-300 ease-in-out", selectedGoal ? "flex-1" : "w-full")}>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className={clsx(
              "grid gap-4 transition-all duration-300",
              selectedGoal ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {filteredGoals.map((goal, index) => (
                <GoalCard 
                  key={goal.id || index}
                  goal={goal}
                  isSelected={selectedGoal?.id === goal.id}
                  onSelect={handleSelectGoal}
                  onUpdate={fetchGoals}
                  onEdit={handleEditGoal}
                />
              ))}
            </div>
            {!isLoading && filteredGoals.length === 0 && (
              <div className="h-64 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-center">
                <Trophy size={48} className="text-white/5" />
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">No goals established in this tier</p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  Establish First Goal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel Injection */}
        <div className={clsx(
          "transition-all duration-300 ease-in-out flex flex-col h-full", 
          selectedGoal ? "w-2/3 opacity-100 border border-white/10" : "w-0 opacity-0 overflow-hidden"
        )}>
          {selectedGoal && (
            <GoalDetailPanel 
              goal={selectedGoal} 
              onClose={() => setSelectedGoal(null)} 
              onUpdate={fetchGoals}
            />
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
