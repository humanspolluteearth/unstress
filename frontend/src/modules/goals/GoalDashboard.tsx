import React, { useEffect, useState } from 'react';
import { useGoalStore, Goal, GoalTier } from './useGoalStore';
import { Target, TrendingUp, Settings, Plus, Star, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

const TIERS: GoalTier[] = ['Yearly', 'Monthly', 'Weekly'];

export const GoalDashboard: React.FC = () => {
  const { goals, isLoading, error, fetchGoals, createGoal, setFocus } = useGoalStore();
  const [isAdding, setIsAdding] = useState<GoalTier | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddGoal = async (tier: GoalTier) => {
    setSubmitError(null);
    if (!newGoalTitle) return;

    const result = await createGoal({
      title: newGoalTitle,
      target: newGoalTarget,
      unit: 'tasks',
      goal_type: 'task',
      tier
    });

    if (result.success) {
      setIsAdding(null);
      setNewGoalTitle('');
      setNewGoalTarget(10);
    } else {
      setSubmitError(result.error || 'Failed to create goal');
    }
  };

  return (
    <div className="p-6 space-y-8 bg-background/50 min-h-full">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Strategic Goals</h2>
          <p className="text-muted-foreground">The 'Rule of Three': Focused execution across all horizons.</p>
        </div>
        <TrendingUp className="text-primary/20" size={48} />
      </header>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {TIERS.map((tier) => {
          const tierGoals = goals.filter(g => g.tier === tier);
          const canAdd = tierGoals.length < 3;

          return (
            <div key={tier} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  {tier} 
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono">
                    {tierGoals.length}/3
                  </span>
                </h3>
                {canAdd && !isAdding && (
                  <button 
                    onClick={() => setIsAdding(tier)}
                    className="p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-all"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {isAdding === tier && (
                  <div className="p-4 bg-card border rounded-xl shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                    <input
                      autoFocus
                      className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Goal Title..."
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Target Tasks:</label>
                      <input
                        type="number"
                        className="flex-1 bg-muted/50 border rounded-md px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {submitError && <p className="text-[10px] text-destructive">{submitError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        onClick={() => setIsAdding(null)}
                        className="px-3 py-1 text-xs font-medium hover:bg-muted rounded"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleAddGoal(tier)}
                        className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded shadow-sm hover:bg-primary/90"
                      >
                        Add Goal
                      </button>
                    </div>
                  </div>
                )}

                {tierGoals.map((goal) => {
                  const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100);
                  
                  return (
                    <div 
                      key={goal.id} 
                      className={clsx(
                        "group p-4 bg-card border rounded-xl shadow-sm transition-all hover:shadow-md relative overflow-hidden",
                        goal.is_focus && "ring-2 ring-primary/50 border-primary/50"
                      )}
                    >
                      {goal.is_focus && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-[8px] font-black uppercase rounded-bl-lg">
                          Current Focus
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 pr-8">
                            <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                              {goal.title}
                            </h4>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                              {goal.current} / {goal.target} {goal.unit}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => setFocus(goal.id)}
                            className={clsx(
                              "p-1.5 rounded-lg transition-all",
                              goal.is_focus ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                            )}
                            title="Set as current focus"
                          >
                            <Star size={16} fill={goal.is_focus ? "currentColor" : "none"} />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                            <span className={clsx(percentage >= 100 ? "text-green-500" : "text-primary")}>
                              {percentage}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50 shadow-inner">
                            <div 
                              className={clsx(
                                "h-full transition-all duration-1000 ease-out",
                                percentage >= 100 ? "bg-green-500" : "bg-primary"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {tierGoals.length === 0 && !isAdding && (
                  <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center opacity-30 hover:opacity-50 transition-opacity cursor-pointer" onClick={() => setIsAdding(tier)}>
                    <Target size={24} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Set {tier} Goal</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="fixed bottom-6 right-6 p-2 bg-background border rounded-full shadow-lg">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      )}
    </div>
  );
};
