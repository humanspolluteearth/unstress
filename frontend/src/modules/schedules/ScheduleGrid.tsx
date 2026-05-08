import React, { useEffect, useState } from 'react';
import { useScheduleStore } from './useScheduleStore';
import { DailyGrid } from './DailyGrid';
import { WeeklyGrid } from './WeeklyGrid';
import { MonthlyGrid } from './MonthlyGrid';
import { AddEventModal } from './AddEventModal';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, AlertCircle, LayoutGrid, List, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';
import { listen } from '@tauri-apps/api/event';

type ViewMode = 'Day' | 'Week' | 'Month';

export const ScheduleGrid: React.FC = () => {
  const { blocks, isLoading, fetchBlocks, markConflicts } = useScheduleStore();
  const [viewMode, setViewMode] = useState<ViewMode>('Day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBlocks();
    
    // Listen for conflict events from backend
    const unlisten = listen('SCHEDULE_CONFLICT_DETECTED', (event: any) => {
      setConflictMsg(`Conflict detected for "${event.payload.new_event.title}"`);
      markConflicts(event.payload.conflicts);
      setTimeout(() => setConflictMsg(null), 6000);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [fetchBlocks, markConflicts]);

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Day') newDate.setDate(newDate.getDate() + direction);
    else if (viewMode === 'Week') newDate.setDate(newDate.getDate() + direction * 7);
    else if (viewMode === 'Month') newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderView = () => {
    switch (viewMode) {
      case 'Day': return <DailyGrid date={currentDate} />;
      case 'Week': return <WeeklyGrid startDate={currentDate} />;
      case 'Month': return <MonthlyGrid year={currentDate.getFullYear()} month={currentDate.getMonth()} />;
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col flex-1 min-h-0 bg-background/50 overflow-auto relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Schedule</h2>
          <p className="text-muted-foreground text-sm">Coordinate your time and resolve conflicts.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-none border">
            <button
              onClick={() => setViewMode('Day')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                viewMode === 'Day' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid size={14} /> Day
            </button>
            <button
              onClick={() => setViewMode('Week')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                viewMode === 'Week' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={14} /> Week
            </button>
            <button
              onClick={() => setViewMode('Month')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all",
                viewMode === 'Month' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays size={14} /> Month
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Event
          </button>
        </div>
      </header>

      {conflictMsg && (
        <div className="absolute top-4 right-6 left-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-destructive text-destructive-foreground p-3 rounded-none shadow-lg flex items-center gap-3 border border-destructive-foreground/20">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{conflictMsg}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-card p-3 rounded-none border shadow-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold">
            {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: viewMode === 'Day' ? 'numeric' : undefined })}
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-none transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-[10px] font-bold uppercase hover:bg-muted rounded-none transition-colors">Today</button>
            <button onClick={() => navigate(1)} className="p-1 hover:bg-muted rounded-none transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {renderView()}
      </div>

      <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
