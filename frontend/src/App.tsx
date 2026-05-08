import React, { useState, useCallback } from 'react';
import { FinanceLedger } from './modules/finance/FinanceLedger';
import { Dashboard } from './modules/core/Dashboard';
import { CommandPalette } from './modules/core/CommandPalette';
import { CommandBar } from './core/CommandBar';
import { TaskDashboard } from './modules/tasks/TaskDashboard';
import { HabitChecklist } from './modules/habits/HabitChecklist';
import { GoalDashboard } from './modules/goals/GoalDashboard';
import { ScheduleGrid } from './modules/schedules/ScheduleGrid';
import { SettingsPage } from './modules/core/SettingsPage';
import { useKeyboardNavigation, PageId } from './core/useKeyboardNavigation';
import { Result } from './core/results';
import { StatusLine } from './core/StatusLine';
import { clsx } from 'clsx';
import { useNavigationStore } from './core/useNavigationStore';

export const App: React.FC = () => {
  const { activePage, navigate } = useNavigationStore();

  useKeyboardNavigation(navigate);

  const isBoard = activePage === 'tasks' || activePage === 'schedule';

  const renderPage = () => {
    // pageClass ensures scrollable pages grow (min-h-full) while boards stay pinned (flex-1)
    const pageClass = clsx(
      "animate-in slide-in-from-right-4 duration-300 flex-1 flex flex-col",
      isBoard ? "h-full min-h-0" : "min-h-full"
    );

    switch (activePage) {
      case 'dashboard':
        return <div className={pageClass}><Dashboard /></div>;
      case 'goals':
        return <div className={pageClass}><GoalDashboard /></div>;
      case 'schedule':
        return <div className={pageClass}><ScheduleGrid /></div>;
      case 'tasks':
        return <div className={pageClass}><TaskDashboard /></div>;
      case 'habits':
        return <div className={pageClass}><HabitChecklist /></div>;
      case 'finance':
        return <div className={pageClass}><FinanceLedger /></div>;
      case 'settings':
        return <div className={pageClass}><SettingsPage /></div>;
      default:
        return <div className={pageClass}><Dashboard /></div>;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
      <CommandPalette />
      
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col w-full min-h-0 overflow-y-auto">
          <div className={clsx(
            "flex-1 flex flex-col w-full",
            !isBoard ? "max-w-7xl mx-auto px-6 md:px-8 lg:px-12 pt-8 pb-32" : "min-h-full"
          )}>
            {renderPage()}
          </div>
        </div>
      </main>

      <CommandBar onNavigate={(page) => navigate(page as PageId)} />
      <StatusLine pageTitle={activePage} />
    </div>
  );
};
