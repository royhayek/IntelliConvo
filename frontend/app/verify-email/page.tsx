"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { postAuthVerifyEmail } from "@/lib/api/generated/queries/authentication/authentication";
import { useAuthStore } from "@/lib/store";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

type VerificationState = "idle" | "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasAttempted = useRef(false);
  const { user, updateUser } = useAuthStore();
  const isAuthenticated = !!user;
  const { t } = useTranslation();

  const [state, setState] = useState<VerificationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || hasAttempted.current) return;

    hasAttempted.current = true;
    setState("loading");

    postAuthVerifyEmail({ token })
      .then(() => {
        setState("success");
        if (user) {
          updateUser({ emailVerified: true });
        }
      })
      .catch((error: unknown) => {
        setState("error");
        const axiosError = error as { response?: { data?: { error?: { message?: string } | string } } };
        const errMsg = typeof axiosError.response?.data?.error === "string"
          ? axiosError.response.data.error
          : axiosError.response?.data?.error?.message || t("auth.verifyEmail.failedToVerify");
        setErrorMessage(errMsg);
      });
  }, [token]);

  const noToken = !token;
  const isLoading = state === "loading" || (state === "idle" && token);
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <AuthPageLayout>
      <Card className="w-full auth-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" showText={false} href={null} animated={false} />
          </div>
          <CardTitle className="text-3xl font-bold">{t("auth.verifyEmail.title")}</CardTitle>
          <CardDescription>
            {noToken && t("auth.verifyEmail.missingToken")}
            {!noToken && isLoading && t("auth.verifyEmail.verifying")}
            {!noToken && isSuccess && t("auth.verifyEmail.verified")}
            {!noToken && isError && t("auth.verifyEmail.unableToVerify")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!noToken && isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin mb-4" style={{ color: "#22d3ee" }} />
              <p className="text-muted-foreground">{t("auth.verifyEmail.pleaseWait")}</p>
            </div>
          )}

          {!noToken && isSuccess && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-center text-muted-foreground mb-6">
                {t("auth.verifyEmail.successDesc")}
                {isAuthenticated
                  ? t("auth.verifyEmail.accessFeatures")
                  : t("auth.verifyEmail.signInAccount")}
              </p>
              {isAuthenticated ? (
                <Button asChild className="w-full btn-auth-gradient">
                  <Link href="/dashboard">{t("auth.verifyEmail.goToDashboard")}</Link>
                </Button>
              ) : (
                <Button asChild className="w-full btn-auth-gradient">
                  <Link href="/auth/login">{t("auth.verifyEmail.signInBtn")}</Link>
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
                {t("auth.verifyEmail.linkExpired")}
              </h3>
              <p className="text-center text-muted-foreground text-sm mb-6">
                {t("auth.verifyEmail.linkExpiredDesc")}
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="w-full btn-auth-gradient">
                  <Link href="/auth/login">{t("auth.verifyEmail.goToSignIn")}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signup">{t("auth.verifyEmail.createNewAccount")}</Link>
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
                {t("auth.verifyEmail.noTokenDesc")}
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="w-full btn-auth-gradient">
                  <Link href="/auth/login">{t("auth.verifyEmail.goToSignIn")}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <AuthPageLayout>
      <Card className="w-full auth-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" showText={false} href={null} animated={false} />
          </div>
          <CardTitle className="text-3xl font-bold">{t("auth.verifyEmail.title")}</CardTitle>
          <CardDescription>{t("auth.verifyEmail.verifying")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 animate-spin mb-4" style={{ color: "#22d3ee" }} />
            <p className="text-muted-foreground">{t("common.pleaseWait")}</p>
          </div>
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
