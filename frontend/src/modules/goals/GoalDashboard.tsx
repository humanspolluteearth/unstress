import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, X, Edit3, Eye, LayoutGrid, BarChart3, CalendarDays, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoalCard } from './GoalCard';
import { GoalCreateModal } from './GoalCreateModal';

export type GoalType = 'weekly' | 'monthly' | 'yearly';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  description: string;
  is_current_focus: boolean;
  progress: number;
  parent_id?: string;
  parentName?: string;
  priority?: 'low' | 'med' | 'high';
  category?: string;
  deadline?: string;
}

export const GoalDashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<GoalType | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchGoals = async () => {
    try {
      const port = (window as any).__BACKEND_PORT__ || 8000;
      const response = await fetch(`http://localhost:${port}/goals/`);
      const result = await response.json();
      if (result.success) {
        setGoals(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const filteredGoals = filter === 'all' 
    ? goals 
    : goals.filter(g => g.type === filter);

  const handleToggleFocus = (goalId: string) => {
    // In a real app, this would hit the API
    setGoals(prev => {
      const targetGoal = prev.find(g => g.id === goalId);
      if (!targetGoal) return prev;
      
      return prev.map(g => {
        if (g.type === targetGoal.type) {
          return { ...g, is_current_focus: g.id === goalId ? !g.is_current_focus : false };
        }
        return g;
      });
    });
  };

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsEditing(false);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedGoal) {
          setSelectedGoal(null);
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's' && selectedGoal) {
        e.preventDefault();
        // Force save logic here
        setIsEditing(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [selectedGoal]);

  const handleUpdateDescription = (val: string) => {
    if (!selectedGoal) return;
    const updated = { ...selectedGoal, description: val };
    setSelectedGoal(updated);
    setGoals(prev => prev.map(g => g.id === selectedGoal.id ? updated : g));
  };

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
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all uppercase tracking-wider",
                  filter === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === 'all' && <LayoutGrid size={14} />}
                {t === 'weekly' && <BarChart3 size={14} />}
                {t === 'monthly' && <CalendarDays size={14} />}
                {t === 'yearly' && <Trophy size={14} />}
                <span>{t}</span>
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
        {/* List Panel */}
        <div className={clsx("flex flex-col transition-all duration-300 ease-in-out", selectedGoal ? "flex-1" : "w-full")}>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredGoals.map((goal) => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                isSelected={selectedGoal?.id === goal.id}
                onSelect={handleSelectGoal}
                onToggleFocus={handleToggleFocus}
              />
            ))}
            {filteredGoals.length === 0 && (
              <div className="h-64 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
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

        {/* Markdown Editor Panel */}
        <div className={clsx("bg-black transition-all duration-300 ease-in-out flex flex-col", selectedGoal ? "w-1/3 border border-white/20 ml-6 opacity-100 shadow-2xl" : "w-0 opacity-0 overflow-hidden border-0 ml-0")}>
          {selectedGoal && (
            <>
              <header className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Goal Workspace</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(!isEditing)} className="text-white/40 hover:text-white p-1 transition-colors">
                    {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
                  </button>
                  <button onClick={() => setSelectedGoal(null)} className="text-white/40 hover:text-white p-1 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </header>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6 pb-6 border-b border-white/5">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] block mb-1">{selectedGoal.type}</span>
                  <h2 className="text-2xl font-black text-white tracking-tighter">{selectedGoal.name}</h2>
                </div>

                {isEditing ? (
                  <textarea
                    autoFocus
                    readOnly={false}
                    value={selectedGoal.description}
                    onChange={(e) => handleUpdateDescription(e.target.value)}
                    className="w-full h-[calc(100%-100px)] bg-transparent border-none outline-none resize-none font-mono text-sm text-white/80 leading-relaxed"
                    placeholder="Enter goal details using Markdown..."
                  />
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/60 prose-strong:text-white prose-code:text-primary">
                    <ReactMarkdown>{selectedGoal.description}</ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <GoalCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchGoals()}
        existingGoals={goals.map(g => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
};

