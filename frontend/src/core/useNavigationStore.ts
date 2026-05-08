import { create } from 'zustand';
import { PageId } from './useKeyboardNavigation';
import { Result } from './results';

interface NavigationState {
  activePage: PageId;
  navigate: (page: PageId) => Result<null, string>;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activePage: 'dashboard',
  navigate: (page) => {
    try {
      set({ activePage: page });
      return { success: true, data: null };
    } catch (err) {
      return { success: false, error: 'Navigation failed' };
    }
  }
}));
