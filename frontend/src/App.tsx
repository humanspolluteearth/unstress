import React, { Suspense, lazy } from 'react';
import { useNavigationStore } from './core/useNavigationStore';
import { MainLayout } from './core/MainLayout';
import { clsx } from 'clsx';

// Lazy load modules
const Dashboard = lazy(() => import('./core/Dashboard').then(m => ({ default: m.Dashboard })));
const GoalDashboard = lazy(() => import('./modules/goals/GoalDashboard').then(m => ({ default: m.GoalDashboard })));
const ScheduleGrid = lazy(() => import('./modules/schedules/ScheduleGrid').then(m => ({ default: m.ScheduleGrid })));
const TaskDashboard = lazy(() => import('./modules/tasks/TaskDashboard').then(m => ({ default: m.TaskDashboard })));
const HabitChecklist = lazy(() => import('./modules/habits/HabitChecklist').then(m => ({ default: m.HabitChecklist })));
const FinanceLedger = lazy(() => import('./modules/finance/FinanceLedger').then(m => ({ default: m.FinanceLedger })));
const SettingsPage = lazy(() => import('./core/SettingsPage').then(m => ({ default: m.SettingsPage })));

const ModuleLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 animate-pulse">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Loading Module...</div>
  </div>
);

const SidecarHealthCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const port = (window as any).__BACKEND_PORT__;
  
  if (!port) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-6 font-mono">
        <div className="flex items-center gap-3 text-primary mb-4">
          <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
          <h2 className="text-sm font-bold tracking-tighter uppercase">Connecting to Sidecar...</h2>
        </div>
        <p className="text-[10px] text-muted-foreground max-w-xs text-center leading-relaxed mb-6">
          Waiting for the FastAPI backend bridge to initialize on localhost.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-primary text-primary text-[10px] font-bold uppercase hover:bg-primary/10 transition-all"
        >
          Force Reconnect
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { activePage } = useNavigationStore();
  const isBoard = activePage === 'tasks' || activePage === 'schedule';

  const renderPage = () => {
    const pageClass = clsx(
      "animate-in slide-in-from-right-4 duration-300 flex-1 flex flex-col",
      isBoard ? "h-full min-h-0" : "min-h-full"
    );

    return (
      <Suspense fallback={<ModuleLoader />}>
        {(() => {
          switch (activePage) {
            case 'dashboard': return <div className={pageClass}><Dashboard /></div>;
            case 'goals': return <div className={pageClass}><GoalDashboard /></div>;
            case 'schedule': return <div className={pageClass}><ScheduleGrid /></div>;
            case 'tasks': return <div className={pageClass}><TaskDashboard /></div>;
            case 'habits': return <div className={pageClass}><HabitChecklist /></div>;
            case 'finance': return <div className={pageClass}><FinanceLedger /></div>;
            case 'settings': return <div className={pageClass}><SettingsPage /></div>;
            default: return <div className={pageClass}><Dashboard /></div>;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <SidecarHealthCheck>
      <MainLayout activePage={activePage} isBoard={isBoard}>
        {renderPage()}
      </MainLayout>
    </SidecarHealthCheck>
  );
};
