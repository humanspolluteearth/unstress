import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Save, X, Edit3, Eye, CheckSquare, Hash } from 'lucide-react';
import { Goal, GoalService } from '../services/GoalService';
import { clsx } from 'clsx';

interface GoalDetailPanelProps {
  goal: Goal;
  onClose: () => void;
  onUpdate: () => void;
}

export const GoalDetailPanel: React.FC<GoalDetailPanelProps> = ({ goal, onClose, onUpdate }) => {
  const [markdownContent, setMarkdownContent] = useState(goal.markdown_content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with goal prop changes
  useEffect(() => {
    setMarkdownContent(goal.markdown_content || '');
  }, [goal.id, goal.markdown_content]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await GoalService.updateGoal(goal.id, { ...goal, markdown_content: markdownContent });
    if (result.success) {
      setIsEditing(false);
      onUpdate();
    }
    setIsSaving(false);
  };

  const handleToggleTask = async (taskId: string) => {
    const updatedTasks = goal.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const result = await GoalService.updateGoal(goal.id, { ...goal, tasks: updatedTasks });
    if (result.success) {
      onUpdate();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-white/90 truncate max-w-[200px]">{goal.title}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 hover:bg-white/5 text-white/20 hover:text-white transition-colors"
            title={isEditing ? "View Preview" : "Edit Markdown"}
          >
            {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
          </button>
          {isEditing && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="p-1.5 hover:bg-white/5 text-primary/60 hover:text-primary transition-colors disabled:opacity-30"
              title="Save Brief"
            >
              <Save size={16} />
            </button>
          )}
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 text-white/20 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Editor/Preview Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isEditing ? (
            <textarea
              autoFocus
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm text-white/80 leading-relaxed custom-scrollbar"
              placeholder="Enter detailed intelligence in Markdown..."
            />
          ) : (
            <div className="prose prose-sm prose-invert max-w-none prose-p:text-white/70 prose-headings:text-white prose-strong:text-primary">
              <ReactMarkdown>{markdownContent || "*No detailed intelligence provided.*"}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action Items Sidebar (Trello-style checklist) */}
        <div className="border-t border-white/5 bg-black/40 p-6 max-h-[300px] overflow-y-auto">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
            <CheckSquare size={12} /> Objectives Checklist
          </h4>
          <div className="space-y-1">
            {goal.tasks.map((task, i) => (
              <button 
                key={task.id || i} 
                onClick={() => handleToggleTask(task.id)}
                className="w-full flex items-center gap-4 p-3 bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group text-left"
              >
                <div className={clsx(
                  "w-1 h-4 transition-all group-hover:h-full",
                  task.completed ? "bg-primary/20" : "bg-primary"
                )} />
                <span className={clsx(
                  "text-sm font-medium transition-colors",
                  task.completed ? 'line-through text-white/20' : 'text-white/80 group-hover:text-white'
                )}>{task.text}</span>
              </button>
            ))}
            {goal.tasks.length === 0 && (
              <p className="text-[10px] italic text-white/10 uppercase tracking-widest text-center py-4">No objectives defined</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Hash size={10} /> {goal.category}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" /> {goal.progress}% COMPLETE
          </div>
        </div>
        <div>Assigned: {goal.assignee_initials}</div>
      </footer>
    </div>
  );
};
