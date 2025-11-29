import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SiteResponse, AuthTokensResponseUser } from "./api/generated/models";

// User type from the generated API types
// Includes isAdmin and emailVerified from backend UserDTO
export type User = AuthTokensResponseUser;

type Site = SiteResponse;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  _hasHydrated: boolean;
  login: (
    user: User,
    tokens: { accessToken: string; refreshToken: string }
  ) => void;
  logout: () => void;
  setLoggingOut: (value: boolean) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  _setHasHydrated: (hasHydrated: boolean) => void;
}

interface SiteState {
  sites: Site[];
  currentSite: Site | null;
  setSites: (sites: Site[]) => void;
  setCurrentSite: (site: Site | null) => void;
  addSite: (site: Site) => void;
  updateSite: (id: string, updates: Partial<Site>) => void;
  removeSite: (id: string) => void;
}

// Auth store with hydration tracking
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoggingOut: false,
      _hasHydrated: false,

      login: (user, tokens) => {
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        set({ user, isAuthenticated: true, isLoggingOut: false });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, isAuthenticated: false, isLoggingOut: false });
      },

      setLoggingOut: (value) => {
        set({ isLoggingOut: value });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates }, isAuthenticated: true });
        }
      },

      _setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);

// Sites store
export const useSiteStore = create<SiteState>((set, get) => ({
  sites: [],
  currentSite: null,

  setSites: (sites) => set({ sites }),

  setCurrentSite: (site) => set({ currentSite: site }),

  addSite: (site) =>
    set((state) => ({
      sites: [...state.sites, site],
    })),

  updateSite: (id, updates) =>
    set((state) => ({
      sites: state.sites.map((site) =>
        site.id === id ? { ...site, ...updates } : site
      ),
      currentSite:
        state.currentSite?.id === id
          ? { ...state.currentSite, ...updates }
          : state.currentSite,
    })),

  removeSite: (id) =>
    set((state) => ({
      sites: state.sites.filter((site) => site.id !== id),
      currentSite: state.currentSite?.id === id ? null : state.currentSite,
    })),
}));

// UI state store
type NavigationLayout = "horizontal" | "vertical";

interface UIState {
  sidebarOpen: boolean;
  loading: boolean;
  navigationLayout: NavigationLayout;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setNavigationLayout: (layout: NavigationLayout) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      loading: false,
      navigationLayout: "horizontal", // Default to horizontal
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setLoading: (loading) => set({ loading }),
      setNavigationLayout: (navigationLayout) => set({ navigationLayout }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        navigationLayout: state.navigationLayout,
      }),
    }
  )
);
