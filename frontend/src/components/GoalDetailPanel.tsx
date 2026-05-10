import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Tag, Link, CheckSquare, ExternalLink, Hash, Trophy, BarChart3, CalendarDays } from 'lucide-react';
import { Goal, GoalService } from '../services/GoalService';
import { clsx } from 'clsx';

interface GoalDetailPanelProps {
  goal: Goal;
  onClose: () => void;
  onUpdate?: () => void;
}

export const GoalDetailPanel: React.FC<GoalDetailPanelProps> = ({ goal, onClose, onUpdate }) => {
  
  const handleToggleTask = async (taskId: string) => {
    const updatedTasks = goal.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    const result = await GoalService.updateGoal(goal.id, { tasks: updatedTasks });
    if (result.success && onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] animate-in slide-in-from-right duration-300">
      {/* High-Density Header */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={clsx(
              "text-[8px] font-black px-1.5 py-0.5 uppercase tracking-[0.2em] border",
              goal.time_frame === 'weekly' && "border-blue-500/30 text-blue-400 bg-blue-500/5",
              goal.time_frame === 'monthly' && "border-purple-500/30 text-purple-400 bg-purple-500/5",
              goal.time_frame === 'yearly' && "border-yellow-500/30 text-yellow-400 bg-yellow-500/5"
            )}>
              {goal.time_frame}
            </span>
            <span className={clsx(
              "text-[8px] font-black px-1.5 py-0.5 uppercase tracking-[0.2em]",
              goal.priority === 'critical' ? "bg-red-500 text-black" : "bg-white/5 text-white/40"
            )}>
              {goal.priority}
            </span>
          </div>
          <h2 className="text-sm font-black uppercase tracking-tight text-white/90 truncate max-w-[300px]">{goal.title}</h2>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </header>

      {/* Progress Bar Header */}
      <div className="h-1 w-full bg-white/5 relative">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-in-out" 
          style={{ width: `${goal.progress}%` }} 
        />
      </div>

      <div className="flex-1 grid grid-cols-[200px,1fr,250px] overflow-hidden">
        {/* Col 1: Metadata */}
        <div className="border-r border-white/5 p-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <h4 className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] mb-3 flex items-center gap-2">
              <Hash size={10} /> Classification
            </h4>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-white/40 block mb-1 uppercase font-bold">Category</span>
                <span className="text-xs text-white font-mono uppercase tracking-tighter">{goal.category}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-1 uppercase font-bold">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {goal.tags.map(tag => (
                    <span key={tag} className="text-[8px] font-black px-1.5 py-0.5 bg-white/5 text-white/40 border border-white/5 uppercase italic">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <h4 className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] mb-4">Sync Status</h4>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest text-green-500/80">Active Mission</span>
            </div>
          </div>
        </div>

        {/* Col 2: Content & Tasks */}
        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar border-r border-white/5">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{goal.description}</ReactMarkdown>
          </div>

          <div className="space-y-6">
            <header className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                <CheckSquare size={12} /> Mission Objectives
              </h4>
              <span className="text-[10px] font-black text-primary">{Math.round(goal.progress)}%</span>
            </header>
            
            <div className="space-y-1">
              {goal.tasks.map((task, i) => (
                <button 
                  key={task.id || i} 
                  onClick={() => handleToggleTask(task.id)}
                  className="w-full flex items-center gap-4 p-3 bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group text-left"
                >
                  <div className={clsx(
                    "w-1 h-4 transition-all group-hover:h-full",
                    task.completed ? "bg-primary/20" : "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                  )} />
                  <span className={clsx(
                    "text-sm font-medium transition-colors",
                    task.completed ? 'line-through text-white/20' : 'text-white/80 group-hover:text-white'
                  )}>{task.text}</span>
                </button>
              ))}
              {goal.tasks.length === 0 && (
                <div className="p-8 border border-dashed border-white/5 text-center">
                  <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">No objectives defined for this mission</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 3: Intel & Assets */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <h4 className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] mb-4 flex items-center gap-2">
              <Link size={12} /> Strategic Links
            </h4>
            <div className="space-y-2">
              {goal.links.map((link, i) => (
                <a 
                  key={i} 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/5 text-[9px] font-black text-primary/50 hover:text-primary hover:bg-white/[0.04] transition-all uppercase tracking-tighter"
                >
                  <ExternalLink size={10} /> {new URL(link).hostname}
                </a>
              ))}
              {goal.links.length === 0 && (
                <p className="text-[9px] text-white/10 uppercase font-black italic">No external data mapped</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] mb-4">Internal References</h4>
            <div className="space-y-1.5">
              {goal.references.map((ref, i) => (
                <div key={i} className="text-[9px] font-mono text-white/40 flex items-center gap-2 p-2 bg-white/5 border border-white/5">
                  <Hash size={8} className="opacity-20" />
                  {ref}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
