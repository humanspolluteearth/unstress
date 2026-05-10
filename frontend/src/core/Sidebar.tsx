import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  CheckSquare, 
  RotateCcw, 
  Wallet, 
  Settings,
  PencilLine,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

export type PageId = 'dashboard' | 'goals' | 'schedule' | 'tasks' | 'habits' | 'finance' | 'settings' | 'blackboard';

interface SidebarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'habits', label: 'Habits', icon: RotateCcw },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'blackboard', label: 'Blackboard', icon: PencilLine },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  return (
    <aside className="w-64 bg-card border-r flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 px-2 mb-8 text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <X size={20} className="rotate-45" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-foreground">unstress</h1>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group",
                activePage === item.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={18} className={clsx(
                "transition-colors",
                activePage === item.id ? "text-primary-foreground" : "text-muted-foreground/60 group-hover:text-foreground"
              )} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t bg-muted/20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 shadow-inner" />
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">Arch User</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Rolling Release</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
