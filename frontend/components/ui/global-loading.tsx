"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { BrandLogo } from "@/components/ui/brand-logo";

interface GlobalLoadingProps {
  variant?: "page" | "inline";
  message?: string;
  animation?: "pulse" | "spin" | "ripple";
  logo?: React.ReactNode;
}

function MiniParticles({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDarkRef = useRef(isDark);
  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let animId: number;
    let pts: P[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const init = () => {
      resize();
      pts = Array.from({ length: 45 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.35 + 0.08,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = isDarkRef.current;
      const [r, g, b] = dark ? [34, 211, 238] : [6, 145, 178];
      const dotMult = dark ? 1 : 0.85;
      const lineMult = dark ? 0.1 : 0.25;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.a * dotMult})`;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 120) * lineMult})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function GlobalLoading({ variant = "page", message }: GlobalLoadingProps) {
  const { resolvedTheme } = useTheme();

  // Initialise from localStorage synchronously so the loading screen uses the
  // correct theme before next-themes has finished hydrating (resolvedTheme is
  // undefined on the first render, causing a false dark-mode flash).
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (resolvedTheme) setIsDark(resolvedTheme === "dark");
  }, [resolvedTheme]);

  const accent = isDark ? "34,211,238" : "6,145,178";
  const bg = isDark ? "#020817" : "#eef3ff";
  const grid = isDark ? "rgba(34,211,238,0.04)" : "rgba(6,182,212,0.06)";
  const nameColor = isDark
    ? "linear-gradient(135deg,#818cf8,#6466f1,#4f46e5)"
    : "linear-gradient(135deg,#6366f1,#4f46e5,#3730a3)";
  const msgColor = isDark ? "#6b8bb1" : "#6b7280";
  const scanColor = isDark
    ? "linear-gradient(90deg,transparent,#22d3ee,transparent)"
    : "linear-gradient(90deg,transparent,#0891b2,transparent)";

  // Inline variant — small spinner
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <BrandLogo size="sm" variant="icon-only" href={null} animated={true} />
            <div
              className="absolute inset-0 rounded-xl animate-ping"
              style={{ background: `rgba(${accent},0.3)` }}
            />
          </div>
          {message && (
            <p className="text-sm" style={{ color: msgColor, fontFamily: "var(--font-inter)" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full-page variant
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: bg,
        backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    >
      <MiniParticles isDark={isDark} />

      {/* Gradient orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          background: `radial-gradient(circle, rgba(${accent},0.08) 0%, transparent 65%)`,
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          bottom: "-10%",
          right: "-5%",
          background: `radial-gradient(circle, rgba(129,140,248,${isDark ? "0.1" : "0.08"}) 0%, transparent 65%)`,
          filter: "blur(60px)",
          animation: "orbDriftAlt 14s ease-in-out infinite",
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with pulsing rings */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full"
            style={{
              width: 120,
              height: 120,
              border: `1px solid rgba(${accent},0.15)`,
              animation: "pulseRing 2s ease-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 96,
              height: 96,
              border: `1px solid rgba(${accent},0.25)`,
              animation: "pulseRing 2s ease-out 0.4s infinite",
            }}
          />
          <div
            className="absolute rounded-2xl"
            style={{
              width: 72,
              height: 72,
              background: "rgba(99,102,241,0.18)",
              filter: "blur(16px)",
              animation: "pulseGlow 3s ease-in-out infinite",
            }}
          />
          <BrandLogo size="md" variant="icon-only" href={null} animated={true} />
        </div>

        {/* Brand name + message */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-oxanium)",
              background: nameColor,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            IntelliConvo
          </span>
          <p className="text-sm" style={{ color: msgColor, fontFamily: "var(--font-inter)" }}>
            {message || "Initializing your workspace…"}
          </p>
        </div>

        {/* Scanning progress bar */}
        <div
          className="relative w-48 h-px overflow-hidden rounded-full"
          style={{ background: `rgba(${accent},0.12)` }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: "40%",
              background: scanColor,
              animation: "scanBar 1.6s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(0.85); opacity: 0.8; }
        }
        @keyframes scanBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
