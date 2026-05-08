import { useTaskStore, Task } from './useTaskStore';
import { Tag, Calendar, ExternalLink, CheckCircle2, Clock, ListTodo, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { CustomSelect } from '../../core/CustomSelect';
import { clsx } from 'clsx';

interface ListViewProps {
  onEdit: (task: Task) => void;
}

const STATUS_OPTIONS = [
  { label: 'Todo', value: 'Todo', icon: <ListTodo size={14} className="text-muted-foreground" /> },
  { label: 'In Progress', value: 'In Progress', icon: <Clock size={14} className="text-foreground" /> },
  { label: 'Done', value: 'Done', icon: <CheckCircle2 size={14} className="text-foreground" /> },
  { label: 'Funded', value: 'Funded', icon: <CheckCircle2 size={14} className="text-foreground" /> },
];

export const ListView: React.FC<ListViewProps> = ({ onEdit }) => {
  const { tasks, updateTaskStatus, deleteTask } = useTaskStore();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-card border rounded-none shadow-none">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b z-10">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deadline</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-muted/30 transition-colors group border-b border-border/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <CustomSelect
                  compact
                  value={task.status}
                  onChange={(val) => updateTaskStatus(task.id, val)}
                  options={STATUS_OPTIONS}
                  className="w-36"
                />
              </td>
              <td className="px-6 py-4">
                <div className="min-w-[200px]">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={clsx(
                  "text-[10px] px-2 py-0.5 rounded-none font-bold uppercase tracking-tighter border",
                  task.priority === 2 ? "bg-foreground/10 text-foreground border-foreground/20" : 
                  task.priority === 1 ? "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" :
                  "bg-muted/10 text-muted-foreground border-muted/20"
                )}>
                  {task.priority === 2 ? 'High' : task.priority === 1 ? 'Medium' : 'Low'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {task.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-none bg-muted text-muted-foreground border">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {task.deadline ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={14} />
                    {new Date(task.deadline).toLocaleDateString()}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/30">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {task.projectLink && (
                    <a 
                      href={task.projectLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors inline-block p-1"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button 
                    onClick={() => onEdit(task)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <ListTodo size={32} className="opacity-20" />
                  <p>No tasks found. Create one to get started!</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
