import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, X, ChevronRight } from 'lucide-react';

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

  const filteredGoals = filter === 'all' 
    ? MOCK_GOALS 
    : MOCK_GOALS.filter(g => g.type === filter);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* List Panel */}
      <div className={clsx("flex flex-col transition-all duration-300 ease-in-out", selectedGoal ? "w-2/3" : "w-full")}>
        <header className="p-6 border-b flex items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={clsx(
                  "px-3 py-1 text-xs font-bold uppercase tracking-widest",
                  filter === t ? "text-primary border-b border-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:opacity-90">
            <Plus size={14} /> New Goal
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => setSelectedGoal(goal)}
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
      <div className={clsx("border-l bg-card transition-all duration-300 ease-in-out flex flex-col", selectedGoal ? "w-1/3 opacity-100" : "w-0 opacity-0")}>
        {selectedGoal && (
          <>
            <header className="p-6 border-b flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest">Editor</span>
              <button onClick={() => setSelectedGoal(null)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 p-6">
              <h2 className="text-xl font-bold mb-4">{selectedGoal.name}</h2>
              <textarea
                readOnly={false}
                value={selectedGoal.description}
                onChange={(e) => setSelectedGoal({ ...selectedGoal, description: e.target.value })}
                className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
