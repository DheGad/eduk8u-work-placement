import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        document.documentElement.setAttribute('data-theme', next);
      },
      setTheme: (theme: Theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
    }),
    {
      name: 'eduk8u-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Initialise theme on app boot
export function initTheme() {
  const stored = localStorage.getItem('eduk8u-theme');
  let theme: Theme = 'dark';
  try {
    theme = JSON.parse(stored || '{}').state?.theme || 'dark';
  } catch {}
  document.documentElement.setAttribute('data-theme', theme);
}
