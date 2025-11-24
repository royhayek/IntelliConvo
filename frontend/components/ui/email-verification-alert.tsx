"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { useGetApiV1ConfigPublic } from "@/lib/api/generated/queries/config/config";
import { useGetApiV1AuthMe, usePostApiV1AuthResendVerification } from "@/lib/api/generated/queries/authentication/authentication";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface EmailVerificationAlertProps {
  className?: string;
}

export function EmailVerificationAlert({
  className,
}: EmailVerificationAlertProps) {
  const { user } = useAuth();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Fetch public config to check if email verification is required
  const { data: configData, isLoading: isConfigLoading } =
    useGetApiV1ConfigPublic();

  // Fetch fresh user data to check if email was verified
  const { data: meData } = useGetApiV1AuthMe({
    query: {
      enabled: !!user && !user.emailVerified,
      staleTime: 0, // Always fetch fresh data
    },
  });

  // Update store if backend says email is verified
  useEffect(() => {
    if (meData?.emailVerified && user && !user.emailVerified) {
      updateUser({ emailVerified: true });
    }
  }, [meData, user, updateUser]);

  const resendMutation = usePostApiV1AuthResendVerification({
    mutation: {
      onSuccess: (data) => {
        const message = (data as { message?: string })?.message || 'Verification email sent.';
        // Check if the message indicates email is already verified
        if (message.toLowerCase().includes('already verified')) {
          setStatusMessage({ type: 'info', text: 'Your email is already verified.' });
        } else {
          setStatusMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
        }
        setTimeout(() => setStatusMessage(null), 5000);
      },
      onError: (error) => {
        const axiosError = error as { response?: { data?: { error?: { message?: string } | string } } };
        const errorMsg = typeof axiosError.response?.data?.error === 'string'
          ? axiosError.response.data.error
          : axiosError.response?.data?.error?.message || 'Failed to send verification email';
        setStatusMessage({ type: 'error', text: errorMsg });
        setTimeout(() => setStatusMessage(null), 5000);
      },
    },
  });

  // Don't show if:
  // - User is not logged in
  // - User's email is already verified
  // - Email verification is not required (config not loaded yet = don't show)
  const config = configData?.data;
  const shouldShow =
    user &&
    !user.emailVerified &&
    config?.requireEmailVerification;

  if (!shouldShow || isConfigLoading) {
    return null;
  }

  const handleResendVerification = () => {
    if (!user?.email) return;
    setStatusMessage(null);
    resendMutation.mutate({ data: { email: user.email } });
  };

  const isResending = resendMutation.isPending;

  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 ${
        className || ""
      }`}
    >
      <div className="flex items-center gap-3">
        {statusMessage?.type === 'success' ? (
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <span
          className={`text-sm ${
            statusMessage?.type === 'success'
              ? "text-green-800 dark:text-green-200"
              : statusMessage?.type === 'error'
              ? "text-red-800 dark:text-red-200"
              : "text-amber-800 dark:text-amber-200"
          }`}
        >
          {statusMessage ? (
            <>
              {statusMessage.text}
              {statusMessage.type === 'error' && (
                <Button
                  variant="link"
                  className="px-2 h-auto py-0 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  Try again
                </Button>
              )}
            </>
          ) : (
            <>
              Please verify your email to receive important notifications including billing updates, trial reminders, and account alerts.
              <Button
                variant="link"
                className="px-2 h-auto py-0 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1" />
                    Sending...
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
