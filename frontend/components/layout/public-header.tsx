"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTranslation } from "react-i18next";

const AUTH_ROUTES = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/reset-password",
  "/verify-email",
]);

const LEGAL_ROUTES = new Set(["/terms", "/privacy", "/mentions-legales"]);

export function PublicHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const isDark       = !mounted || resolvedTheme !== "light";
  const isAuthPage   = AUTH_ROUTES.has(pathname);
  const isLegalPage  = LEGAL_ROUTES.has(pathname);
  const isLoginPage  = pathname === "/auth/login";

  const navBg        = isDark ? "rgba(2,8,23,0.88)"     : "rgba(238,243,255,0.92)";
  const navBorder    = isDark ? "rgba(34,211,238,0.08)" : "rgba(6,182,212,0.18)";
  const muted        = isDark ? "#8892a4"               : "#374151";
  const accentText   = isDark ? "#22d3ee"               : "#0369a1";
  const accentBg     = isDark ? "rgba(34,211,238,0.08)" : "#cffafe";
  const accentBorder = isDark ? "rgba(34,211,238,0.22)" : "#0891b2";
  const hoverBg      = isDark ? "rgba(34,211,238,0.14)" : "#bae6fd";
  const hoverBorder  = isDark ? "rgba(34,211,238,0.45)" : "#0369a1";

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? navBg : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: `1px solid ${scrolled ? navBorder : "transparent"}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between py-4">
        {/* Logo */}
        <BrandLogo size="sm" showText href="/" animated={false} />

        {/* Nav links — landing page only */}
        {!isAuthPage && !isLegalPage && (
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {([
              [t("nav.features"),    "/#features"],
              [t("nav.howItWorks"),  "/#how"],
              [t("nav.useCases"),    "/#usecases"],
            ] as [string, string][]).map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="transition-colors duration-200"
                style={{ color: muted }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = accentText)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = muted)}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language toggle */}
          <LanguageToggle
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200"
            buttonStyle={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accentText }}
            hoverStyle={{ background: hoverBg, borderColor: hoverBorder }}
          />

          {/* Theme toggle */}
          <button
            aria-label={t("theme.toggle")}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accentText }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = hoverBg;
              (e.currentTarget as HTMLElement).style.borderColor = hoverBorder;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = accentBg;
              (e.currentTarget as HTMLElement).style.borderColor = accentBorder;
            }}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Landing + legal pages: Sign In + Get Started */}
          {!isAuthPage && (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <button
                  className="px-4 py-2 text-sm rounded-lg transition-colors duration-200"
                  style={{ color: muted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = accentText)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
                >
                  {t("nav.signIn")}
                </button>
              </Link>
              <Link href="/auth/signup">
                <button
                  className="px-3 py-2 sm:px-5 rounded-xl text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: "linear-gradient(135deg,#22d3ee,#818cf8)",
                    color: "#ffffff",
                    boxShadow: "0 0 20px rgba(34,211,238,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(34,211,238,0.5)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(34,211,238,0.25)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {t("nav.getStarted")} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </>
          )}

          {/* Sign-in page: show Sign Up CTA */}
          {isLoginPage && (
            <Link href="/auth/signup">
              <button
                className="px-3 py-2 sm:px-5 rounded-xl text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all duration-200 whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg,#22d3ee,#818cf8)",
                  color: "#ffffff",
                  boxShadow: "0 0 20px rgba(34,211,238,0.25)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(34,211,238,0.5)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(34,211,238,0.25)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {t("nav.signUp")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          )}

          {/* Sign-up page or other auth pages: show Sign In CTA */}
          {isAuthPage && !isLoginPage && (
            <Link href="/auth/login">
              <button
                className="px-3 py-2 sm:px-5 rounded-xl text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all duration-200 whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg,#22d3ee,#818cf8)",
                  color: "#ffffff",
                  boxShadow: "0 0 20px rgba(34,211,238,0.25)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(34,211,238,0.5)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(34,211,238,0.25)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {t("nav.signIn")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
