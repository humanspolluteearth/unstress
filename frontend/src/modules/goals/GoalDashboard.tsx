import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, X, Edit3, Eye, LayoutGrid, BarChart3, CalendarDays, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoalCard } from './GoalCard';

export type GoalType = 'weekly' | 'monthly' | 'yearly';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  description: string;
  is_current_focus: boolean;
  progress: number;
  parentName?: string;
  priority: 'low' | 'med' | 'high';
  category: string;
  deadline: string;
}

const MOCK_GOALS: Goal[] = [
  { 
    id: '1', 
    name: 'Master AI Orchestration', 
    type: 'yearly', 
    description: '# Yearly Goal\nFocus on modular monolith architecture.',
    is_current_focus: true,
    progress: 45,
    priority: 'high',
    category: 'Engineering',
    deadline: '2026-12-31'
  },
  { 
    id: '2', 
    name: 'Optimize Frontend Latency', 
    type: 'monthly', 
    description: '# Monthly Goal\nReduce bundle size by 20%.',
    is_current_focus: false,
    progress: 75,
    priority: 'med',
    category: 'Performance',
    deadline: '2026-06-15',
    parentName: 'Master AI Orchestration'
  },
  { 
    id: '3', 
    name: 'Implement Goal System', 
    type: 'weekly', 
    description: '# Weekly Goal\nComplete backend router and schema.',
    is_current_focus: true,
    progress: 20,
    priority: 'high',
    category: 'Feature',
    deadline: '2026-05-17',
    parentName: 'Optimize Frontend Latency'
  },
];

export const GoalDashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<GoalType | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);

  const filteredGoals = filter === 'all' 
    ? goals 
    : goals.filter(g => g.type === filter);

  const handleToggleFocus = (goalId: string) => {
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
      if (!selectedGoal) return;

      if (e.key === 'Escape') {
        setSelectedGoal(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Force save logic here (currently local state handles it, but in future would hit API)
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
          <h2 className="text-2xl font-bold tracking-tight text-white">Goals</h2>
          <p className="text-white/40 text-sm">Define your north star. Navigate with precision.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black p-1 rounded-none border border-white/10">
            {(['all', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === t ? "bg-white text-black" : "text-white/40 hover:text-white"
                )}
              >
                {t === 'all' && <LayoutGrid size={12} />}
                {t === 'weekly' && <BarChart3 size={12} />}
                {t === 'monthly' && <CalendarDays size={12} />}
                {t === 'yearly' && <Trophy size={12} />}
                <span>{t}</span>
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-none text-xs font-black uppercase tracking-widest shadow-sm hover:bg-white/90 transition-all active:scale-95">
            <Plus size={16} /> Add Goal
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
    </div>
  );
};
