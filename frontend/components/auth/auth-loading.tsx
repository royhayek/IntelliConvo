import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLoadingProps {
  /**
   * Variant determines the layout style
   * - 'page': Full page centered loading (default)
   * - 'inline': Inline loading for smaller sections
   */
  variant?: "page" | "inline";

  /**
   * Custom message to display below the spinner
   */
  message?: string;
}

/**
 * Loading component specifically for authentication hydration states.
 * Provides consistent loading UI while the auth store hydrates from localStorage.
 *
 * @example
 * ```tsx
 * if (isLoading) return <AuthLoading />;
 * ```
 */
export function AuthLoading({
  variant = "page",
  message = "Loading..."
}: AuthLoadingProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {message}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait a moment...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
