import { GlobalLoading } from "@/components/ui/global-loading";

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
 * Now uses the new GlobalLoading component with beautiful animations.
 *
 * @deprecated Use GlobalLoading directly for new code
 *
 * @example
 * ```tsx
 * if (isLoading) return <AuthLoading />;
 * // Or use GlobalLoading directly:
 * if (isLoading) return <GlobalLoading message="Loading..." animation="pulse" />;
 * ```
 */
export function AuthLoading({
  variant = "page",
  message
}: AuthLoadingProps) {
  return (
    <GlobalLoading
      variant={variant}
      message={message}
      animation="pulse"
    />
  );
}
