import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Undo, Redo, Trash2, Maximize, Minus, MousePointer2 } from 'lucide-react';
import { clsx } from 'clsx';

type StrokeSize = 'small' | 'medium' | 'large';

const COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
];

const STROKE_WIDTHS: Record<StrokeSize, number> = {
  small: 2,
  medium: 5,
  large: 10,
};

export const Blackboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeSize, setStrokeSize] = useState<StrokeSize>('medium');
  
  // Undo/Redo State
  const historyRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const MAX_HISTORY = 20;

  const saveState = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const snapshot = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    historyRef.current.push(snapshot);
    
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    
    // Clear redo stack on new action
    redoStackRef.current = [];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to container size
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth * window.devicePixelRatio;
      canvas.height = parent.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context) {
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = color;
      context.lineWidth = STROKE_WIDTHS[strokeSize];
      contextRef.current = context;
      
      // Initial background
      context.fillStyle = '#0a0a0a';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Save initial blank state
      saveState();
    }
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = STROKE_WIDTHS[strokeSize];
    }
  }, [color, strokeSize]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    let offsetX, offsetY;
    if (nativeEvent instanceof MouseEvent) {
      offsetX = nativeEvent.offsetX;
      offsetY = nativeEvent.offsetY;
    } else {
      const rect = (nativeEvent.target as HTMLCanvasElement).getBoundingClientRect();
      offsetX = nativeEvent.touches[0].clientX - rect.left;
      offsetY = nativeEvent.touches[0].clientY - rect.top;
    }

    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    let offsetX, offsetY;
    if (nativeEvent instanceof MouseEvent) {
      offsetX = nativeEvent.offsetX;
      offsetY = nativeEvent.offsetY;
    } else {
      const rect = (nativeEvent.target as HTMLCanvasElement).getBoundingClientRect();
      offsetX = nativeEvent.touches[0].clientX - rect.left;
      offsetY = nativeEvent.touches[0].clientY - rect.top;
    }

    contextRef.current?.lineTo(offsetX, offsetY);
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
    
    const currentState = historyRef.current.pop()!;
    redoStackRef.current.push(currentState);
    
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
    
    if (confirm('Clear all annotations?')) {
      contextRef.current.fillStyle = '#0a0a0a';
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveState();
    }
  };

  return (
    <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden cursor-crosshair">
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
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 p-2 px-4 shadow-2xl flex items-center gap-6 z-50">
        {/* Colors */}
        <div className="flex items-center gap-2 pr-6 border-r border-white/5">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.value)}
              className={clsx(
                "w-5 h-5 rounded-full border transition-all",
                color === c.value ? "scale-125 border-white ring-2 ring-white/20" : "border-transparent opacity-60 hover:opacity-100"
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        {/* Stroke Size */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-none border border-white/5">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setStrokeSize(size)}
              className={clsx(
                "px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all",
                strokeSize === size ? "bg-white text-black" : "text-white/30 hover:text-white"
              )}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pl-6 border-l border-white/5">
          <button 
            onClick={undo}
            disabled={historyRef.current.length <= 1}
            className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>
          <button 
            onClick={redo}
            disabled={redoStackRef.current.length === 0}
            className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <button 
            onClick={clearCanvas}
            className="p-2 text-white/40 hover:text-red-500 transition-colors"
            title="Clear Board"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
