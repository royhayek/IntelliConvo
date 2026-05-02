"use client";

import { useState } from "react";
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
import { usePostAuthForgotPassword } from "@/lib/api/generated/queries/authentication/authentication";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useTranslation } from "react-i18next";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotPasswordMutation = usePostAuthForgotPassword({
    mutation: {
      onSuccess: () => {
        setSubmitted(true);
      },
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate({ data: { email: data.email } });
  };

  const loading = forgotPasswordMutation.isPending;
  const errorResponse = (forgotPasswordMutation.error as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
  const error = typeof errorResponse === "string"
    ? errorResponse
    : errorResponse?.message || (forgotPasswordMutation.isError ? t("auth.forgotPassword.somethingWrong") : "");

  if (submitted) {
    return (
      <AuthPageLayout>
        <Card className="w-full auth-card">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t("auth.forgotPassword.checkEmail")}</CardTitle>
            <CardDescription className="text-base">
              {t("auth.forgotPassword.checkEmailDesc", { email: form.getValues("email") })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>{t("auth.forgotPassword.linkExpires")}</span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.forgotPassword.backToLogin")}
              </Link>
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
          <CardTitle className="text-2xl font-bold">{t("auth.forgotPassword.title")}</CardTitle>
          <CardDescription>{t("auth.forgotPassword.subtitle")}</CardDescription>
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
                    <FormLabel>{t("auth.forgotPassword.emailLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("auth.forgotPassword.emailPlaceholder")}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full btn-auth-gradient">
                {loading ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendResetLink")}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/login" className="link-auth inline-flex items-center">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  {t("auth.forgotPassword.backToLogin")}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}
