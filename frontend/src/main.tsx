import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { ThemeProvider } from './core/ThemeContext';
import { GlobalErrorBoundary } from './core/GlobalErrorBoundary';

/**
 * SafeBoot kernel that captures environment readiness.
 */
const SafeBoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('[Kernel] Initializing system boot sequence...');
      // Minimal check: ensure we can at least reach the window object
      if (typeof window === 'undefined') {
        throw new Error('WINDOW_NOT_FOUND');
      }
      setIsReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'BOOT_EXCEPTION';
      console.error(`[Kernel] CRITICAL BOOT ERROR: ${msg}`);
      setError(msg);
    }
  }, []);

  if (error) {
    return (
      <div style={{ height: '100vh', background: '#000', color: '#f00', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: '20px' }}>
        <h1 style={{ fontSize: '14px', marginBottom: '10px' }}>[SYSTEM_KERNEL_PANIC]</h1>
        <code style={{ fontSize: '10px', color: '#aaa' }}>Error: {error}</code>
        <button onClick={() => window.location.reload()} style={{ marginTop: '20px', background: '#333', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '10px', cursor: 'pointer' }}>RETRY_BOOT</button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ height: '100vh', background: '#000', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        [BOOTING...]
      </div>
    );
  }

  return <>{children}</>;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Kernel] FATAL: Root element #root not found in DOM.');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <SafeBoot>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </SafeBoot>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
