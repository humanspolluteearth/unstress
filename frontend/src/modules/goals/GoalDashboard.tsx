import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, X, ChevronRight, Edit3, Eye, LayoutGrid, BarChart3, CalendarDays, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export type GoalType = 'weekly' | 'monthly' | 'yearly';

interface Goal {
  id: string;
  name: string;
  type: GoalType;
  description: string;
}

const MOCK_GOALS: Goal[] = [
  { id: '1', name: 'Master AI Orchestration', type: 'yearly', description: '# Yearly Goal\nFocus on modular monolith architecture.' },
  { id: '2', name: 'Optimize Frontend Latency', type: 'monthly', description: '# Monthly Goal\nReduce bundle size by 20%.' },
  { id: '3', name: 'Implement Goal System', type: 'weekly', description: '# Weekly Goal\nComplete backend router and schema.' },
];

export const GoalDashboard: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<GoalType | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);

  const filteredGoals = filter === 'all' 
    ? MOCK_GOALS 
    : MOCK_GOALS.filter(g => g.type === filter);

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
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95">
            <Plus size={18} /> Add Goal
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* List Panel */}
        <div className={clsx("flex flex-col transition-all duration-300 ease-in-out", selectedGoal ? "w-2/3" : "w-full")}>
          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {filteredGoals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => { setSelectedGoal(goal); setIsEditing(false); }}
                className={clsx(
                  "p-4 border cursor-pointer flex items-center justify-between transition-colors",
                  selectedGoal?.id === goal.id ? "bg-muted/50 border-primary" : "hover:border-primary/50"
                )}
              >
                <div>
                  <h3 className="font-bold">{goal.name}</h3>
                  <span className="text-[10px] uppercase font-black text-muted-foreground">{goal.type}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Markdown Editor Panel */}
        <div className={clsx("border-l bg-card transition-all duration-300 ease-in-out flex flex-col", selectedGoal ? "w-1/3 opacity-100" : "w-0 opacity-0 overflow-hidden")}>
          {selectedGoal && (
            <>
              <header className="p-4 border-b flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest">Editor</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(!isEditing)} className="text-muted-foreground hover:text-foreground p-1">
                    {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
                  </button>
                  <button onClick={() => setSelectedGoal(null)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={16} />
                  </button>
                </div>
              </header>
              <div className="flex-1 p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{selectedGoal.name}</h2>
                {isEditing ? (
                  <textarea
                    readOnly={false}
                    value={selectedGoal.description}
                    onChange={(e) => setSelectedGoal({ ...selectedGoal, description: e.target.value })}
                    className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
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
