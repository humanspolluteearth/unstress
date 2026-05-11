import React, { useState } from 'react';
import { useTaskStore, Task } from './useTaskStore';
import { ListTodo, Clock, CheckCircle2, GripVertical, MoreVertical, Tag, Calendar, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

const COLUMNS: { id: Task['status']; title: string; icon: any; color: string }[] = [
  { id: 'Todo', title: 'To Do', icon: ListTodo, color: 'text-muted-foreground' },
  { id: 'In Progress', title: 'In Progress', icon: Clock, color: 'text-muted-foreground' },
  { id: 'Done', title: 'Done', icon: CheckCircle2, color: 'text-muted-foreground' },
  { id: 'Funded', title: 'Funded', icon: CheckCircle2, color: 'text-muted-foreground' },
];

interface KanbanViewProps {
  onEdit: (task: Task) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ onEdit }) => {
  const { tasks, updateTaskStatus, deleteTask } = useTaskStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    setDraggedTaskId(null);
    
    if (id) {
      await updateTaskStatus(id, status);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
    }
  };

  return (
    <div className="flex gap-0 flex-1 overflow-x-auto min-h-0 pb-2 h-full border-t border-l border-border/50">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, col.id)}
          className="flex flex-col border-r border-b border-border/50 p-4 space-y-4 min-w-[320px] flex-1 h-full overflow-hidden bg-background"
        >
          <div className="flex items-center gap-2 mb-2 shrink-0 pb-2 border-b border-border/20">
            <col.icon size={18} className={col.color} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">{col.title}</h3>
            <span className="ml-auto bg-muted px-2 py-0.5 rounded-none text-[10px] font-bold">
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/10 custom-scrollbar">
            {tasks
              .filter((t) => t.status === col.id)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, task.id)}
                  className={clsx(
                    "group relative bg-card border border-border/50 rounded-none p-4 shadow-none cursor-grab active:cursor-grabbing transition-all hover:bg-muted/30",
                    draggedTaskId === task.id && "opacity-50 scale-95"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-bold leading-tight">{task.title}</p>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, task.id)}
                            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className={clsx(
                            "w-2.5 h-2.5 rounded-none shrink-0 ml-1",
                            task.priority === 2 ? "bg-foreground" : task.priority === 1 ? "bg-muted-foreground" : "bg-muted"
                          )} />
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {task.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-none bg-muted/50 text-muted-foreground border border-border/30">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        {task.deadline ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                            <Calendar size={12} />
                            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        ) : <div />}

                        {task.projectLink && (
                          <a 
                            href={task.projectLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
