import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  /** JWT access token */
  accessToken: string | null;
  /** JWT refresh token */
  refreshToken: string | null;
  /** Currently authenticated user */
  user: User | null;
  /** True when a token is available and user is loaded */
  isAuthenticated: boolean;
  /** True during initial auth check or token refresh */
  isLoading: boolean;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

/**
 * Zustand store for authentication state.
 * Persisted to localStorage so the session survives page refreshes.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setTokens: (accessToken: string, refreshToken: string) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user: User) =>
        set({ user, isAuthenticated: true, isLoading: false }),

      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'eduk8u-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist tokens — user profile is re-fetched on mount
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If we have a token after rehydration, isLoading stays true
          // until /me is fetched by the App component.
          if (!state.accessToken) {
            state.isLoading = false;
          }
        }
      },
    },
  ),
);
