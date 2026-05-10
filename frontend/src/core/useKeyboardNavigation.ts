import { useEffect } from 'react';
import { Result } from './results';

export type PageId = 'dashboard' | 'goals' | 'schedule' | 'tasks' | 'habits' | 'finance' | 'settings' | 'blackboard' | 'zen';

export const useKeyboardNavigation = (onNavigate: (page: PageId) => Result<null, string>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // We only care about Alt + Key combinations
      if (e.altKey) {
        let targetPage: PageId | null = null;

        switch (e.key.toLowerCase()) {
          case 'd': targetPage = 'dashboard'; break;
          case 'f': targetPage = 'finance'; break;
          case 't': targetPage = 'tasks'; break;
          case 'h': targetPage = 'habits'; break;
          case 's': targetPage = 'schedule'; break;
          case 'g': targetPage = 'goals'; break;
          case 'b': targetPage = 'blackboard'; break;
          case 'z': targetPage = 'zen'; break;
        }

        if (targetPage) {
          e.preventDefault();
          const result = onNavigate(targetPage);
          if (!result.success) {
            console.error(`Navigation Error: ${result.error}`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);
};
