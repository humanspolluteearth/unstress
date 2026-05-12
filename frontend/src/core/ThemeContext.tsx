import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'amoled' | 'sepia';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES: Theme[] = ['dark', 'amoled', 'sepia'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('theme') as Theme;
      return THEMES.includes(saved) ? saved : 'amoled';
    } catch {
      return 'amoled';
    }
  });

  const setTheme = (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
    } catch (err) {
      console.error('[Theme] Failed to persist theme:', err);
    }
  };

  const cycleTheme = () => {
    setThemeState((prev) => {
      const currentIndex = THEMES.indexOf(prev);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      const nextTheme = THEMES[nextIndex];
      try {
        localStorage.setItem('theme', nextTheme);
      } catch (err) {
        console.error('[Theme] Failed to cycle theme:', err);
      }
      return nextTheme;
    });
  };

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('dark', 'amoled', 'sepia');
      
      // Default hardcoded background for safety (always dark-ish)
      root.style.backgroundColor = '#000000';

      root.classList.add(theme);
      
      const body = window.document.body;
      body.classList.remove('dark', 'amoled', 'sepia');
      body.classList.add(theme);
    } catch (err) {
      console.error('[Theme] Kernel Error during injection:', err);
    }
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        cycleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
