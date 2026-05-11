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
const Blackboard = lazy(() => import('./modules/blackboard/Blackboard').then(m => ({ default: m.Blackboard })));
const ZenTimer = lazy(() => import('./modules/zen/ZenTimer').then(m => ({ default: m.ZenTimer })));
const SettingsPage = lazy(() => import('./core/SettingsPage').then(m => ({ default: m.SettingsPage })));

const ModuleLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 animate-pulse">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Loading Module...</div>
  </div>
);

const SidecarHealthCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendHealthy, setIsBackendHealthy] = React.useState(false);
  const [port, setPort] = React.useState<number | null>((window as any).__BACKEND_PORT__ || 8000);
  const [retryCount, setRetryCount] = React.useState(0);
  
  React.useEffect(() => {
    // 1. Resolve Port
    const resolvePort = () => {
      const p = (window as any).__BACKEND_PORT__;
      if (p) {
        setPort(p);
        return p;
      }
      return port;
    };

    const currentPort = resolvePort();
    
    // 2. Poll for Health if port exists
    if (currentPort && !isBackendHealthy) {
      const checkHealth = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:${currentPort}/`);
          if (response.ok) {
            console.log('[Sidecar] Backend is healthy and responding.');
            setIsBackendHealthy(true);
          } else {
            throw new Error('NOT_OK');
          }
        } catch (err) {
          console.warn(`[Sidecar] Health check failed (attempt ${retryCount + 1})...`);
          setTimeout(() => setRetryCount(prev => prev + 1), 500);
        }
      };
      checkHealth();
    } else if (!currentPort) {
      // Wait for port injection
      const interval = setInterval(() => {
        if ((window as any).__BACKEND_PORT__) {
          setPort((window as any).__BACKEND_PORT__);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [port, isBackendHealthy, retryCount]);

  if (!port || !isBackendHealthy) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black p-6 font-mono text-white">
        <div className="flex items-center gap-3 text-primary mb-4">
          <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
          <h2 className="text-sm font-bold tracking-tighter uppercase">
            {!port ? 'Resolving Bridge...' : 'Initializing Sidecar...'}
          </h2>
        </div>
        <p className="text-[10px] text-zinc-400 max-w-xs text-center leading-relaxed mb-6">
          {!port 
            ? 'Waiting for the secure backend port to be injected by the host process.'
            : `Attempting to establish connection with FastAPI bridge on port ${port}.`}
        </p>
        {(retryCount > 10 || !port) && (
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-primary text-primary text-[10px] font-bold uppercase hover:bg-primary/10 transition-all"
          >
            Force Restart
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { activePage } = useNavigationStore();
  const isBoard = activePage === 'tasks' || activePage === 'schedule' || activePage === 'habits' || activePage === 'goals' || activePage === 'finance';

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
            case 'blackboard': return <div className={pageClass}><Blackboard /></div>;
            case 'zen': return <div className={pageClass}><ZenTimer /></div>;
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
