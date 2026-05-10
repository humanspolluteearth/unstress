import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, BarChart2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { getBaseUrl, API_ENDPOINTS } from '../../core/apiConfig';

/**
 * Immersive Zen Pomodoro Timer
 */
export const ZenTimer: React.FC = () => {
  const [focusTime, setFocusTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [targetLoops, setTargetLoops] = useState(4);
  
  const [timer, setTimer] = useState(focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const [stats, setStats] = useState<{ total_hours: number } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Feedback: Standard Web Audio API Chime
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // A4

      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error('[Zen] Audio Failed:', e);
    }
  };

  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      playChime();
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timer]);

  // Handle ESC key and Mouse movement in Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    const handleMouseMove = () => {
      if (!isFocusMode) return;
      setShowExit(true);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = setTimeout(() => setShowExit(false), 3000);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isFocusMode]);

  const handleTimerComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!isBreak) {
      const newLoopCount = loopCount + 1;
      setLoopCount(newLoopCount);
      
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
        alert('Protocol Complete. Systems Calibrated.');
      }
    } else {
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
      <div className="fixed inset-0 z-[200] bg-[#000000] flex flex-col items-center justify-center animate-in fade-in duration-1000 cursor-none">
        <button 
          onClick={() => setIsFocusMode(false)}
          className={clsx(
            "absolute top-8 right-8 text-white/10 hover:text-white transition-opacity duration-500 flex items-center gap-2 uppercase text-[10px] font-black tracking-widest",
            showExit ? "opacity-100" : "opacity-0"
          )}
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <h1 className="text-[14rem] font-extralight tracking-tighter leading-none tabular-nums select-none text-white/90">
            {formatTime(timer)}
          </h1>
        </div>

        <div className="absolute bottom-12 flex flex-col items-center gap-2">
          <span className={clsx(
            "text-[9px] font-black uppercase tracking-[0.6em]",
            isBreak ? "text-emerald-500" : "text-white/20"
          )}>
            {isBreak ? 'Interval: Refresh' : `Loop ${loopCount + 1} / ${targetLoops}`}
          </span>
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
