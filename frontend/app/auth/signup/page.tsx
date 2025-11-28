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
import { usePostApiV1AuthSignup } from "@/lib/api/generated/queries/authentication/authentication";
import { useGetApiV1ConfigPublic } from "@/lib/api/generated/queries/config/config";
import { AlertCircle } from "lucide-react";
import { OAuthButtons, AuthProvider } from "@/components/auth/oauth-buttons";
import { BrandLogo } from "@/components/ui/brand-logo";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  // Redirect authenticated users to onboarding
  const { isLoading: isAuthLoading } = useAuthRedirect("/dashboard");

  // Fetch public config to get enabled auth providers
  const { data: configData } = useGetApiV1ConfigPublic();
  const enabledProviders = configData?.data?.enabledAuthProviders ?? [];

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  // Signup mutation
  const signupMutation = usePostApiV1AuthSignup({
    mutation: {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data;
        login(user, { accessToken, refreshToken });
        router.push("/dashboard");
      },
    },
  });

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate({
      data: {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      },
    });
  };

  const loading = signupMutation.isPending;
  const errorResponse = (signupMutation.error as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
  const error = typeof errorResponse === 'string'
    ? errorResponse
    : errorResponse?.message || (signupMutation.isError ? "Failed to create account" : "");

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
            <BrandLogo size="lg" showText={false} href={null} animated={false} />
          </div>
          <CardTitle className="text-3xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Or{" "}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              sign in to your existing account
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
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password (min 8 characters)"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <OAuthButtons
                onProviderClick={handleOAuthLogin}
                enabledProviders={enabledProviders}
                disabled={loading}
                separatorText="Or sign up with"
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}