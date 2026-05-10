import React, { useState } from 'react';
import { Tag, CheckSquare, Target, ChevronDown, ChevronUp, User, Pencil, Calendar } from 'lucide-react';
import { Goal, GoalService } from '../../services/GoalService';
import { clsx } from 'clsx';

interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  onSelect: (goal: Goal) => void;
  onUpdate: () => void;
  onEdit: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, isSelected, onSelect, onUpdate, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = goal.progress || 0;

  const handleToggleTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    const updatedTasks = goal.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    const result = await GoalService.updateGoal(goal.id, { ...goal, tasks: updatedTasks });
    if (result.success) {
      onUpdate();
    }
  };

  const getPriorityColor = () => {
    switch (goal.priority) {
      case 'critical': return 'text-red-500 border-red-500/30 bg-red-500/5';
      case 'high': return 'text-orange-500 border-orange-500/30 bg-orange-500/5';
      case 'medium': return 'text-primary border-primary/30 bg-primary/5';
      default: return 'text-muted-foreground border-border bg-muted/5';
    }
  };

  const getProgressColor = () => {
    if (goal.priority === 'critical') return 'bg-red-500';
    if (goal.priority === 'high') return 'bg-orange-500';
    return 'bg-primary';
  };

  return (
    <div 
      className={clsx(
        "group border transition-all duration-200 relative overflow-hidden",
        isSelected 
          ? "border-primary/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
          : "border-white/10 hover:border-white/20",
        "bg-[#0a0a0a]"
      )}
    >
      {/* Label Color Stripe */}
      <div 
        className="absolute top-0 left-0 w-full h-1" 
        style={{ backgroundColor: goal.label_color }} 
      />

      {/* Clickable Header Area */}
      <div 
        onClick={() => onSelect(goal)}
        className="p-4 pt-5 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{goal.category}</span>
            <div className="flex items-center gap-2">
              <Target size={12} className={isSelected ? "text-primary" : "text-white/20"} />
            </div>
          </div>
          <div className="flex items-center gap-2">
             {/* Edit Button */}
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(goal);
                }}
                className="p-1 hover:bg-white/5 text-white/20 hover:text-white transition-colors"
                title="Edit Goal"
             >
               <Pencil size={12} />
             </button>

             {/* Assignee Initials Badge */}
             <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/60 uppercase">
               {goal.assignee_initials}
             </div>
             <span className={clsx(
               "text-[8px] font-black px-1.5 py-0.5 rounded-none border uppercase tracking-widest",
               getPriorityColor()
             )}>
               {goal.priority}
             </span>
          </div>
        </div>

        <h3 className="text-sm font-bold text-white tracking-tight mb-2 group-hover:text-primary transition-colors">
          {goal.title}
        </h3>
        
        <p className="text-xs text-muted-foreground mb-4 font-sans leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {goal.description 
            ? (goal.description.length > 100 ? `${goal.description.substring(0, 100)}...` : goal.description)
            : "No mission brief provided."}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {goal.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-none bg-white/5 text-white/50 border border-white/5 lowercase tracking-tight">
              {tag}
            </span>
          ))}
          {goal.tags.length === 0 && <span className="text-[10px] text-white/10 italic">#untagged</span>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
             <div className={clsx(
               "flex items-center gap-1 px-1.5 py-0.5 rounded-sm transition-colors",
               goal.progress === 100 ? "bg-green-500/20 text-green-500" : "hover:bg-white/5"
             )}>
               <CheckSquare size={10} />
               <span>{goal.completed_tasks}/{goal.total_tasks}</span>
             </div>

             {goal.deadline && (
               <div className="flex items-center gap-1.5 lowercase tracking-normal font-medium text-white/40">
                 <Calendar size={10} />
                 {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               </div>
             )}
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-white/5 text-white/20 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Collapsible Tasks */}
      <div className={clsx(
        "overflow-hidden transition-all duration-300 ease-in-out border-t border-white/5 bg-black/40",
        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-3 space-y-1">
          {goal.tasks.map((task) => (
            <div 
              key={task.id}
              onClick={(e) => handleToggleTask(e, task.id)}
              className="flex items-center gap-3 p-2 hover:bg-white/5 transition-colors group/task cursor-pointer"
            >
              <div className={clsx(
                "w-3 h-3 border transition-all flex items-center justify-center",
                task.completed ? "bg-primary border-primary" : "border-white/20 group-hover/task:border-primary/50"
              )}>
                {task.completed && <div className="w-1.5 h-1.5 bg-black" />}
              </div>
              <span className={clsx(
                "text-xs transition-colors",
                task.completed ? "text-white/20 line-through" : "text-white/70"
              )}>
                {task.text}
              </span>
            </div>
          ))}
          {goal.tasks.length === 0 && (
            <p className="text-[10px] text-white/10 uppercase tracking-widest p-4 text-center">No mission tasks</p>
          )}
        </div>
      </div>

      {/* Progress Bar at the absolute bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
        <div 
          className={clsx("h-full transition-all duration-700 ease-in-out", getProgressColor())} 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
};
