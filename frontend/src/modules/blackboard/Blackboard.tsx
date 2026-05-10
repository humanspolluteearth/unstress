import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Undo, Redo, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

const COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
];

export const Blackboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // Undo/Redo State
  const historyRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const MAX_HISTORY = 30;

  const saveState = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const snapshot = contextRef.current.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    redoStackRef.current = [];
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context) {
      context.scale(dpr, dpr);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      // Theme background
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#0a0a0a';
      context.fillStyle = bgColor;
      context.fillRect(0, 0, rect.width, rect.height);
      
      contextRef.current = context;
      saveState();
    }
  }, [saveState]);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = strokeWidth;
    }
  }, [color, strokeWidth]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e.nativeEvent) {
      return {
        x: e.nativeEvent.touches[0].clientX - rect.left,
        y: e.nativeEvent.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).nativeEvent.offsetX,
        y: (e as React.MouseEvent).nativeEvent.offsetY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      contextRef.current?.closePath();
      setIsDrawing(false);
      saveState();
    }
  };

  const undo = () => {
    if (historyRef.current.length <= 1 || !contextRef.current) return;
    redoStackRef.current.push(historyRef.current.pop()!);
    const prevState = historyRef.current[historyRef.current.length - 1];
    contextRef.current.putImageData(prevState, 0, 0);
  };

  const redo = () => {
    if (redoStackRef.current.length === 0 || !contextRef.current) return;
    const nextState = redoStackRef.current.pop()!;
    historyRef.current.push(nextState);
    contextRef.current.putImageData(nextState, 0, 0);
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#0a0a0a';
    contextRef.current.fillStyle = bgColor;
    contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveState();
  };

  return (
    <div ref={containerRef} className="relative flex-1 bg-background overflow-hidden cursor-crosshair select-none touch-none">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="block"
      />

      {/* Floating Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-xl border border-white/5 p-3 px-6 shadow-2xl flex items-center gap-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Colors */}
        <div className="flex items-center gap-2 pr-8 border-r border-white/5">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.value)}
              className={clsx(
                "w-4 h-4 rounded-full border transition-all",
                color === c.value ? "scale-125 border-white ring-4 ring-white/10" : "border-transparent opacity-40 hover:opacity-100"
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Stroke Width Slider */}
        <div className="flex flex-col gap-1 items-center">
           <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Width</span>
           <input 
            type="range" 
            min="1" 
            max="15" 
            step="0.5"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
            className="w-32 h-1 bg-white/10 rounded-none appearance-none cursor-pointer accent-primary hover:bg-white/20 transition-all"
           />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pl-8 border-l border-white/5">
          <button onClick={undo} disabled={historyRef.current.length <= 1} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-10 transition-colors">
            <Undo size={14} />
          </button>
          <button onClick={redo} disabled={redoStackRef.current.length === 0} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-10 transition-colors">
            <Redo size={14} />
          </button>
          <div className="w-px h-4 bg-white/5 mx-2" />
          <button onClick={clearCanvas} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
