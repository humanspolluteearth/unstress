import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, BarChart2, ChevronLeft, X } from 'lucide-react';
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle ESC key in Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const InlineInput: React.FC<{ value: number, onChange: (v: number) => void }> = ({ value, onChange }) => (
    <input 
      type="number" 
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 1)}
      className="bg-transparent border-b border-primary/40 focus:border-primary text-primary font-black px-1 outline-none transition-all text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none inline-block"
      style={{ width: `${Math.max(1, value.toString().length + 0.5)}ch` }}
    />
  );

  return (
    <div className="p-12 flex flex-col items-center justify-center min-h-full space-y-12 animate-in fade-in duration-500 overflow-hidden relative">
      <div className="max-w-4xl text-center leading-[1.6]">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white/90 uppercase">
          Focus for <InlineInput value={focusTime} onChange={setFocusTime} /> minutes 
          <br className="hidden md:block" /> with <InlineInput value={breakTime} onChange={setBreakTime} /> minutes breaks 
          <br className="hidden md:block" /> for <InlineInput value={targetLoops} onChange={setTargetLoops} /> times.
          {" "}
          <button 
            onClick={startFocus}
            className="text-primary hover:text-primary/80 underline decoration-primary/30 underline-offset-8 transition-all active:scale-95 inline-block ml-2"
          >
            Start Now
          </button>
        </h1>
      </div>

      {/* System Stats in Corner */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4">
        {showStats && stats && (
          <div className="bg-card border border-white/5 p-4 animate-in slide-in-from-bottom-2 duration-200 shadow-2xl">
            <span className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Total Cumulative Focus</span>
            <span className="text-2xl font-black tabular-nums tracking-tighter text-primary">
              {stats.total_hours?.toFixed(2) ?? '0.00'} <small className="text-[10px] uppercase ml-1 opacity-50">Hours</small>
            </span>
          </div>
        )}

        <button 
          onClick={fetchStats}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-sm px-3 py-1.5 border border-white/5"
        >
          <BarChart2 size={14} /> {showStats ? 'Hide Metrics' : 'System Stats'}
        </button>
      </div>
    </div>
  );
};
