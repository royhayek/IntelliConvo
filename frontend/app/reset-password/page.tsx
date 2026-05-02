"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { usePostAuthResetPassword } from "@/lib/api/generated/queries/authentication/authentication";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useTranslation } from "react-i18next";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();

  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const resetPasswordMutation = usePostAuthResetPassword({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
      },
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    if (!token) return;
    resetPasswordMutation.mutate({ data: { token, password: data.password } });
  };

  const loading = resetPasswordMutation.isPending;
  const errorResponse = (resetPasswordMutation.error as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
  const error = typeof errorResponse === "string"
    ? errorResponse
    : errorResponse?.message || (resetPasswordMutation.isError ? t("auth.resetPassword.somethingWrong") : "");

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (!token) {
    return (
      <AuthPageLayout>
        <Card className="w-full auth-card">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t("auth.resetPassword.invalidLink")}</CardTitle>
            <CardDescription>{t("auth.resetPassword.invalidLinkDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full btn-auth-gradient">
              <Link href="/auth/forgot-password">{t("auth.resetPassword.requestNewLink")}</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthPageLayout>
    );
  }

  if (success) {
    return (
      <AuthPageLayout>
        <Card className="w-full auth-card">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t("auth.resetPassword.successTitle")}</CardTitle>
            <CardDescription>{t("auth.resetPassword.successDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full btn-auth-gradient">
              <Link href="/auth/login">{t("auth.resetPassword.continueToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <Card className="w-full auth-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" showText={false} href={null} animated={false} />
          </div>
          <CardTitle className="text-2xl font-bold">{t("auth.resetPassword.title")}</CardTitle>
          <CardDescription>{t("auth.resetPassword.subtitle")}</CardDescription>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.resetPassword.newPassword")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.resetPassword.confirmPassword")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  {t("auth.resetPassword.requirements")}
                </p>
                <ul className="list-disc list-inside pl-4 space-y-0.5">
                  <li>{t("auth.resetPassword.req8chars")}</li>
                  <li>{t("auth.resetPassword.reqUppercase")}</li>
                  <li>{t("auth.resetPassword.reqLowercase")}</li>
                  <li>{t("auth.resetPassword.reqNumber")}</li>
                </ul>
              </div>

              <Button type="submit" disabled={loading} className="w-full btn-auth-gradient">
                {loading ? t("auth.resetPassword.resetting") : t("auth.resetPassword.resetPasswordBtn")}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/login" className="link-auth inline-flex items-center">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  {t("auth.resetPassword.backToLogin")}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthPageLayout>
        <Card className="w-full auth-card">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#22d3ee" }} />
          </CardContent>
        </Card>
      </AuthPageLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
