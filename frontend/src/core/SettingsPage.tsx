import React, { useState } from 'react';
import { Database, ShieldAlert, Cpu, RefreshCcw, Palette } from 'lucide-react';
import { ActionService } from './ActionService';
import { useSettingsStore } from './useSettingsStore';
import { useTheme, Theme } from './ThemeContext';
import { clsx } from 'clsx';

export const SettingsPage: React.FC = () => {
  const { performanceMode, togglePerformanceMode } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [status, setStatus] = useState<string | null>(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const THEMES: { id: Theme; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'amoled', label: 'Amoled' },
    { id: 'sepia', label: 'Sepia' },
  ];

  const handleBackup = async () => {
    setIsBackupLoading(true);
    setStatus('Starting backup...');
    const result = await ActionService.performBackup();
    setIsBackupLoading(false);
    if (result.success) {
      setStatus(`Backup successful: ${result.data}`);
    } else {
      setStatus(`Backup failed: ${result.error}`);
    }
  };

  const handleResetModule = async (module: string) => {
    if (confirm(`DANGER: Are you sure you want to clear all data for ${module}?`)) {
      const result = await ActionService.resetModule(module);
      if (result.success) {
        setStatus(`${module} reset successful.`);
      }
    }
  };

  const handleClearEvents = async () => {
    if (confirm('DANGER: Clear global event log? Historical reviews will be empty.')) {
      const result = await ActionService.clearEvents();
      if (result.success) {
        setStatus('Event history cleared.');
      }
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">Manage your environment and maintenance tasks.</p>
      </header>

      {status && (
        <div className="p-3 bg-primary/10 text-primary text-sm rounded border border-primary/20 animate-in fade-in slide-in-from-top-2">
          {status}
        </div>
      )}

      {/* Appearance Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette size={20} className="text-primary" /> Appearance
        </h3>
        <div className="bg-card border rounded-lg p-4">
          <p className="font-medium text-sm mb-3">Color Theme</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={clsx(
                  "px-4 py-3 rounded-md border text-sm font-medium transition-all text-center",
                  theme === t.id
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider">
            Tip: Press <kbd className="bg-muted px-1 rounded border text-[8px]">Ctrl + T</kbd> to cycle themes quickly.
          </p>
        </div>
      </section>

      {/* Maintenance Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database size={20} className="text-primary" /> Maintenance
        </h3>
        <div className="bg-card border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Database Backup</p>
            <p className="text-xs text-muted-foreground">Triggers scripts/backup.sh to create a compressed SQL dump.</p>
          </div>
          <button
            onClick={handleBackup}
            disabled={isBackupLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isBackupLoading ? <RefreshCcw className="animate-spin" size={16} /> : <Database size={16} />}
            Run Backup
          </button>
        </div>
      </section>

      {/* Performance Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Cpu size={20} className="text-blue-500" /> Performance
        </h3>
        <div className="bg-card border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Performance Mode</p>
            <p className="text-xs text-muted-foreground">Reduces UI re-render frequency for lower CPU usage on Arch Linux.</p>
          </div>
          <button
            onClick={togglePerformanceMode}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-transparent focus:ring-primary",
              performanceMode ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                performanceMode ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-destructive">
          <ShieldAlert size={20} /> Danger Zone
        </h3>
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-destructive/10">
            <div>
              <p className="font-medium text-sm">Clear Event Log</p>
              <p className="text-xs text-muted-foreground">Permanently deletes historical event history.</p>
            </div>
            <button
              onClick={handleClearEvents}
              className="px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              Clear Events
            </button>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Reset Modules</p>
              <p className="text-xs text-muted-foreground">Wipe data for specific modules (Finance, Tasks, Habits).</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleResetModule('finance')}
                className="px-3 py-1.5 border border-destructive/30 text-destructive text-xs font-medium rounded hover:bg-destructive/10"
              >
                Reset Finance
              </button>
              <button
                onClick={() => handleResetModule('tasks')}
                className="px-3 py-1.5 border border-destructive/30 text-destructive text-xs font-medium rounded hover:bg-destructive/10"
              >
                Reset Tasks
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
