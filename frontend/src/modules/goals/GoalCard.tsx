import React, { useState } from 'react';
import { Tag, CheckSquare, ChevronDown, ChevronUp, User, Pencil, Calendar, Plus, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Goal, GoalService } from '../../services/GoalService';
import { clsx } from 'clsx';
import { Task } from '../tasks/useTaskStore';
import { ActionService } from '../../core/ActionService';
import { useNavigationStore } from '../../core/useNavigationStore';

interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  onSelect: (goal: Goal) => void;
  onUpdate: () => void;
  onEdit: (goal: Goal) => void;
  availableTasks?: Task[];
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, isSelected, onSelect, onUpdate, onEdit, availableTasks = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { navigate } = useNavigationStore();
  
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

  const handleAssignTask = async (taskId: string) => {
    const task = availableTasks.find(t => t.id === taskId);
    if (!task) return;

    const result = await ActionService.updateTask(taskId, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      tags: task.tags,
      deadline: task.deadline,
      goal_id: goal.id
    } as any);

    if (result.success) {
      setIsAssigning(false);
      onUpdate();
    }
  };

  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('tasks');
  };

  const getPriorityColor = () => {
    return 'text-white/60 border-white/10 bg-white/5';
  };

  const getProgressColor = () => {
    return 'bg-white/40';
  };

  const unassignedTasks = availableTasks.filter(t => t.goalId !== goal.id);

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
      <div 
        onClick={() => onSelect(goal)}
        className="p-4 pt-5 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1">
            {goal.deadline && !isNaN(new Date(goal.deadline).getTime()) && (
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                 <Calendar size={10} className="text-white/40" />
                 {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
               </div>
             )}
          </div>
          <div className="flex items-center gap-2">
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
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsAssigning(!isAssigning);
              }}
              className="p-1 hover:bg-white/5 text-white/20 hover:text-primary transition-colors"
              title="Assign Existing Task"
            >
              <Plus size={14} />
            </button>
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
      </div>

      {isAssigning && (
        <div className="border-t border-white/5 bg-black/60 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 text-primary">Eligible Tasks</span>
            <button onClick={(e) => { e.stopPropagation(); setIsAssigning(false); }} className="text-white/20 hover:text-white"><X size={10} /></button>
          </div>
          <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {unassignedTasks.map(task => (
              <button
                key={task.id}
                onClick={(e) => { e.stopPropagation(); handleAssignTask(task.id); }}
                className="w-full text-left p-2 bg-white/5 hover:bg-white/10 text-[11px] text-white/70 border border-white/5 transition-colors flex items-center justify-between group/assign"
              >
                <span className="truncate">{task.title}</span>
                <Plus size={10} className="opacity-0 group-hover/assign:opacity-100 text-primary" />
              </button>
            ))}
            {unassignedTasks.length === 0 && (
              <p className="text-[9px] text-white/20 text-center py-4 italic uppercase">No available tasks</p>
            )}
          </div>
        </div>
      )}

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
          
          {goal.external_tasks && goal.external_tasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-center gap-3 p-2 hover:bg-white/5 transition-colors group/task"
            >
              <div className="flex items-center justify-center w-3 h-3 border border-primary/40 text-primary/60">
                 <LinkIcon size={8} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className={clsx(
                  "text-xs transition-colors",
                  task.status === 'Done' ? "text-white/20 line-through" : "text-white/70"
                )}>
                  {task.title}
                </span>
                <span className="text-[8px] font-black uppercase text-white/20 px-1 border border-white/5">{task.status}</span>
              </div>
            </div>
          ))}

          {goal.tasks.length === 0 && (!goal.external_tasks || goal.external_tasks.length === 0) && (
            <p className="text-[10px] text-white/10 uppercase tracking-widest p-4 text-center">No mission tasks</p>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
        <div 
          className={clsx("h-full transition-all duration-700 ease-in-out", getProgressColor())} 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
