import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Result } from '../../core/results';
import { SearchIcon, PlusIcon, CheckCircleIcon, WalletIcon, ActivityIcon } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'finance' | 'task' | 'habit';
  metadata: Record<string, any>;
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Toggle the menu when ⌘K or Ctrl+K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const port = (window as any).__BACKEND_PORT__ || 8000;
        const response = await fetch(`http://localhost:${port}/search?q=${encodeURIComponent(search)}`);
        const result: Result<SearchResult[]> = await response.json();
        if (result.success && result.data) {
          setResults(result.data);
        }
      } catch (err) {
        console.error('Search failed', err);
      }
    };

    const timer = setTimeout(fetchResults, 150); // Debounce
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl">
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input 
            placeholder="Search transactions, tasks, habits..." 
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            value={search}
            onValueChange={setSearch}
          />
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>
          
          {results.length > 0 && (
            <Command.Group heading="Search Results">
              {results.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.title}
                  onSelect={() => {
                    console.log('Selected', item);
                    setOpen(false);
                  }}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  {item.type === 'finance' && <WalletIcon className="mr-2 h-4 w-4 text-blue-500" />}
                  {item.type === 'task' && <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />}
                  {item.type === 'habit' && <ActivityIcon className="mr-2 h-4 w-4 text-amber-500" />}
                  <span>{item.title}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Separator />

          <Command.Group heading="Quick Actions">
            <Command.Item className="flex items-center rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent">
              <PlusIcon className="mr-2 h-4 w-4" />
              <span>Create New Task</span>
            </Command.Item>
            <Command.Item className="flex items-center rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent">
              <PlusIcon className="mr-2 h-4 w-4" />
              <span>Log Finance Transaction</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
};
