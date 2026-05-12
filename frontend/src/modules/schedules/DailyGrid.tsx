import React, { useEffect, useState, useRef } from 'react';
import { useScheduleStore, TimeBlock } from './useScheduleStore';
import { clsx } from 'clsx';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80; // Match h-20 (5rem = 80px)

export const DailyGrid: React.FC<{ date: Date; onEdit: (id: string) => void }> = ({ date, onEdit }) => {
  const { blocks, selectedBlockId, setSelectedBlockId } = useScheduleStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  
  const dateStr = date.toLocaleDateString('en-CA');
  const dayBlocks = (blocks || []).filter(b => {
    if (!b.start_time) return false;
    return new Date(b.start_time).toLocaleDateString('en-CA') === dateStr;
  });

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
  const isToday = now.toDateString() === date.toDateString();

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-background relative min-h-[600px] border rounded-none scroll-smooth"
    >
      {/* Current Time Indicator (Red Line) */}
      {isToday && (
        <div 
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
          style={{ top: lineTop }}
        >
          <div className="w-2 h-2 rounded-full bg-destructive -ml-1 shadow-sm" />
          <div className="flex-1 h-px bg-destructive shadow-sm" />
          <div className="pr-2 pl-1 bg-destructive text-destructive-foreground text-[8px] font-bold uppercase tracking-tighter">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}

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
              const isSelected = selectedBlockId === block.id;

              if (startHour === hour) {
                return (
                  <div
                    key={block.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBlockId(block.id);
                      onEdit(block.id);
                    }}
                    className={clsx(
                      "absolute left-2 right-2 p-2 rounded-none border text-[10px] font-bold shadow-sm z-10 transition-all cursor-pointer",
                      block.is_conflict 
                        ? "bg-destructive/20 border-destructive text-destructive" 
                        : isSelected
                          ? "bg-primary text-primary-foreground border-primary z-30"
                          : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    )}
                    style={{ 
                      top: `${(startMin / 60) * 100}%`, 
                      height: `${(durationMin / 60) * HOUR_HEIGHT}px`,
                      minHeight: '24px'
                    }}
                  >
                    <div className="truncate">{block.title}</div>
                    {durationMin >= 45 && (
                      <div className={clsx("opacity-70 font-normal", isSelected ? "text-primary-foreground/80" : "")}>
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
