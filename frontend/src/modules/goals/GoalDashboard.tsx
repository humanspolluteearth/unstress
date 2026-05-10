import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, X, Edit3, Eye, LayoutGrid, BarChart3, CalendarDays, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoalCard } from './GoalCard';
import { GoalCreateModal } from './GoalCreateModal';
import { GoalDetailPanel } from '../../components/GoalDetailPanel';
import { GoalService, Goal } from '../../services/GoalService';

export const GoalDashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Goals</h2>
          <p className="text-muted-foreground text-sm">Define your north star. Navigate with precision.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} /> Establish Goal
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* List Panel */}
        <div className={clsx("flex flex-col transition-all duration-300 ease-in-out", selectedGoal ? "flex-1" : "w-full")}>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {goals.map((goal, index) => (
              <GoalCard 
                key={goal.id || index}
                goal={goal}
                isSelected={selectedGoal?.id === goal.id}
                onSelect={handleSelectGoal}
              />
            ))}
            {!isLoading && goals.length === 0 && (
              <div className="h-64 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-center">
                <Trophy size={48} className="text-white/5" />
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">No goals established yet</p>
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
          "transition-all duration-300 ease-in-out flex flex-col", 
          selectedGoal ? "w-2/3 opacity-100" : "w-0 opacity-0 overflow-hidden"
        )}>
          {selectedGoal && (
            <GoalDetailPanel 
              goal={selectedGoal} 
              onClose={() => setSelectedGoal(null)} 
            />
          )}
        </div>
      </div>

      <GoalCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchGoals}
      />
    </div>
  );
};
