"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { postApiV1AuthVerifyEmail } from "@/lib/api/generated/queries/authentication/authentication";
import { useAuthStore } from "@/lib/store";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type VerificationState = "idle" | "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasAttempted = useRef(false);
  const { user, updateUser } = useAuthStore();
  const isAuthenticated = !!user;

  const [state, setState] = useState<VerificationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || hasAttempted.current) return;

    hasAttempted.current = true;
    setState("loading");

    postApiV1AuthVerifyEmail({ token })
      .then(() => {
        setState("success");
        // Update user's emailVerified status in the store if authenticated
        if (user) {
          updateUser({ emailVerified: true });
        }
      })
      .catch((error: unknown) => {
        setState("error");
        const axiosError = error as { response?: { data?: { error?: { message?: string } | string } } };
        const errMsg = typeof axiosError.response?.data?.error === 'string'
          ? axiosError.response.data.error
          : axiosError.response?.data?.error?.message || "Failed to verify email. The link may be invalid or expired.";
        setErrorMessage(errMsg);
      });
  }, [token]);

  const noToken = !token;
  const isLoading = state === "loading" || (state === "idle" && token);
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" showText={false} href={null} animated={false} />
          </div>
          <CardTitle className="text-3xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {noToken && "Missing verification token"}
            {!noToken && isLoading && "Verifying your email address..."}
            {!noToken && isSuccess && "Your email has been verified!"}
            {!noToken && isError && "Unable to verify email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!noToken && isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-4" />
              <p className="text-muted-foreground">Please wait while we verify your email...</p>
            </div>
          )}

          {!noToken && isSuccess && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-center text-muted-foreground mb-6">
                Your email address has been successfully verified.
                {isAuthenticated
                  ? " You can now access all features."
                  : " You can now sign in to your account."}
              </p>
              {isAuthenticated ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/auth/login">Sign in to your account</Link>
                </Button>
              )}
            </div>
          )}

          {!noToken && isError && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                Verification Link Expired
              </h3>
              <p className="text-center text-muted-foreground text-sm mb-6">
                This verification link has expired or has already been used.
                Please sign in and request a new verification email from your dashboard.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Go to Sign In</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signup">Create New Account</Link>
                </Button>
              </div>
            </div>
          )}

          {noToken && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-4 mb-4">
                <Mail className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-center text-muted-foreground mb-6">
                No verification token was provided. Please click the link in your verification email
                or request a new verification email.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Go to Sign In</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" showText={false} href={null} animated={false} />
          </div>
          <CardTitle className="text-3xl font-bold">Email Verification</CardTitle>
          <CardDescription>Verifying your email address...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-4" />
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
