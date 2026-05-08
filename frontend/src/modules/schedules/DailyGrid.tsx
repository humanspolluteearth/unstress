import React from 'react';
import { useScheduleStore, TimeBlock } from './useScheduleStore';
import { clsx } from 'clsx';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DailyGrid: React.FC<{ date: Date }> = ({ date }) => {
  const { blocks } = useScheduleStore();
  
  const dateStr = date.toISOString().split('T')[0];
  const dayBlocks = blocks.filter(b => b.start_time.startsWith(dateStr));

  return (
    <div className="flex-1 overflow-y-auto bg-background relative min-h-[600px] border rounded-none">
      {HOURS.map((hour) => (
        <div key={hour} className="h-20 border-b flex group relative">
          <div className="w-16 border-r flex justify-center pt-2 text-[10px] font-mono text-muted-foreground bg-muted/20">
            {hour.toString().padStart(2, '0')}:00
          </div>
          <div className="flex-1 relative group-hover:bg-muted/5 transition-colors">
            {dayBlocks.map(block => {
              const start = new Date(block.start_time);
              const end = new Date(block.end_time);
              const startHour = start.getHours();
              const startMin = start.getMinutes();
              const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);

              if (startHour === hour) {
                return (
                  <div
                    key={block.id}
                    className={clsx(
                      "absolute left-2 right-2 p-2 rounded-none border text-[10px] font-bold shadow-sm z-10 transition-all",
                      block.is_conflict 
                        ? "bg-destructive/20 border-destructive text-destructive" 
                        : "bg-primary/10 border-primary/30 text-primary"
                    )}
                    style={{ 
                      top: `${(startMin / 60) * 100}%`, 
                      height: `${(durationMin / 60) * 80}px`,
                      minHeight: '24px'
                    }}
                  >
                    <div className="truncate">{block.title}</div>
                    {durationMin >= 45 && (
                      <div className="opacity-70 font-normal">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
