"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { usePostAuthLogin } from "@/lib/api/generated/queries/authentication/authentication";
import { useGetConfigPublic } from "@/lib/api/generated/queries/config/config";
import { AlertCircle, ArrowRight } from "lucide-react";
import { OAuthButtons, AuthProvider } from "@/components/auth/oauth-buttons";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useTranslation } from "react-i18next";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const { isLoading: isAuthLoading } = useAuthRedirect();

  const { data: configData } = useGetConfigPublic();
  const enabledProviders = configData?.data?.enabledAuthProviders ?? [];

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = usePostAuthLogin({
    mutation: {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data;
        const userWithAdmin = user as typeof user & { isAdmin?: boolean };
        login(userWithAdmin, { accessToken, refreshToken });

        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get("returnTo");

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
  const error = typeof errorResponse === "string"
    ? errorResponse
    : errorResponse?.message || (loginMutation.isError ? t("auth.login.invalidCredentials") : "");

  const handleOAuthLogin = (provider: AuthProvider) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  if (isAuthLoading) {
    return <AuthLoading message={t("auth.checkingAuth")} />;
  }

  return (
    <AuthSplitLayout panel="login">
      <div className="space-y-8">
        {/* Mobile-only logo */}
        <div className="flex lg:hidden justify-center">
          <BrandLogo size="md" showText href={null} animated={false} />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-gradient-cyan">{t("auth.login.title")}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("auth.login.noAccount")}{" "}
            <Link href="/auth/signup" className="font-semibold link-auth">
              {t("auth.login.startFreeTrial")}
            </Link>
          </p>
        </div>

        {/* Form card */}
        <div className="auth-card rounded-2xl p-7 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 auth-form">
              {error && (
                <Alert variant="destructive" className="py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">{t("auth.login.emailLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("auth.login.emailPlaceholder")}
                        autoComplete="email"
                        className="h-11"
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
                      <FormLabel className="text-sm font-medium">{t("auth.login.passwordLabel")}</FormLabel>
                      <Link href="/auth/forgot-password" className="text-xs link-auth">
                        {t("auth.login.forgotPassword")}
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("auth.login.passwordPlaceholder")}
                        autoComplete="current-password"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-semibold btn-auth-gradient"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t("auth.login.signingIn")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t("auth.login.signIn")} <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <OAuthButtons
                onProviderClick={handleOAuthLogin}
                enabledProviders={enabledProviders}
                disabled={loading}
                separatorText={t("auth.orContinueWith")}
              />
            </form>
          </Form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          {t("auth.login.termsText")}{" "}
          <Link href="/terms" className="link-auth hover:underline">{t("auth.login.terms")}</Link>
          {", "}
          <Link href="/privacy" className="link-auth hover:underline">{t("auth.login.privacy")}</Link>
          {" & "}
          <Link href="/mentions-legales" className="link-auth hover:underline">{t("auth.login.legalNotice")}</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
