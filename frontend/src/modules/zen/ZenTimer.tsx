import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, BarChart2, ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

export const ZenTimer: React.FC = () => {
  const [focusTime, setFocusTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [targetLoops, setTargetLoops] = useState(4);
  
  const [timer, setTimer] = useState(focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false); // Controls the full-screen "Focus View"
  
  const [stats, setStats] = useState<{ total_hours: number } | null>(null);
  const [showStats, setShowStats] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timer]);

  const handleTimerComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!isBreak) {
      // Focus session completed
      const newLoopCount = loopCount + 1;
      setLoopCount(newLoopCount);
      
      // Log to backend
      try {
        await fetch(`${getBaseUrl()}${API_ENDPOINTS.FOCUS}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration_minutes: focusTime,
            mode: 'pomodoro'
          })
        });
      } catch (err) {
        console.error('Failed to log focus session', err);
      }

      if (newLoopCount < targetLoops) {
        setIsBreak(true);
        setTimer(breakTime * 60);
      } else {
        setIsActive(false);
        setIsFocusMode(false);
        alert('Target loops reached. Great work.');
      }
    } else {
      // Break completed
      setIsBreak(false);
      setTimer(focusTime * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimer(focusTime * 60);
    setLoopCount(0);
  };

  const startFocus = () => {
    setTimer(focusTime * 60);
    setIsActive(true);
    setIsFocusMode(true);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.FOCUS}/stats`);
      const data = await response.json();
      setStats(data);
      setShowStats(!showStats);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFocusMode) {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center animate-in fade-in duration-700">
        <button 
          onClick={() => setIsFocusMode(false)}
          className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 uppercase text-[10px] font-black tracking-widest"
        >
          <ChevronLeft size={16} /> Exit Zen
        </button>

        <div className="text-center space-y-8">
          <div className="space-y-2">
            <span className={clsx(
              "text-[10px] font-black uppercase tracking-[0.4em]",
              isBreak ? "text-emerald-500" : "text-primary"
            )}>
              {isBreak ? 'Interval: Break' : `Focus: Session ${loopCount + 1}/${targetLoops}`}
            </span>
            <h1 className="text-[12rem] font-black tracking-tighter leading-none tabular-nums select-none">
              {formatTime(timer)}
            </h1>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={toggleTimer}
              className="w-20 h-20 rounded-none border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all active:scale-95"
            >
              {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            <button 
              onClick={resetTimer}
              className="w-20 h-20 rounded-none border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all active:scale-95 text-muted-foreground"
            >
              <RotateCcw size={28} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
          <div 
            className={clsx("h-full transition-all duration-1000 ease-linear", isBreak ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${(timer / ((isBreak ? breakTime : focusTime) * 60)) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 flex flex-col items-center justify-center space-y-12 flex-1 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tight uppercase">Zen Timer</h2>
        <p className="text-muted-foreground text-sm tracking-wide">Calibrate your focus intervals for maximum cognitive throughput.</p>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-3 gap-8 w-full max-w-2xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Focus (Mins)</label>
          <input 
            type="number" 
            value={focusTime}
            onChange={(e) => setFocusTime(parseInt(e.target.value) || 1)}
            className="w-full bg-card border-b-2 border-white/5 focus:border-primary px-4 py-3 text-2xl font-mono font-bold outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Break (Mins)</label>
          <input 
            type="number" 
            value={breakTime}
            onChange={(e) => setBreakTime(parseInt(e.target.value) || 1)}
            className="w-full bg-card border-b-2 border-white/5 focus:border-primary px-4 py-3 text-2xl font-mono font-bold outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Loops</label>
          <input 
            type="number" 
            value={targetLoops}
            onChange={(e) => setTargetLoops(parseInt(e.target.value) || 1)}
            className="w-full bg-card border-b-2 border-white/5 focus:border-primary px-4 py-3 text-2xl font-mono font-bold outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <button 
          onClick={startFocus}
          className="w-full py-8 border-2 border-white/10 text-2xl font-black uppercase tracking-[0.2em] hover:bg-white/5 hover:border-primary/50 transition-all active:scale-95 group relative overflow-hidden"
        >
          <span className="relative z-10">Start Protocol</span>
          <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </button>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={fetchStats}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <BarChart2 size={14} /> {showStats ? 'Hide Metrics' : 'System Stats'}
          </button>

          {showStats && stats && (
            <div className="bg-card border border-white/5 p-4 animate-in zoom-in-95 duration-200">
              <span className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Total Cumulative Focus</span>
              <span className="text-3xl font-black tabular-nums tracking-tighter text-primary">
                {stats.total_hours.toFixed(2)} <small className="text-xs uppercase ml-1">Hours</small>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
