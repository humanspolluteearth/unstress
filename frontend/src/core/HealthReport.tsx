import React, { useEffect, useState } from 'react';
import { Result } from './results';
import { Activity, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  unit: string;
  change_percentage?: number;
  insight: string;
}

interface HealthData {
  timestamp: string;
  metrics: Metric[];
  summary: string;
}

export const HealthReport: React.FC = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const port = (window as any).__BACKEND_PORT__ || 8000;
        const response = await fetch(`http://localhost:${port}/insights/health-report`);
        const result: Result<HealthData> = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load health report");
        }
      } catch (err) {
        setError("Network error connecting to sidecar");
      }
    };

    fetchHealth();
  }, []);

  if (error) {
    return <div className="p-4 text-destructive bg-destructive/10 rounded-lg">{error}</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Analyzing System Health...</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-card text-card-foreground rounded-xl border shadow-sm animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-primary" size={24} /> System Health
          </h2>
          <p className="text-muted-foreground text-sm">Deterministic trend analysis and streaks.</p>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded uppercase">
          Generated: {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.metrics.map((metric, idx) => (
          <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</span>
              {metric.change_percentage !== undefined && (
                <span className={`text-xs font-bold flex items-center gap-0.5 ${metric.change_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.change_percentage >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(metric.change_percentage)}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold">
              {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground italic flex items-start gap-1">
              <Info size={12} className="shrink-0 mt-0.5" /> {metric.insight}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-primary/5 rounded border border-primary/10 text-xs leading-relaxed">
        <span className="font-bold text-primary mr-1">Summary:</span> {data.summary}
      </div>
    </div>
  );
};
