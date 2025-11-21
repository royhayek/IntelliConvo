"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
// AuthProvider is now just a string field in the user object

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");

    if (token && refresh) {
      try {
        // Decode the token to get user info (in a real app, validate the token server-side)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.userId,
          email: payload.email,
          fullName: payload.fullName || payload.email.split('@')[0],
          authProvider: payload.authProvider || 'EMAIL',
        };

        login(user, {
          accessToken: token,
          refreshToken: refresh,
        });

        router.push("/dashboard");
      } catch (err) {
        setError("Failed to process authentication");
      }
    } else {
      setError("Authentication failed");
    }
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-indigo-950">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-6 p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Authentication Failed</h2>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
              variant="default"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-indigo-950">
      <Card className="max-w-md w-full">
        <CardContent className="space-y-6 p-8 text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Completing Sign In</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we finish setting up your account...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-indigo-950">
          <Card className="max-w-md w-full">
            <CardContent className="space-y-6 p-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loading...</h2>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
