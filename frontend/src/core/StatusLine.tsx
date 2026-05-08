import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { listen } from '@tauri-apps/api/event';

interface StatusLineProps {
  pageTitle: string;
}

export const StatusLine: React.FC<StatusLineProps> = ({ pageTitle }) => {
  const { theme } = useTheme();
  const [lastEvent, setLastEvent] = useState<string>('System Ready');

  useEffect(() => {
    const eventTypes = [
      'TASK_COMPLETED',
      'TASK_CREATED',
      'FINANCE_TRANSACTION_ADDED',
      'HABIT_LOGGED',
      'GOAL_UPDATE',
      'SCHEDULE_CONFLICT_DETECTED',
      'GOAL_FOCUS_CHANGED',
      'GOAL_PROGRESS_ADJUSTED'
    ];

    const unlistens = eventTypes.map(async (type) => {
      return await listen(type, () => {
        const msg = type.replace(/_/g, ' ').toLowerCase();
        const capitalized = msg.charAt(0).toUpperCase() + msg.slice(1);
        setLastEvent(capitalized);
      });
    });

    return () => {
      unlistens.forEach(async (u) => {
        const fn = await u;
        fn();
      });
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 bg-muted/80 backdrop-blur-sm border-t border-border/50 flex items-center px-4 justify-between z-[100] pointer-events-none select-none">
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-medium">
        <div className="flex items-center gap-1.5">
          <span className="text-primary font-black">UNSTRESS</span>
          <span className="opacity-30">/</span>
          <span className="text-foreground">{pageTitle}</span>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-hidden max-w-[300px] md:max-w-md">
          <span className="opacity-30">|</span>
          <span className="truncate whitespace-nowrap">Last Event: {lastEvent}</span>
        </div>
      </div>

      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-4">
         <div className="flex items-center gap-1.5">
          <span>{theme}</span>
          <span className="opacity-30">|</span>
        </div>
        <span>UTF-8</span>
      </div>
    </div>
  );
};
