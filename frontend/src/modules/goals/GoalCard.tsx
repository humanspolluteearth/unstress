import React from 'react';
import { clsx } from 'clsx';
import { Target, Calendar, Tag, ChevronRight, Plus } from 'lucide-react';
import { Goal } from './GoalDashboard';

interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  onSelect: (goal: Goal) => void;
  onToggleFocus: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, isSelected, onSelect, onToggleFocus }) => {
  // Simple segmented progress calculation (10 segments)
  const segments = Array.from({ length: 10 }, (_, i) => i * 10);

  return (
    <div
      onClick={() => onSelect(goal)}
      className={clsx(
        "group relative bg-black border p-4 cursor-pointer transition-all duration-300",
        isSelected ? "border-white" : "border-white/10 hover:border-white/40"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className={clsx(
            "font-bold text-base truncate transition-colors",
            isSelected ? "text-white" : "text-white/80 group-hover:text-white"
          )}>
            {goal.name}
          </h3>
          {goal.parentName && (
            <span className="text-[9px] font-medium text-white/40 uppercase tracking-tighter truncate">
              Part of: {goal.parentName}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id);
          }}
          className={clsx(
            "p-1.5 transition-all duration-300",
            goal.is_current_focus ? "text-primary scale-110 shadow-[0_0_10px_hsl(var(--primary)/0.3)]" : "text-white/20 hover:text-white/60"
          )}
        >
          <Target size={16} />
        </button>
      </div>

      {/* Progress Bar (Thick, Segmented) */}
      <div className="flex gap-0.5 h-2 mb-4 bg-white/5">
        {segments.map((threshold) => (
          <div
            key={threshold}
            className={clsx(
              "flex-1 transition-all duration-500",
              goal.progress > threshold ? "bg-white" : "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Metadata Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-1.5 py-0.5 border border-white/10 bg-white/5 rounded-none">
            <span className={clsx(
              "w-1 h-1 rounded-full",
              goal.priority === 'high' ? "bg-red-500" : goal.priority === 'med' ? "bg-yellow-500" : "bg-green-500"
            )} />
            <span className="text-[9px] font-black uppercase text-white/60 tracking-widest">{goal.priority}</span>
          </div>
          
          <div className="flex items-center gap-1 text-white/40">
            <Tag size={10} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{goal.category}</span>
          </div>

          <div className="flex items-center gap-1 text-white/40">
            <Calendar size={10} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{goal.deadline}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-white text-black text-[9px] font-black uppercase tracking-tighter transition-all hover:bg-white/90 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              // Future: Open task creation modal with goal_id pre-filled
            }}
           >
            <Plus size={10} /> Quick Add Task
           </button>
           <ChevronRight size={14} className={clsx("transition-transform duration-300", isSelected ? "text-white translate-x-1" : "text-white/20")} />
        </div>
      </div>
    </div>
  );
};
