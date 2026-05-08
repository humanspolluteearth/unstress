import React from 'react';
import { useScheduleStore } from './useScheduleStore';
import { clsx } from 'clsx';

export const WeeklyGrid: React.FC<{ startDate: Date }> = ({ startDate }) => {
  const { blocks } = useScheduleStore();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background border rounded-none overflow-hidden h-full">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-2 text-center border-r last:border-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
            <p className="text-sm font-bold">{day.getDate()}</p>
          </div>
        ))}
      </div>
      
      <div className="flex-1 flex divide-x overflow-y-auto min-h-0 custom-scrollbar">
        {weekDays.map(day => {
          const dateStr = day.toISOString().split('T')[0];
          const dayBlocks = blocks.filter(b => b.start_time.startsWith(dateStr));
          
          return (
            <div key={dateStr} className="flex-1 min-w-[120px] p-2 space-y-2 bg-muted/5">
              {dayBlocks.map(block => {
                const start = new Date(block.start_time);
                const end = new Date(block.end_time);
                
                return (
                  <div 
                    key={block.id}
                    className={clsx(
                      "p-2 rounded-none border text-[10px] font-semibold transition-all",
                      block.is_conflict 
                        ? "bg-destructive/20 border-destructive text-destructive" 
                        : "bg-primary/5 border-primary/20 text-primary"
                    )}
                  >
                    <div className="truncate mb-1">{block.title}</div>
                    <div className="opacity-60 font-normal">
                      {start.getHours()}:{start.getMinutes().toString().padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
