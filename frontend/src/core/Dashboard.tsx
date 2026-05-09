import React, { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '../modules/tasks/useTaskStore';
import { useHabitStore } from '../modules/habits/useHabitStore';
import { useGoalStore } from '../modules/goals/useGoalStore';
import { useScheduleStore } from '../modules/schedules/useScheduleStore';
import { useNavigationStore } from './useNavigationStore';

const numberToWords = (num: number): string => {
  const words = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"
  ];
  return num <= 20 ? words[num] : num.toString();
};

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Goodnight";
};

export const Dashboard: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const { habits, fetchHabits } = useHabitStore();
  const { goals, fetchGoals } = useGoalStore();
  const { blocks, fetchBlocks } = useScheduleStore();
  const { navigate } = useNavigationStore();

  const [userName, setUserName] = useState(() => localStorage.getItem('user-name') || "Sayeem");
  const [intentText, setIntentText] = useState(() => localStorage.getItem('dashboard-intent') || "Stay intentional with your time and execute your plan with precision.");

  const greeting = useMemo(() => getTimeGreeting(), []);

  useEffect(() => {
    fetchTasks();
    fetchHabits();
    fetchGoals();
    fetchBlocks();
  }, []);

  const taskCountWord = useMemo(() => numberToWords(tasks.filter((t: any) => t.status !== 'Done').length), [tasks]);
  
  const habitStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const completed = habits.filter((h: any) => h.logs.some((l: any) => l.timestamp.startsWith(today))).length;
    return { leftWord: numberToWords(habits.length - completed) };
  }, [habits]);

  const nextEvent = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const todayEvents = blocks.filter((b: any) => new Date(b.start_time).toDateString() === todayStr);
    
    const upcoming = todayEvents
      .filter((b: any) => new Date(b.start_time) > now)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return upcoming.length > 0 ? upcoming[0] : todayEvents.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];
  }, [blocks]);

  const currentFocus = useMemo(() => goals.find((g: any) => g.is_current_focus)?.name || "Clear Horizon", [goals]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-1000">
      <header className="w-full max-w-3xl text-left">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          {greeting},{' '}
          <span 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newName = e.currentTarget.textContent || "Sayeem";
              setUserName(newName);
              localStorage.setItem('user-name', newName);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLElement).blur();
              }
            }}
            className="outline-none border-b border-transparent focus:border-primary/50 cursor-text"
          >
            {userName}
          </span>.
        </h1>
        <p className="text-2xl text-muted-foreground font-medium leading-relaxed">
          You have <span onClick={() => navigate('tasks')} className="text-foreground font-bold hover:underline cursor-pointer transition-all decoration-primary/50 underline-offset-4">{taskCountWord}</span> tasks remaining and{' '}
          <span onClick={() => navigate('habits')} className="text-foreground font-bold hover:underline cursor-pointer transition-all decoration-primary/50 underline-offset-4">{habitStats.leftWord}</span> habits left for today. 
          {nextEvent && (
            <> You have <span onClick={() => navigate('schedule')} className="text-foreground font-bold hover:underline cursor-pointer transition-all decoration-primary/50 underline-offset-4">{nextEvent.title}</span> at {' '}
            <span className="text-foreground font-bold">
              {new Date(nextEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>. </>
          )}
          Your current focus is <span onClick={() => navigate('goals')} className="text-foreground font-bold hover:underline cursor-pointer transition-all decoration-primary/50 underline-offset-4">{currentFocus}</span>, and you are choosing to{' '}
          <span 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newText = e.currentTarget.textContent || "";
              setIntentText(newText);
              localStorage.setItem('dashboard-intent', newText);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLElement).blur();
              }
            }}
            className="cursor-text hover:text-foreground transition-colors outline-none border-b border-dashed border-primary/20 focus:border-primary/50 inline"
            title="Click to edit"
          >
            {intentText || "set your intention for today"}
          </span>.
        </p>
      </header>
    </div>
  );
};
