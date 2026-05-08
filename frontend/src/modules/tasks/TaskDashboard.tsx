import React, { useEffect, useState } from 'react';
import { useTaskStore } from './useTaskStore';
import { KanbanView } from './KanbanView';
import { ListView } from './ListView';
import { ScheduleView } from './ScheduleView';
import { TaskModal } from './TaskModal';
import { Plus, LayoutDashboard, List, Calendar, Filter, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export const TaskDashboard: React.FC = () => {
  const { viewMode, setViewMode, isLoading, error, fetchTasks } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(undefined);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openAddModal = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const renderView = () => {
    switch (viewMode) {
      case 'Kanban': return <KanbanView onEdit={openEditModal} />;
      case 'List': return <ListView onEdit={openEditModal} />;
      case 'Schedule': return <ScheduleView />;
      default: return <KanbanView onEdit={openEditModal} />;
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground text-sm">Organize, track, and complete your goals.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-none border">
            <button
              onClick={() => setViewMode('Kanban')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                viewMode === 'Kanban' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('List')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                viewMode === 'List' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode('Schedule')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                viewMode === 'Schedule' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar size={14} /> Schedule
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </header>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20 flex items-center gap-2">
          <Filter size={16} />
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
        {renderView()}
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={editingTask}
      />
    </div>
  );
};
