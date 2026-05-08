import React from 'react';
import { useScheduleStore } from './useScheduleStore';
import { clsx } from 'clsx';

export const MonthlyGrid: React.FC<{ year: number; month: number; onEdit?: (id: string) => void }> = ({ year, month, onEdit }) => {
  const { blocks, selectedBlockId, setSelectedBlockId } = useScheduleStore();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    if (day > 0 && day <= daysInMonth) {
      return new Date(year, month, day);
    }
    return null;
  });

  return (
    <div className="flex-1 grid grid-cols-7 border rounded-none overflow-hidden bg-background divide-x divide-y">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
        <div key={d} className="p-2 text-center text-[10px] font-bold uppercase text-muted-foreground bg-muted/30 border-b">
          {d}
        </div>
      ))}
      {calendarDays.map((date, i) => {
        if (!date) return <div key={i} className="bg-muted/10 h-24" />;
        
        const dateStr = date.toISOString().split('T')[0];
        const dayBlocks = blocks.filter(b => b.start_time.startsWith(dateStr));
        const hasConflict = dayBlocks.some(b => b.is_conflict);

        return (
          <div key={dateStr} className="p-1 h-24 overflow-hidden relative hover:bg-muted/5 transition-colors">
            <span className="text-[10px] font-mono text-muted-foreground absolute top-1 right-2">
              {date.getDate()}
            </span>
            <div className="mt-4 space-y-0.5">
              {dayBlocks.slice(0, 3).map(block => {
                const isSelected = selectedBlockId === block.id;
                return (
                  <div 
                    key={block.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        onEdit?.(block.id);
                      } else {
                        setSelectedBlockId(block.id);
                      }
                    }}
                    className={clsx(
                      "text-[8px] px-1 rounded-none truncate border cursor-pointer transition-all",
                      block.is_conflict 
                        ? "bg-destructive/20 border-destructive text-destructive" 
                        : isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                    )}
                  >
                    {block.title}
                  </div>
                );
              })}
              {dayBlocks.length > 3 && (
                <div className="text-[8px] text-muted-foreground pl-1">
                  + {dayBlocks.length - 3} more
                </div>
              )}
            </div>
            {hasConflict && (
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-destructive rounded-none" />
            )}
          </div>
        );
      })}
    </div>
  );
};
