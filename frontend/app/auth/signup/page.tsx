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
import { usePostAuthSignup } from "@/lib/api/generated/queries/authentication/authentication";
import { useGetConfigPublic } from "@/lib/api/generated/queries/config/config";
import { AlertCircle, Rocket } from "lucide-react";
import { OAuthButtons, AuthProvider } from "@/components/auth/oauth-buttons";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useTranslation } from "react-i18next";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const { isLoading: isAuthLoading } = useAuthRedirect("/dashboard");

  const { data: configData } = useGetConfigPublic();
  const enabledProviders = configData?.data?.enabledAuthProviders ?? [];

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const signupMutation = usePostAuthSignup({
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
      data: { email: data.email, password: data.password, fullName: data.fullName },
    });
  };

  const loading = signupMutation.isPending;
  const errorResponse = (signupMutation.error as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
  const error = typeof errorResponse === "string"
    ? errorResponse
    : errorResponse?.message || (signupMutation.isError ? t("auth.signup.failedToCreate") : "");

  const handleOAuthLogin = (provider: AuthProvider) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  if (isAuthLoading) {
    return <AuthLoading message={t("auth.checkingAuth")} />;
  }

  return (
    <AuthSplitLayout panel="signup">
      <div className="space-y-8">
        {/* Mobile-only logo */}
        <div className="flex lg:hidden justify-center">
          <BrandLogo size="md" showText href={null} animated={false} />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-gradient-cyan">{t("auth.signup.title")}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("auth.signup.hasAccount")}{" "}
            <Link href="/auth/login" className="font-semibold link-auth">
              {t("auth.signup.signIn")}
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
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("auth.signup.fullNameLabel")}{" "}
                      <span className="text-muted-foreground font-normal">{t("auth.signup.fullNameOptional")}</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={t("auth.signup.fullNamePlaceholder")}
                        autoComplete="name"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">{t("auth.signup.emailLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("auth.signup.emailPlaceholder")}
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
                    <FormLabel className="text-sm font-medium">{t("auth.signup.passwordLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("auth.signup.passwordPlaceholder")}
                        autoComplete="new-password"
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
                    {t("auth.signup.creatingAccount")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    {t("auth.signup.startFreeTrial")}
                  </span>
                )}
              </Button>

              <OAuthButtons
                onProviderClick={handleOAuthLogin}
                enabledProviders={enabledProviders}
                disabled={loading}
                separatorText={t("auth.orSignUpWith")}
              />
            </form>
          </Form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          {t("auth.signup.termsText")}{" "}
          <Link href="/terms" className="link-auth hover:underline">{t("auth.signup.termsOfService")}</Link>
          {", "}
          <Link href="/privacy" className="link-auth hover:underline">{t("auth.signup.privacy")}</Link>
          {" & "}
          <Link href="/mentions-legales" className="link-auth hover:underline">{t("auth.signup.legalNotice")}</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
