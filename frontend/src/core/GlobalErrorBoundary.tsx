import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6 font-mono">
          <div className="max-w-md w-full border border-destructive/50 bg-destructive/5 p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-destructive mb-6">
              <AlertTriangle size={32} />
              <h1 className="text-xl font-bold tracking-tighter uppercase">System Recovery</h1>
            </div>
            
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              The UI has encountered a fatal exception. This is usually caused by an infinite loop, 
              unhandled null reference, or a sidecar disconnect.
            </p>

            <div className="bg-black/20 p-4 mb-8 border border-white/5 overflow-x-auto">
              <code className="text-[10px] text-destructive-foreground/70 block">
                {this.state.error?.toString()}
              </code>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
              >
                <RefreshCw size={14} /> Attempt Soft Restart
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-3 text-xs font-bold uppercase tracking-widest hover:bg-destructive/90 transition-all"
              >
                <AlertTriangle size={14} /> Reset State & Clear Cache
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center gap-2 border border-border hover:bg-muted py-3 text-xs font-bold uppercase tracking-widest transition-all"
              >
                <Home size={14} /> Return to Home
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em]">
            unstress_recovery_v1.0.4 // arch_linux_native
          </div>
        </div>
      );
    }

    return this.children;
  }
}
