"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuthStore } from "@/lib/store";
import { useAuthRedirect } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import { usePostAuthLogin } from "@/lib/api/generated/queries/authentication/authentication";
import { useGetConfigPublic } from "@/lib/api/generated/queries/config/config";
import { AlertCircle } from "lucide-react";
import { OAuthButtons, AuthProvider } from "@/components/auth/oauth-buttons";
import { BrandLogo } from "@/components/ui/brand-logo";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  // Redirect authenticated users away from login page
  const { isLoading: isAuthLoading } = useAuthRedirect();

  // Fetch public config to get enabled auth providers
  const { data: configData } = useGetConfigPublic();
  const enabledProviders = configData?.data?.enabledAuthProviders ?? [];
  const isEmailEnabled = enabledProviders.includes('email');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Login mutation
  const loginMutation = usePostAuthLogin({
    mutation: {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data;
        // Cast user to include isAdmin from backend response
        const userWithAdmin = user as typeof user & { isAdmin?: boolean };
        login(userWithAdmin, { accessToken, refreshToken });

        // Handle returnTo parameter for post-login redirect
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get("returnTo");

        // Redirect admin users to admin portal, regular users to dashboard
        if (returnTo) {
          router.push(returnTo);
        } else if (userWithAdmin.isAdmin) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      },
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ data: { email: data.email, password: data.password } });
  };

  const loading = loginMutation.isPending;
  const errorResponse = (loginMutation.error as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
  const error = typeof errorResponse === 'string'
    ? errorResponse
    : errorResponse?.message || (loginMutation.isError ? "Invalid credentials" : "");

  const handleOAuthLogin = (provider: AuthProvider) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Checking authentication" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" showText={false} href={null} animated={false} />
          </div>
          <CardTitle className="text-3xl font-bold">Sign in to your account</CardTitle>
          <CardDescription>
            Or{" "}
            <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              create a new account
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <OAuthButtons
                onProviderClick={handleOAuthLogin}
                enabledProviders={enabledProviders}
                disabled={loading}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}