import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getBaseUrl } from './apiConfig';

interface StatusLineProps {
  pageTitle: string;
}

export const StatusLine: React.FC<StatusLineProps> = ({ pageTitle }) => {
  const { theme } = useTheme();
  const [lastEvent, setLastEvent] = useState<string>('System Ready');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    const checkTimeSync = async () => {
      try {
        const frontendTime = new Date().getTime();
        
        // 1. Get Rust system time via Invoke
        const rustResult: any = await invoke('get_system_time');
        if (!rustResult.success) throw new Error("Rust time fetch failed");
        const rustTime = new Date(rustResult.data).getTime();

        // 2. Get FastAPI sidecar time
        // Wait for port to be available
        let port = (window as any).__BACKEND_PORT__;
        let attempts = 0;
        while (!port && attempts < 10) {
          await new Promise(r => setTimeout(r, 500));
          port = (window as any).__BACKEND_PORT__;
          attempts++;
        }

        if (port) {
          const baseUrl = getBaseUrl();
          const resp = await fetch(`${baseUrl}/system-time`);
          const sidecarResult = await resp.json();
          if (sidecarResult.success) {
            const sidecarTime = new Date(sidecarResult.data.time).getTime();
            
            const diffRust = Math.abs(frontendTime - rustTime);
            const diffSidecar = Math.abs(frontendTime - sidecarTime);

            if (diffRust > 60000 || diffSidecar > 60000) {
              setSyncError(true);
            }
          }
        }
      } catch (e) {
        console.error("Time sync check failed:", e);
      }
    };

    checkTimeSync();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const eventTypes = [
      'TASK_COMPLETED',
      'TASK_CREATED',
      'FINANCE_TRANSACTION_ADDED',
      'HABIT_LOGGED',
      'HABIT_UPDATED',
      'GOAL_CREATED',
      'GOAL_UPDATE',
      'SCHEDULE_CONFLICT_DETECTED',
      'GOAL_FOCUS_CHANGED',
      'GOAL_PROGRESS_ADJUSTED'
    ];

    const unlistens = eventTypes.map(async (type) => {
      return await listen(type, (event: any) => {
        if (type === 'HABIT_UPDATED') {
          const { value, unit } = event.payload;
          setLastEvent(`Habit Updated: ${value} ${unit === 'rep' ? 'reps' : 'mins'}`);
        } else {
          const msg = type.replace(/_/g, ' ').toLowerCase();
          const capitalized = msg.charAt(0).toUpperCase() + msg.slice(1);
          setLastEvent(capitalized);
        }
      });
    });

    return () => {
      unlistens.forEach(async (u) => {
        const fn = await u;
        fn();
      });
    };
  }, []);

  const formatDate = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d} | ${hh}:${mm}:${ss}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 bg-black border-t border-primary/20 flex items-center px-4 justify-between z-[100] pointer-events-none select-none">
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

        {syncError && (
          <div className="flex items-center gap-1.5 px-2 bg-destructive text-destructive-foreground animate-pulse">
            <span className="font-bold">TIME_SYNC_ERROR</span>
          </div>
        )}
      </div>

      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary font-bold">{formatDate(currentTime)}</span>
          <span className="opacity-30">|</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>{theme}</span>
          <span className="opacity-30">|</span>
        </div>
        <span>UTF-8</span>
      </div>
    </div>
  );
};
