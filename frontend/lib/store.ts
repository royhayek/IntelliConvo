import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Site, User } from "./api/generated/models";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    user: User,
    tokens: { accessToken: string; refreshToken: string }
  ) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (user: User) => void;
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

// Auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (user, tokens) => {
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: (user) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
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
interface UIState {
  sidebarOpen: boolean;
  loading: boolean;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  loading: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setLoading: (loading) => set({ loading }),
}));
