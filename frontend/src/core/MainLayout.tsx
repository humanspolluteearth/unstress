import React, { Suspense } from 'react';
import { CommandPalette } from './CommandPalette';
import { CommandBar } from './CommandBar';
import { useKeyboardNavigation, PageId } from './useKeyboardNavigation';
import { StatusLine } from './StatusLine';
import { useNavigationStore } from './useNavigationStore';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: string;
  isBoard: boolean;
}

/**
 * MainLayout isolates side-effect heavy logic (keyboard nav, command bar)
 * from the main App mount to prevent total boot failure.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children, activePage, isBoard }) => {
  const { navigate } = useNavigationStore();

  // Hotkeys only active once Layout mounts
  useKeyboardNavigation(navigate);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
      <CommandPalette />
      
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col w-full min-h-0 overflow-y-auto">
          <div className={isBoard ? "flex-1 flex flex-col w-full min-h-full" : "flex-1 flex flex-col w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-12 pt-8 pb-8"}>
            {children}
          </div>
        </div>
      </main>

      <CommandBar onNavigate={(page) => navigate(page as PageId)} />
      <StatusLine pageTitle={activePage} />
    </div>
  );
};
