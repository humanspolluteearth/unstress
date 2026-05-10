import React from 'react';
import { Tag, Link, CheckSquare, Target, Calendar } from 'lucide-react';
import { Goal } from '../../services/GoalService';
import { clsx } from 'clsx';

interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  onSelect: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, isSelected, onSelect }) => {
  const completedTasks = goal.tasks.filter(t => t.completed).length;
  const progress = goal.progress || 0;

  return (
    <div 
      onClick={() => onSelect(goal)}
      className={clsx(
        "group border p-4 cursor-pointer transition-all relative overflow-hidden",
        isSelected 
          ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
          : "border-white/10 bg-[#0a0a0a] hover:border-white/20"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Target size={14} className={isSelected ? "text-primary" : "text-white/40"} />
          <h3 className="text-sm font-bold text-white tracking-tight">{goal.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            "text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest border border-white/5 bg-white/5 text-white/40",
            goal.time_frame === 'weekly' && "border-blue-500/20 text-blue-400",
            goal.time_frame === 'monthly' && "border-purple-500/20 text-purple-400",
            goal.time_frame === 'yearly' && "border-yellow-500/20 text-yellow-400"
          )}>
            {goal.time_frame}
          </span>
          <span className={clsx(
            "text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest",
            goal.priority === 'critical' ? "bg-red-500 text-black" : "bg-white/5 text-white/40"
          )}>
            {goal.priority}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-white/50 mb-4 line-clamp-1 italic font-serif">
        {goal.description || "No mission brief provided."}
      </p>
      
      <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-white/30">
        <div className="flex items-center gap-1"><Tag size={10} /> {goal.tags.length}</div>
        <div className="flex items-center gap-1"><Link size={10} /> {goal.links.length}</div>
        <div className="flex items-center gap-1"><CheckSquare size={10} /> {completedTasks}/{goal.tasks.length}</div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
};
