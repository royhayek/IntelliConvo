import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, User } from "@/lib/store";

/**
 * Auth hook return type
 */
interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

/**
 * Admin auth hook return type
 */
interface UseAdminAuthReturn extends UseAuthReturn {
  isAdmin: boolean;
}

/**
 * Hook to check if the auth store has been hydrated from localStorage.
 * This prevents flash of unauthenticated content on page refresh.
 *
 * @returns boolean indicating if hydration is complete
 */
export function useAuthHydrated(): boolean {
  return useAuthStore((state) => state._hasHydrated);
}

/**
 * Hook that provides authentication state with hydration awareness.
 * Returns loading state while the auth store is being hydrated from localStorage.
 *
 * @returns Authentication state with loading indicator
 *
 * @example
 * ```tsx
 * const { isAuthenticated, isLoading, user } = useAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 * return <Dashboard user={user} />;
 * ```
 */
export function useAuth(): UseAuthReturn {
  const hasHydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return {
    isAuthenticated,
    isLoading: !hasHydrated,
    user,
  };
}

/**
 * Hook for protecting routes that require authentication.
 * Automatically redirects to login page if user is not authenticated.
 * Shows loading state while hydration is in progress.
 *
 * @param redirectTo - Path to redirect to after successful authentication (default: current path)
 * @returns Authentication state with loading indicator
 *
 * @example
 * ```tsx
 * export default function ProtectedPage() {
 *   const { isLoading, user } = useRequireAuth();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   return <ProtectedContent user={user} />;
 * }
 * ```
 */
export function useRequireAuth(redirectTo?: string): UseAuthReturn {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Only perform redirect after hydration is complete
    if (!isLoading && !isAuthenticated) {
      // Preserve current path for post-login redirect
      const returnTo = redirectTo || window.location.pathname + window.location.search;
      const loginPath = returnTo !== "/auth/login"
        ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
        : "/auth/login";

      router.push(loginPath);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
    user,
  };
}

/**
 * Hook for redirecting authenticated users away from auth pages (login/signup).
 * Prevents authenticated users from accessing login/signup pages.
 *
 * @param defaultRedirect - Default path to redirect to if no returnTo param (default: "/dashboard")
 * @returns Authentication state with loading indicator
 *
 * @example
 * ```tsx
 * export default function LoginPage() {
 *   const { isLoading } = useAuthRedirect();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   return <LoginForm />;
 * }
 * ```
 */
export function useAuthRedirect(defaultRedirect = "/dashboard"): UseAuthReturn {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Only perform redirect after hydration is complete
    if (!isLoading && isAuthenticated) {
      // Check for returnTo parameter
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");

      if (returnTo) {
        router.push(returnTo);
      } else if (user?.isAdmin) {
        // Redirect admin users to admin portal
        router.push("/admin");
      } else {
        router.push(defaultRedirect);
      }
    }
  }, [isLoading, isAuthenticated, user, router, defaultRedirect]);

  return {
    isAuthenticated,
    isLoading,
    user,
  };
}

/**
 * Hook to handle logout functionality.
 * Provides a callback that clears auth state and redirects to login.
 *
 * @returns Logout callback function
 *
 * @example
 * ```tsx
 * const handleLogout = useLogout();
 * <Button onClick={handleLogout}>Sign Out</Button>
 * ```
 */
export function useLogout(): () => void {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return useCallback(() => {
    logout();
    router.push("/auth/login");
  }, [logout, router]);
}

/**
 * Hook for protecting routes that require admin access.
 * Automatically redirects to dashboard if user is not an admin.
 * Shows loading state while hydration is in progress.
 *
 * @returns Authentication state with admin flag and loading indicator
 *
 * @example
 * ```tsx
 * export default function AdminPage() {
 *   const { isLoading, isAdmin, user } = useRequireAdmin();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   return <AdminContent user={user} />;
 * }
 * ```
 */
export function useRequireAdmin(): UseAdminAuthReturn {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    // Only perform redirect after hydration is complete
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated - redirect to login
        const returnTo = window.location.pathname + window.location.search;
        router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      } else if (!isAdmin) {
        // Authenticated but not admin - redirect to dashboard
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  return {
    isAuthenticated,
    isLoading,
    isAdmin,
    user,
  };
}
