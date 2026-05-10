import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Tag, Link, CheckSquare, ExternalLink, Hash } from 'lucide-react';
import { Goal } from '../services/GoalService';

interface GoalDetailPanelProps {
  goal: Goal;
  onClose: () => void;
}

export const GoalDetailPanel: React.FC<GoalDetailPanelProps> = ({ goal, onClose }) => {
  return (
    <div className="grid grid-cols-[200px,1fr,250px] gap-6 h-full p-6 bg-[#050505] border-l border-white/5 animate-in slide-in-from-right duration-300">
      {/* Col 1: Priority & Metadata */}
      <div className="space-y-6">
        <div>
          <h4 className="text-[10px] uppercase text-white/30 font-bold mb-2 flex items-center gap-2">
            <Hash size={10} /> Category
          </h4>
          <span className="text-sm text-white font-mono uppercase tracking-tighter">{goal.category}</span>
        </div>
        <div>
          <h4 className="text-[10px] uppercase text-white/30 font-bold mb-2">Priority</h4>
          <span className={`text-xs font-black uppercase tracking-[0.2em] ${goal.priority === 'critical' ? 'text-red-500' : 'text-primary'}`}>
            {goal.priority}
          </span>
        </div>
        <div>
          <h4 className="text-[10px] uppercase text-white/30 font-bold mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {goal.tags.map(tag => (
              <span key={tag} className="text-[9px] font-bold px-2 py-0.5 bg-white/5 text-white/40 border border-white/5 uppercase">#{tag}</span>
            ))}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="mt-12 text-[10px] font-black uppercase tracking-widest text-white/10 hover:text-white transition-colors"
        >
          [ Dismiss Brief ]
        </button>
      </div>

      {/* Col 2: Markdown Description & Tasks */}
      <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
        <div className="prose prose-sm prose-invert max-w-none prose-p:text-white/70 prose-headings:text-white prose-strong:text-primary">
          <ReactMarkdown>{goal.description}</ReactMarkdown>
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
            Action Items
          </h4>
          <div className="space-y-1">
            {goal.tasks.map((task, i) => (
              <div key={task.id || i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                <div className={clsx(
                  "w-1 h-4 transition-all group-hover:h-full",
                  task.completed ? "bg-primary/20" : "bg-primary"
                )} />
                <span className={clsx(
                  "text-sm font-medium transition-colors",
                  task.completed ? 'line-through text-white/20' : 'text-white/80'
                )}>{task.text}</span>
              </div>
            ))}
            {goal.tasks.length === 0 && (
              <p className="text-[10px] italic text-white/20 uppercase tracking-widest">No active tasks assigned to this objective</p>
            )}
          </div>
        </div>
      </div>

      {/* Col 3: Resources */}
      <div className="space-y-6">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
            Intelligence Links
          </h4>
          <div className="space-y-2">
            {goal.links.map((link, i) => (
              <a 
                key={i} 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-bold text-primary/60 hover:text-primary transition-all uppercase tracking-tighter"
              >
                <ExternalLink size={12} /> {new URL(link).hostname}
              </a>
            ))}
            {goal.links.length === 0 && (
              <p className="text-[9px] text-white/10 uppercase font-black">No external resources mapped</p>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Local Reference Keys</h4>
          <ul className="space-y-1">
            {goal.references.map((ref, i) => (
              <li key={i} className="text-[10px] font-mono text-white/40 flex items-center gap-2 p-2 bg-white/5">
                <Hash size={10} className="opacity-20" />
                {ref}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Helper for clsx style logic since it's used in the template
function clsx(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
