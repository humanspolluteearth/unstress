import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useTaskStore, Task } from './useTaskStore';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { clsx } from 'clsx';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80;

export const ScheduleView: React.FC = () => {
  const { tasks } = useTaskStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

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
    return map;
  }, [tasks, days]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    // Initial Auto-scroll to center the red line
    if (containerRef.current) {
      const top = (now.getHours() * HOUR_HEIGHT) + (now.getMinutes() / 60 * HOUR_HEIGHT);
      const containerHeight = containerRef.current.clientHeight;
      containerRef.current.scrollTop = top - (containerHeight / 2);
    }

    return () => clearInterval(timer);
  }, []);

  const lineTop = (now.getHours() * HOUR_HEIGHT) + (now.getMinutes() / 60 * HOUR_HEIGHT);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-none shadow-none overflow-hidden h-full">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30 shrink-0">
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

      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Day Header Row */}
        <div className="flex border-b bg-muted/5 divide-x">
          <div className="w-16 shrink-0" />
          <div className="flex-1 grid grid-cols-7 divide-x">
            {days.map((day) => {
              const isToday = now.toDateString() === day.toDateString();
              return (
                <div key={day.toISOString()} className="p-2 text-center">
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
              );
            })}
          </div>
        </div>

        {/* Grid Scroll Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth"
        >
          <div className="flex min-h-full relative">
            {/* Hour Gutter */}
            <div className="w-16 border-r shrink-0 bg-muted/5">
              {HOURS.map(hour => (
                <div key={hour} className="h-20 border-b flex justify-center pt-2 text-[10px] font-mono text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 grid grid-cols-7 divide-x relative">
              {/* Grid Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {HOURS.map(hour => (
                  <div key={hour} className="h-20 border-b border-border/30" />
                ))}
              </div>

              {/* Current Time Line */}
              <div 
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: lineTop }}
              >
                <div className="w-2 h-2 rounded-full bg-destructive -ml-1 shadow-sm" />
                <div className="flex-1 h-px bg-destructive shadow-sm" />
              </div>

              {/* Days */}
              {days.map((day) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayTasks = tasksByDay[dateStr] || [];
                const isToday = now.toDateString() === day.toDateString();

                return (
                  <div key={dateStr} className={clsx("relative h-[1920px]", isToday && "bg-primary/5")}>
                    {dayTasks.map(task => {
                      const start = new Date(task.deadline!);
                      const startPos = (start.getHours() * HOUR_HEIGHT) + (start.getMinutes() / 60 * HOUR_HEIGHT);
                      
                      return (
                        <div 
                          key={task.id}
                          className={clsx(
                            "absolute left-1 right-1 p-1.5 bg-muted/50 border rounded-none text-[10px] hover:border-primary/50 transition-all group z-10 shadow-sm",
                            task.priority === 2 ? "border-foreground" : "border-border/50"
                          )}
                          style={{ top: startPos, height: '45px' }}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className={clsx(
                              "w-1.5 h-1.5 rounded-none",
                              task.priority === 2 ? "bg-foreground" : task.priority === 1 ? "bg-muted-foreground" : "bg-muted"
                            )} />
                            <span className="font-semibold truncate">{task.title}</span>
                          </div>
                          <div className="text-[8px] text-muted-foreground">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
