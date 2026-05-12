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
  
  // Ref for tracking points to ensure continuous smooth strokes
  const lastPoint = useRef<{ x: number, y: number } | null>(null);
  const midPoint = useRef<{ x: number, y: number } | null>(null);
  
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

  const initCanvas = useCallback((isResize = false) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Capture existing content if resizing
    let tempCanvas: HTMLCanvasElement | null = null;
    if (isResize && contextRef.current) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);
    }

    const dpr = window.devicePixelRatio || 2;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
    if (context) {
      context.scale(dpr, dpr);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#0a0a0a';
      context.fillStyle = bgColor;
      context.fillRect(0, 0, rect.width, rect.height);
      
      contextRef.current = context;

      if (isResize && tempCanvas) {
        // Redraw captured content
        context.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr);
      } else {
        historyRef.current = [];
        redoStackRef.current = [];
        saveState();
      }
    }
  }, [saveState]);

  const undo = useCallback(() => {
    if (historyRef.current.length <= 1 || !contextRef.current || !canvasRef.current) return;
    redoStackRef.current.push(historyRef.current.pop()!);
    const prevState = historyRef.current[historyRef.current.length - 1];
    contextRef.current.putImageData(prevState, 0, 0);
  }, []);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0 || !contextRef.current || !canvasRef.current) return;
    const nextState = redoStackRef.current.pop()!;
    historyRef.current.push(nextState);
    contextRef.current.putImageData(nextState, 0, 0);
  }, []);

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#0a0a0a';
    contextRef.current.fillStyle = bgColor;
    contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveState();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    initCanvas(false);
    const handleResize = () => initCanvas(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    const clientX = 'touches' in e.nativeEvent ? (e.nativeEvent as TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e.nativeEvent ? (e.nativeEvent as TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    lastPoint.current = { x, y };
    midPoint.current = { x, y };
    
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint.current || !midPoint.current || !contextRef.current) return;
    
    const { x, y } = getCoordinates(e);
    const ctx = contextRef.current;

    // Calculate new midpoint
    const newMidX = (lastPoint.current.x + x) / 2;
    const newMidY = (lastPoint.current.y + y) / 2;

    // Draw from the last midpoint to the new midpoint, using the last point as a control point
    ctx.beginPath();
    ctx.moveTo(midPoint.current.x, midPoint.current.y);
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, newMidX, newMidY);
    ctx.stroke();

    // Store points for next segment
    lastPoint.current = { x, y };
    midPoint.current = { x: newMidX, y: newMidY };
  };

  const stopDrawing = () => {
    if (isDrawing && contextRef.current) {
      // Finish the line to the final point
      if (lastPoint.current) {
        contextRef.current.lineTo(lastPoint.current.x, lastPoint.current.y);
        contextRef.current.stroke();
      }
      
      setIsDrawing(false);
      lastPoint.current = null;
      midPoint.current = null;
      saveState();
    }
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
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-xl border border-white/5 p-3 px-6 shadow-2xl flex items-center gap-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-none">
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
        <div className="flex items-center">
           <input 
            type="range" 
            min="1" 
            max="20" 
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
