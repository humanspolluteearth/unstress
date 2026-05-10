import React, { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

interface CommandBarProps {
  onNavigate: (page: string) => void;
}

const COMMAND_MAP: Record<string, string> = {
  'h': 'habits',
  'f': 'finance',
  't': 'tasks',
  's': 'schedule',
  'g': 'goals',
  'b': 'blackboard',
  'blackboard': 'blackboard',
  'db': 'dashboard',
  'settings': 'settings',
};

export const CommandBar: React.FC<CommandBarProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ':' && !isVisible) {
        // Only trigger if not already typing in an input (though Vim-style users might expect it)
        const active = document.activeElement;
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
        if (!isInput) {
          e.preventDefault();
          setIsVisible(true);
          setCommand(':');
          window.dispatchEvent(new CustomEvent('command-bar-opened'));
        }
      } else if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
        setCommand('');
        window.dispatchEvent(new CustomEvent('command-bar-closed'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleExecute = () => {
    const rawCmd = command.startsWith(':') ? command.slice(1).trim() : command.trim();
    const cmd = rawCmd.toLowerCase();
    
    if (cmd === 'd' || cmd === 'delete') {
      window.dispatchEvent(new CustomEvent('command-delete-event'));
    } else {
      const target = COMMAND_MAP[cmd] || (cmd === 'blackboard' ? 'blackboard' : null);
      if (target) {
        onNavigate(target);
      }
    }
    
    setIsVisible(false);
    setCommand('');
    window.dispatchEvent(new CustomEvent('command-bar-closed'));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] animate-in slide-in-from-bottom-2 duration-150">
      <div className="bg-background/95 backdrop-blur-md border-t border-primary/20 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-4 py-2 flex items-center gap-2">
        <span className="text-primary font-mono font-bold">:</span>
        <input
          ref={inputRef}
          type="text"
          value={command.startsWith(':') ? command.slice(1) : command}
          onChange={(e) => setCommand(':' + e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleExecute();
            if (e.key === 'Escape') setIsVisible(false);
          }}
          className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/50"
          placeholder="h (Habits), f (Finance), t (Tasks), s (Schedule)..."
          autoFocus
        />
        <div className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase tracking-tighter">
          Enter to execute
        </div>
      </div>
    </div>
  );
};
