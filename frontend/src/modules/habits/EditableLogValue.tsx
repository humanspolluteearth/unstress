import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useHabitStore } from './useHabitStore';

interface EditableLogValueProps {
  habitId: string;
  initialValue: number;
  unit: string;
}

export const EditableLogValue: React.FC<EditableLogValueProps> = ({ habitId, initialValue, unit }) => {
  const { updateHabitLog } = useHabitStore();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue.toString());
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue.toString());
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue === initialValue) {
      setIsEditing(false);
      setValue(initialValue.toString());
      return;
    }

    const result = await updateHabitLog(habitId, numericValue);
    if (result.success) {
      setIsEditing(false);
    } else {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setIsEditing(false);
        setValue(initialValue.toString());
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(initialValue.toString());
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-16 bg-transparent border-none p-0 m-0 text-sm font-black focus:outline-none focus:ring-0 text-right appearance-none"
        step="any"
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className={clsx(
        "text-sm font-black cursor-pointer hover:text-primary transition-colors",
        isShaking && "animate-shake text-destructive"
      )}
    >
      {initialValue} {unit === 'rep' ? 'reps' : 'mins'}
    </span>
  );
};
