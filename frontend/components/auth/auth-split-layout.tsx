"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Zap, Shield, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/public-header";
import { useTranslation } from "react-i18next";

export function AuthSplitLayout({ children, panel }: { children: React.ReactNode; panel: "login" | "signup" }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme === "dark";

  const bg = isDark ? "#020817" : "#eef3ff";
  const grid = isDark ? "rgba(34,211,238,0.04)" : "rgba(6,182,212,0.06)";
  const orbB = isDark ? "rgba(129,140,248,0.10)" : "rgba(99,102,241,0.06)";
  const text = isDark ? "#e2f0ff" : "#0a1628";
  const muted = isDark ? "#8892a4" : "#374151";
  const faint = isDark ? "#3a4d62" : "#9ca3af";
  const accentText = isDark ? "#22d3ee" : "#0369a1";
  const iconBg = isDark ? "rgba(34,211,238,0.10)" : "rgba(6,182,212,0.12)";
  const statBg = isDark ? "rgba(34,211,238,0.07)" : "rgba(6,182,212,0.10)";
  const statBorder = isDark ? "rgba(34,211,238,0.18)" : "rgba(6,182,212,0.30)";

  const PANEL_CONTENT = {
    login: {
      heading: t("auth.loginPanel.heading"),
      sub: t("auth.loginPanel.sub"),
      features: [
        { icon: Bot, text: t("auth.loginPanel.feature1") },
        { icon: Zap, text: t("auth.loginPanel.feature2") },
        { icon: Shield, text: t("auth.loginPanel.feature3") },
      ],
      stat: { value: "98%", label: t("auth.loginPanel.stat") },
    },
    signup: {
      heading: t("auth.signupPanel.heading"),
      sub: t("auth.signupPanel.sub"),
      features: [
        { icon: CheckCircle, text: t("auth.signupPanel.feature1") },
        { icon: Zap, text: t("auth.signupPanel.feature2") },
        { icon: Shield, text: t("auth.signupPanel.feature3") },
      ],
      stat: { value: "5 min", label: t("auth.signupPanel.stat") },
    },
  };

  const content = PANEL_CONTENT[panel];

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay },
  });

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen flex relative overflow-hidden pt-16" style={{ background: bg }}>
        {/* Page grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Bottom-right ambient orb */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orbB} 0%, transparent 65%)`,
            bottom: "-250px",
            right: "-150px",
          }}
        />

        {/* ── Left branded panel (desktop only) ────────────────���────────────── */}
        <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative flex-col items-center justify-center p-12 overflow-hidden flex-shrink-0">
          <div className="relative z-10 space-y-10 w-full max-w-[420px]">
            <motion.div {...fade(0.05)} className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight" style={{ color: text }}>
                {content.heading}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: muted }}>
                {content.sub}
              </p>
            </motion.div>

            {/* Feature list */}
            <div className="space-y-4">
              {content.features.map(({ icon: Icon, text: featureText }, i) => (
                <motion.div key={featureText} {...fade(0.18 + i * 0.07)} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: accentText }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: muted }}>
                    {featureText}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Stat pill */}
            <motion.div {...fade(0.38)}>
              <div
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border"
                style={{ background: statBg, borderColor: statBorder }}
              >
                <span className="text-2xl font-bold" style={{ color: accentText }}>
                  {content.stat.value}
                </span>
                <span className="text-sm" style={{ color: muted }}>
                  {content.stat.label}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Right form panel ───────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative z-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </>
  );
}
