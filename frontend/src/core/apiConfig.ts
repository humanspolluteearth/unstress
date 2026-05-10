/**
 * Centralized API configuration for the application.
 * Dynamically resolves the backend port from the Tauri-injected window object.
 */

export const getBackendPort = (): number => {
  const p = (window as any).__BACKEND_PORT__ || 8000;
  if (p === 8000) {
    console.warn('[API] Backend port not found in window, falling back to 8000');
  } else {
    console.log(`[API] Using backend port: ${p}`);
  }
  return p;
};

export const getBaseUrl = (): string => {
  return `http://127.0.0.1:${getBackendPort()}`;
};

/**
 * Standardized API Endpoints
 * All domain routes are prefixed with /api
 */
export const API_ENDPOINTS = {
  GOALS: '/api/goals',
  TASKS: '/api/tasks',
  FINANCE: '/api/finance',
  HABITS: '/api/habits',
  SCHEDULES: '/api/schedules',
  FOCUS: '/api/focus',
  ACTIONS: '/api/actions',
};
