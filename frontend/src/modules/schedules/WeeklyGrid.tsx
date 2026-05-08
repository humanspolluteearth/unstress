import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useScheduleStore } from './useScheduleStore';
import { clsx } from 'clsx';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80;

export const WeeklyGrid: React.FC<{ startDate: Date; onEdit: (id: string) => void }> = ({ startDate, onEdit }) => {
  const { blocks, selectedBlockId, setSelectedBlockId } = useScheduleStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  }), [startDate]);

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
    <div className="flex-1 flex flex-col min-h-0 bg-background border rounded-none overflow-hidden h-full">
      {/* Header */}
      <div className="flex border-b bg-muted/30">
        <div className="w-16 border-r shrink-0" />
        <div className="flex-1 grid grid-cols-7 divide-x">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-2 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
              <p className="text-sm font-bold">{day.getDate()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth"
      >
        <div className="flex min-h-full relative">
          {/* Hour Labels */}
          <div className="w-16 border-r shrink-0 bg-muted/10">
            {HOURS.map(hour => (
              <div key={hour} className="h-20 border-b flex justify-center pt-2 text-[10px] font-mono text-muted-foreground">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x relative">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map(hour => (
                <div key={hour} className="h-20 border-b border-border/30" />
              ))}
            </div>

            {/* Current Time Indicator (Red Line) */}
            <div 
              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: lineTop }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive -ml-1 shadow-sm" />
              <div className="flex-1 h-px bg-destructive shadow-sm" />
            </div>

            {/* Day Content */}
            {weekDays.map(day => {
              const dateStr = day.toISOString().split('T')[0];
              const dayBlocks = (blocks || []).filter(b => b.start_time?.startsWith(dateStr));
              const isToday = now.toDateString() === day.toDateString();

              return (
                <div key={dateStr} className={clsx("relative h-[1920px]", isToday && "bg-primary/5")}>
                  {dayBlocks.map(block => {
                    const start = new Date(block.start_time);
                    const end = new Date(block.end_time);
                    const startPos = (start.getHours() * HOUR_HEIGHT) + (start.getMinutes() / 60 * HOUR_HEIGHT);
                    const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
                    const height = (durationMin / 60) * HOUR_HEIGHT;
                    const isSelected = selectedBlockId === block.id;

                    return (
                      <div 
                        key={block.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBlockId(block.id);
                          onEdit(block.id);
                        }}
                        className={clsx(
                          "absolute left-1 right-1 p-1 rounded-none border text-[9px] font-bold shadow-sm z-10 transition-all overflow-hidden cursor-pointer",
                          block.is_conflict 
                            ? "bg-destructive/20 border-destructive text-destructive" 
                            : isSelected
                              ? "bg-primary text-primary-foreground border-primary z-30"
                              : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                        )}
                        style={{ top: startPos, height, minHeight: '20px' }}
                      >
                        <div className="truncate">{block.title}</div>
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
  );
};
