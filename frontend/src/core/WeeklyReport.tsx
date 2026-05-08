import React, { useEffect, useState } from 'react';
import { Result } from './results';

interface WeeklySummary {
  finance: { total_transactions: number; total_volume: number };
  tasks: { completed: number; funded: number };
  habits: { success: number; failed: number };
  goals: { updates: number };
}

export const WeeklyReport: React.FC = () => {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const port = (window as any).__BACKEND_PORT__ || 8000;
        const response = await fetch(`http://localhost:${port}/review/weekly`);
        const result: Result<WeeklySummary> = await response.json();
        
        if (result.success && result.data) {
          setSummary(result.data);
        } else {
          setError(result.error || "Failed to load summary");
        }
      } catch (err) {
        setError("Network error connecting to sidecar");
      }
    };

    fetchSummary();
  }, []);

  if (error) {
    return <div className="p-4 text-destructive bg-destructive/10 rounded-lg">{error}</div>;
  }

  if (!summary) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Generating Report...</div>;
  }

  const habitTotal = summary.habits.success + summary.habits.failed;
  const habitPercent = habitTotal > 0 ? (summary.habits.success / habitTotal) * 100 : 0;

  return (
    <div className="space-y-8 p-6 bg-card text-card-foreground rounded-xl border shadow-sm">
      <div>
        <h2 className="text-2xl font-bold">Weekly Review</h2>
        <p className="text-muted-foreground">Aggregated system activity from the last 7 days.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Habit Consistency */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Habit Consistency</h3>
            <span className="text-2xl font-bold">{Math.round(habitPercent)}%</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${habitPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">{summary.habits.success} successful completions.</p>
        </div>

        {/* Task Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Task Momentum</h3>
            <span className="text-2xl font-bold">{summary.tasks.completed + summary.tasks.funded}</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-in-out border-r border-background" 
              style={{ width: `${Math.min(summary.tasks.completed * 10, 50)}%` }}
              title="Completed"
            ></div>
            <div 
              className="h-full bg-emerald-300 transition-all duration-500 ease-in-out" 
              style={{ width: `${Math.min(summary.tasks.funded * 10, 50)}%` }}
              title="Funded"
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.tasks.completed} completed, {summary.tasks.funded} funded.
          </p>
        </div>

        {/* Finance Volume */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Financial Activity</h3>
            <span className="text-2xl font-bold">${(summary.finance.total_volume / 100).toFixed(2)}</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-in-out" 
              style={{ width: `${Math.min(summary.finance.total_transactions * 5, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">{summary.finance.total_transactions} transactions recorded.</p>
        </div>

        {/* Goal Updates */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Goal Momentum</h3>
            <span className="text-2xl font-bold">{summary.goals.updates}</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-500 ease-in-out" 
              style={{ width: `${Math.min(summary.goals.updates * 20, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">Reactive progress updates.</p>
        </div>
      </div>
    </div>
  );
};
