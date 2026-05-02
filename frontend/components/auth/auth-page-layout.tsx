"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/layout/public-header";

export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme === "dark";

  const bg = isDark ? "#020817" : "#eef3ff";
  const grid = isDark ? "rgba(34,211,238,0.04)" : "rgba(6,182,212,0.07)";
  const orbA = isDark ? "rgba(34,211,238,0.10)" : "rgba(6,182,212,0.08)";
  const orbB = isDark ? "rgba(129,140,248,0.12)" : "rgba(99,102,241,0.08)";

  return (
    <>
      <PublicHeader />
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden pt-16"
        style={{ background: bg }}
      >
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Top-right orb */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${orbA} 0%, transparent 65%)`,
          top: "-250px",
          right: "-200px",
        }}
      />
      {/* Bottom-left orb */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${orbB} 0%, transparent 65%)`,
          bottom: "-200px",
          left: "-150px",
        }}
      />
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
    </>
  );
}
