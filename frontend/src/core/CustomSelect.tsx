import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: { label: string; value: any; icon?: React.ReactNode }[];
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label, 
  icon, 
  className,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={clsx("relative", !compact && "space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium flex items-center gap-1.5">
          {icon} {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full bg-muted/50 border rounded-none px-3 py-2 text-sm flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all hover:bg-muted/70",
          compact && "py-1 px-2 text-xs bg-transparent border-transparent hover:border-border/50"
        )}
      >
        <span className={clsx("flex items-center gap-2", !selectedOption && "text-muted-foreground")}>
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={compact ? 12 : 14} className={clsx("transition-transform shrink-0 ml-2", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className={clsx(
            "absolute left-0 right-0 mt-0 bg-card border rounded-none shadow-xl z-[110] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100",
            compact ? "top-full min-w-[120px] w-max" : "top-full"
          )}>
            {options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2",
                  opt.value === value && "bg-primary/10 font-medium text-primary"
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
