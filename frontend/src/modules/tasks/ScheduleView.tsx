import React, { useMemo } from 'react';
import { useTaskStore, Task } from './useTaskStore';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export const ScheduleView: React.FC = () => {
  const { tasks } = useTaskStore();

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    days.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      map[dateStr] = tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr));
    });
    // Add "No Deadline" or "Past Due" logic if needed, but keeping it simple for now
    return map;
  }, [tasks, days]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-none shadow-none overflow-hidden h-full">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-foreground" />
          <h3 className="font-semibold text-sm">Weekly Schedule</h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-muted rounded-none transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-xs font-medium px-2">Next 7 Days</span>
          <button className="p-1 hover:bg-muted rounded-none transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex divide-x divide-border/50">
        {days.map((day) => {
          const dateStr = day.toISOString().split('T')[0];
          const dayTasks = tasksByDay[dateStr] || [];
          const isToday = new Date().toDateString() === day.toDateString();

          return (
            <div 
              key={dateStr} 
              className={clsx(
                "flex-1 min-w-[200px] flex flex-col p-3 space-y-3",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-center pb-2 border-b border-border/30">
                <p className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </p>
                <p className={clsx(
                  "text-lg font-bold leading-none mt-1",
                  isToday && "text-primary"
                )}>
                  {day.getDate()}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {dayTasks.length > 0 ? (
                  dayTasks.map(task => (
                    <div 
                      key={task.id}
                      className="p-2 bg-muted/50 border rounded-none text-xs hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={clsx(
                          "w-1.5 h-1.5 rounded-none",
                          task.priority === 2 ? "bg-foreground" : task.priority === 1 ? "bg-muted-foreground" : "bg-muted"
                        )} />
                        <span className="font-semibold truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {task.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                    <div className="w-1 h-1 bg-muted-foreground rounded-none mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-tighter">Clear</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
