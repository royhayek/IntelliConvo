"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Shield, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";

const NAV_TAB_DEFS = [
  { href: "/terms",            key: "terms",           icon: FileText },
  { href: "/privacy",          key: "privacy",         icon: Shield   },
  { href: "/mentions-legales", key: "mentionsLegales", icon: Scale    },
];

export interface TocEntry {
  id: string;
  label: string;
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  toc,
  children,
}: {
  title: string;
  description?: string;
  lastUpdated: string;
  toc: TocEntry[];
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const isDark = !mounted || resolvedTheme === "dark";

  const bg           = isDark ? "#020817"              : "#eef3ff";
  const grid         = isDark ? "rgba(34,211,238,0.03)": "rgba(6,182,212,0.05)";
  const headerBg     = isDark ? "rgba(2,8,23,0.88)"    : "rgba(238,243,255,0.92)";
  const headerBorder = isDark ? "rgba(34,211,238,0.08)": "rgba(6,182,212,0.18)";
  const textColor    = isDark ? "#e2f0ff"              : "#0a1628";
  const mutedColor   = isDark ? "#8892a4"              : "#4b5563";
  const tocBullet    = isDark ? "rgba(34,211,238,0.5)" : "rgba(6,182,212,0.6)";
  const dividerColor = isDark ? "rgba(34,211,238,0.08)": "rgba(6,182,212,0.15)";
  const tabBg        = isDark ? "rgba(34,211,238,0.07)": "rgba(6,182,212,0.09)";
  const accentText   = isDark ? "#22d3ee"              : "#0369a1";

  return (
    <div className="min-h-screen relative" style={{ background: bg, color: textColor }}>
      {/* Subtle page grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Legal doc switcher tabs (secondary nav below the fixed header) ─── */}
      <div
        className="sticky top-16 z-40 transition-all duration-300 border-b mt-16"
        style={{
          background: scrolled ? headerBg : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderColor: scrolled ? headerBorder : "transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-center">
          <nav
            className="hidden sm:flex items-center gap-1 p-1 rounded-xl"
            style={{ background: tabBg }}
          >
            {NAV_TAB_DEFS.map(({ href, key, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={
                    active
                      ? { background: "linear-gradient(135deg,#22d3ee,#818cf8)", color: "#fff" }
                      : { color: mutedColor }
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(`legal.tabs.${key}`)}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-14 relative z-10">
        {/* Title block */}
        <div className="mb-14">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
            style={{
              background: isDark ? "rgba(34,211,238,0.08)" : "rgba(6,182,212,0.1)",
              color: accentText,
              border: `1px solid ${isDark ? "rgba(34,211,238,0.18)" : "rgba(6,182,212,0.25)"}`,
            }}
          >
            {t("legal.ui.legalDocument")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-3">
            <span className="text-gradient-cyan">{title}</span>
          </h1>
          {description && (
            <p className="text-base max-w-xl mb-3" style={{ color: mutedColor }}>
              {description}
            </p>
          )}
          <p className="text-sm" style={{ color: mutedColor }}>
            {t("legal.ui.lastUpdated")}: <span style={{ color: accentText }}>{lastUpdated}</span>
          </p>
        </div>

        {/* Two-column: TOC + content */}
        <div className="flex gap-10 xl:gap-14 items-start">
          {/* Sticky TOC sidebar */}
          {toc.length > 0 && (
            <aside className="hidden xl:block w-60 flex-shrink-0 sticky top-24">
              <div className="auth-card rounded-2xl p-5">
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ color: accentText }}
                >
                  {t("legal.ui.onThisPage")}
                </p>
                <nav className="space-y-0.5">
                  {toc.map(({ id, label }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg text-sm transition-colors duration-150"
                      style={{ color: mutedColor }}
                    >
                      <span
                        className="mt-[7px] h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ background: tocBullet }}
                      />
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main content card */}
          <div className="flex-1 min-w-0">
            <div
              className="auth-card rounded-2xl px-8 py-10 sm:px-10 sm:py-12 legal-content"
              style={{ color: textColor }}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div
          className="mt-14 pt-8 border-t flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: dividerColor }}
        >
          <div className="flex flex-wrap gap-6">
            {NAV_TAB_DEFS.map(({ href, key }) => (
              <Link key={href} href={href} className="text-sm link-auth">
                {t(`legal.tabs.${key}`)}
              </Link>
            ))}
          </div>
          <Link
            href="/auth/signup"
            className="text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg,#22d3ee,#818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("legal.ui.getStarted")}
          </Link>
        </div>
      </div>
    </div>
  );
}
