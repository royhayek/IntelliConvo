"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuthRedirect } from "@/lib/hooks/useAuth";
import { GlobalLoading } from "@/components/ui/global-loading";
import { useGetBillingPlans } from "@/lib/api/generated/queries/subscriptions/subscriptions";
import { PublicHeader } from "@/components/layout/public-header";
import { BrandLogo } from "@/components/ui/brand-logo";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import dashboardDarkImg from "@/assets/images/sites-dashboard-dark.png";
import dashboardLightImg from "@/assets/images/sites-dashboard-light.png";
import overviewDarkImg from "@/assets/images/site-overview-dark.png";
import overviewLightImg from "@/assets/images/site-overview-light.png";
import contentDarkImg from "@/assets/images/website-content-dark.png";
import contentLightImg from "@/assets/images/website-content-light.png";
import conversationsDarkImg from "@/assets/images/site-conversations-dark.png";
import conversationsLightImg from "@/assets/images/site-conversations-light.png";
import widgetDarkImg from "@/assets/images/widget-customization-dark.png";
import widgetLightImg from "@/assets/images/widget-customization-light.png";
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  Bot,
  Rocket,
  Brain,
  Shield,
  BarChart3,
  Zap,
  Globe,
  MessageSquare,
  ShoppingCart,
  BookOpen,
  Building2,
  ChevronDown,
  UserCheck,
  Headphones,
  Star,
} from "lucide-react";

// ─── Theme colors ─────────────────────────────────────────────────────────────

function useColors(isDark: boolean) {
  return isDark
    ? {
        // Layout
        bg: "#020817",
        surface: "rgba(10,22,44,0.75)",
        cardShadow: "none",
        text: "#e2f0ff",
        muted: "#8892a4",
        faint: "#6b8bb1",
        veryFaint: "#3a4d62",
        border: "rgba(34,211,238,0.12)",
        grid: "rgba(34,211,238,0.04)",
        // Nav
        navBg: "rgba(2,8,23,0.88)",
        navBorder: "rgba(34,211,238,0.08)",
        // Cyan accent
        accentBg: "rgba(34,211,238,0.08)",
        accentBorder: "rgba(34,211,238,0.22)",
        accentText: "#22d3ee",
        outlineBg: "rgba(34,211,238,0.07)",
        outlineBorder: "rgba(34,211,238,0.25)",
        outlineText: "#22d3ee",
        outlineHoverBg: "rgba(34,211,238,0.14)",
        outlineHoverBorder: "rgba(34,211,238,0.45)",
        // Violet accent
        violetBg: "rgba(129,140,248,0.08)",
        violetBorder: "rgba(129,140,248,0.22)",
        violetText: "#818cf8",
        // Green accent
        greenBg: "rgba(52,211,153,0.08)",
        greenBorder: "rgba(52,211,153,0.22)",
        greenText: "#34d399",
        // Chat widget
        chatBg: "rgba(6,16,36,0.92)",
        chatHeader: "rgba(10,22,44,0.8)",
        chatMsgAi: "rgba(18,32,58,0.9)",
        chatInput: "rgba(10,22,44,0.6)",
        chatInputField: "rgba(34,211,238,0.06)",
        // Orbs
        orbA: "rgba(34,211,238,0.10)",
        orbB: "rgba(129,140,248,0.12)",
        // CTA icon bg
        ctaBg: "linear-gradient(135deg,rgba(34,211,238,0.15),rgba(129,140,248,0.15))",
        ctaBorder: "rgba(34,211,238,0.25)",
      }
    : {
        // Layout
        bg: "#eef3ff",
        surface: "#ffffff",
        cardShadow: "0 2px 20px rgba(0,0,0,0.07)",
        text: "#0a1628",
        muted: "#374151",
        faint: "#6b7280",
        veryFaint: "#9ca3af",
        border: "rgba(6,182,212,0.2)",
        grid: "rgba(6,182,212,0.07)",
        // Nav
        navBg: "rgba(238,243,255,0.92)",
        navBorder: "rgba(6,182,212,0.18)",
        // Cyan accent — solid opaque values so they pop on the light bg
        accentBg: "#cffafe",
        accentBorder: "#0891b2",
        accentText: "#0369a1",
        outlineBg: "#e0f9ff",
        outlineBorder: "#0891b2",
        outlineText: "#0369a1",
        outlineHoverBg: "#bae6fd",
        outlineHoverBorder: "#0369a1",
        // Violet accent — indigo-600 (#4f46e5) on white
        violetBg: "rgba(99,102,241,0.08)",
        violetBorder: "rgba(99,102,241,0.35)",
        violetText: "#4f46e5",
        // Green accent — emerald-600 (#059669) on white
        greenBg: "rgba(16,185,129,0.08)",
        greenBorder: "rgba(16,185,129,0.35)",
        greenText: "#059669",
        // Chat widget
        chatBg: "#ffffff",
        chatHeader: "#f5f9ff",
        chatMsgAi: "#f0f6ff",
        chatInput: "#f5f9ff",
        chatInputField: "rgba(6,182,212,0.07)",
        // Orbs
        orbA: "rgba(6,182,212,0.08)",
        orbB: "rgba(99,102,241,0.08)",
        // CTA icon bg
        ctaBg: "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(99,102,241,0.12))",
        ctaBorder: "rgba(6,182,212,0.3)",
      };
}

// ─── Particle canvas ──────────────────────────────────────────────────────────

function ParticleCanvas({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use a ref so the animation loop always reads the current theme without restart
  const isDarkRef = useRef(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

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
      pts = Array.from({ length: 65 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: Math.random() * 1.8 + 0.5,
        a: Math.random() * 0.6 + 0.2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // In light mode: use darker cyan-600 (6,182,212) at higher opacity so dots pop on light bg
      // In dark mode: cyan-400 (34,211,238) at normal opacity
      const dark = isDarkRef.current;
      const [r, g, b] = dark ? [34, 211, 238] : [6, 145, 178];
      const dotMult = dark ? 0.55 : 0.85;
      const lineMult = dark ? 0.14 : 0.3;

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
          if (d < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 140) * lineMult})`;
            ctx.lineWidth = 0.7;
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
  }, []); // only init once — theme changes are read via isDarkRef

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function TypeWriter({ words }: { words: string[] }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting) {
      if (text.length < word.length) {
        t = setTimeout(() => setText(word.slice(0, text.length + 1)), 88);
      } else {
        t = setTimeout(() => setDeleting(true), 2200);
      }
    } else {
      if (text.length > 0) {
        t = setTimeout(() => setText(text.slice(0, -1)), 46);
      } else {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % words.length);
      }
    }
    return () => clearTimeout(t);
  }, [text, deleting, wordIdx]);

  return (
    <span className="text-gradient-cyan whitespace-nowrap">
      {text}
      <span className="animate-chat-blink">|</span>
    </span>
  );
}

// ─── Chat demo — mirrors the real widget UI ───────────────────────────────────

const WIDGET_GRAD = "linear-gradient(135deg, #22d3ee, #818cf8)";
const WIDGET_GRAD_SOLID = "#22d3ee";

// Demo strings are passed as props for translation support

type DemoPhase =
  | "start"
  | "typing_q1"
  | "sending_q1"
  | "ai_typing_1"
  | "ai_streaming_1"
  | "pause_q2"
  | "typing_q2"
  | "sending_q2"
  | "ai_typing_2"
  | "ai_streaming_2"
  | "done";

interface ChatDemoProps {
  c: ReturnType<typeof useColors>;
  demoQ1: string;
  demoA1: string;
  demoQ2: string;
  demoA2: string;
  chatTab: string;
  speakTab: string;
  hello: string;
  typeMessage: string;
  chatAssistant: string;
}

function ChatDemo({
  c,
  demoQ1,
  demoA1,
  demoQ2,
  demoA2,
  chatTab,
  speakTab,
  hello,
  typeMessage,
  chatAssistant,
}: ChatDemoProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "speak">("chat");
  const [phase, setPhase] = useState<DemoPhase>("start");
  const [inputText, setInputText] = useState("");
  const [sendFlash, setSendFlash] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [showAiTyping, setShowAiTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const msgsContainerRef = useRef<HTMLDivElement>(null);
  const inputScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = msgsContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, showAiTyping, streamingText]);

  useEffect(() => {
    const el = inputScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [inputText]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let charInterval: ReturnType<typeof setInterval>;

    const typeText = (text: string, onDone: () => void) => {
      let idx = 0;
      setInputText("");
      charInterval = setInterval(() => {
        idx++;
        setInputText(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(charInterval);
          timeout = setTimeout(onDone, 480);
        }
      }, 58);
    };

    const streamText = (text: string, onDone: () => void) => {
      let idx = 0;
      setStreamingText("");
      charInterval = setInterval(() => {
        idx++;
        setStreamingText(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(charInterval);
          timeout = setTimeout(onDone, 180);
        }
      }, 22);
    };

    if (phase === "start") {
      timeout = setTimeout(() => setPhase("typing_q1"), 900);
    } else if (phase === "typing_q1") {
      typeText(demoQ1, () => setPhase("sending_q1"));
    } else if (phase === "sending_q1") {
      setSendFlash(true);
      timeout = setTimeout(() => {
        setSendFlash(false);
        setMessages((prev) => [...prev, { role: "user", text: demoQ1 }]);
        setInputText("");
        setPhase("ai_typing_1");
      }, 320);
    } else if (phase === "ai_typing_1") {
      setShowAiTyping(true);
      timeout = setTimeout(() => {
        setShowAiTyping(false);
        setPhase("ai_streaming_1");
      }, 750);
    } else if (phase === "ai_streaming_1") {
      streamText(demoA1, () => {
        setMessages((prev) => [...prev, { role: "ai", text: demoA1 }]);
        setStreamingText("");
        setPhase("pause_q2");
      });
    } else if (phase === "pause_q2") {
      timeout = setTimeout(() => setPhase("typing_q2"), 1100);
    } else if (phase === "typing_q2") {
      typeText(demoQ2, () => setPhase("sending_q2"));
    } else if (phase === "sending_q2") {
      setSendFlash(true);
      timeout = setTimeout(() => {
        setSendFlash(false);
        setMessages((prev) => [...prev, { role: "user", text: demoQ2 }]);
        setInputText("");
        setPhase("ai_typing_2");
      }, 320);
    } else if (phase === "ai_typing_2") {
      setShowAiTyping(true);
      timeout = setTimeout(() => {
        setShowAiTyping(false);
        setPhase("ai_streaming_2");
      }, 750);
    } else if (phase === "ai_streaming_2") {
      streamText(demoA2, () => {
        setMessages((prev) => [...prev, { role: "ai", text: demoA2 }]);
        setStreamingText("");
        setPhase("done");
      });
    } else if (phase === "done") {
      timeout = setTimeout(() => {
        setMessages([]);
        setShowAiTyping(false);
        setStreamingText("");
        setInputText("");
        setPhase("start");
      }, 4200);
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(charInterval);
    };
  }, [phase]);

  const isTyping = phase === "typing_q1" || phase === "typing_q2";

  return (
    <div
      className="relative animate-float"
      style={{ maxWidth: 390, width: "100%", paddingBottom: 64, paddingRight: 16 }}
    >
      {/* ── Card ── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: c.chatBg,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(34,211,238,0.18)",
        }}
      >
        {/* ── Gradient header ── */}
        <div className="px-5 pt-5 pb-4" style={{ background: WIDGET_GRAD }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  AI
                </div>
                <span
                  className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                  style={{ background: "#f59e0b", borderColor: WIDGET_GRAD_SOLID }}
                />
              </div>
              <span className="text-white font-semibold text-base">{chatAssistant}</span>
            </div>
            <button
              className="h-8 w-8 rounded-xl flex items-center justify-center text-white text-lg leading-none"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              ×
            </button>
          </div>

          <div className="flex gap-2">
            {(["chat", "speak"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: activeTab === tab ? "#ffffff" : "rgba(255,255,255,0.22)",
                  color: activeTab === tab ? "#4f46e5" : "rgba(255,255,255,0.9)",
                  boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                }}
              >
                {tab === "chat" ? chatTab : speakTab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Messages ── */}
        <div ref={msgsContainerRef} className="px-4 py-4 overflow-y-auto" style={{ background: c.chatBg, height: 300 }}>
          {/* Empty state placeholder */}
          {messages.length === 0 && !showAiTyping && !streamingText && (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-center" style={{ color: c.faint }}>
                {hello}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={msg.role === "user" ? { opacity: 0, y: 10, scale: 0.96 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-sm max-w-[86%] leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: WIDGET_GRAD, color: "#fff", borderBottomRightRadius: 4 }
                      : {
                          background: c.chatMsgAi,
                          border: `1px solid ${c.border}`,
                          color: c.text,
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {/* AI typing dots */}
            {showAiTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl flex gap-1"
                  style={{ background: c.chatMsgAi, border: `1px solid ${c.border}`, borderBottomLeftRadius: 4 }}
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: c.accentText, animation: `chatBlink 1.1s ${d * 0.18}s step-end infinite` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI streaming response */}
            {streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-sm max-w-[86%] leading-relaxed"
                  style={{
                    background: c.chatMsgAi,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    borderBottomLeftRadius: 4,
                  }}
                >
                  {streamingText}
                  <span className="animate-chat-blink ml-px" style={{ color: c.accentText }}>
                    |
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Input bar ── */}
        <div
          className="px-4 pb-5 pt-2 flex items-center gap-2"
          style={{ borderTop: `1px solid ${c.border}`, background: c.chatBg }}
        >
          {/* Input field — shows live typed text, single line */}
          <div
            className="flex-1 rounded-full px-4 py-2.5 text-sm flex items-center overflow-hidden"
            style={{ background: c.chatInputField, border: `1px solid ${c.border}`, minWidth: 0 }}
          >
            <div ref={inputScrollRef} className="overflow-hidden" style={{ whiteSpace: "nowrap", width: "100%" }}>
              {inputText ? (
                <span style={{ color: c.text }}>
                  {inputText}
                  {isTyping && (
                    <span className="animate-chat-blink ml-px" style={{ color: c.accentText }}>
                      |
                    </span>
                  )}
                </span>
              ) : (
                <span style={{ color: c.faint }}>{typeMessage}</span>
              )}
            </div>
          </div>

          <div
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer text-base select-none"
            style={{ background: c.chatMsgAi, border: `1px solid ${c.border}` }}
          >
            😊
          </div>
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ background: c.chatMsgAi, border: `1px solid ${c.border}` }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              style={{ color: c.faint }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
            </svg>
          </div>

          {/* Send button — flashes on send */}
          <motion.div
            animate={sendFlash ? { scale: 1.25, opacity: 0.75 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ background: WIDGET_GRAD }}
          >
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* ── Floating trigger bubble ── */}
      <div
        className="absolute bottom-0 right-4 h-14 w-14 rounded-full flex items-center justify-center shadow-xl"
        style={{ background: WIDGET_GRAD, boxShadow: "0 6px 24px rgba(34,211,238,0.45)" }}
      >
        <MessageSquare className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURE_META = [
  { icon: Brain, glow: "#22d3ee", key: "selfLearningAI" },
  { icon: Zap, glow: "#818cf8", key: "sub100ms" },
  { icon: Globe, glow: "#34d399", key: "multiLanguage" },
  { icon: MessageSquare, glow: "#f472b6", key: "voiceText" },
  { icon: Shield, glow: "#fb923c", key: "secure" },
  { icon: BarChart3, glow: "#a78bfa", key: "analytics" },
] as const;

const STEP_META = [
  { num: "01", icon: Globe, key: "connect" },
  { num: "02", icon: Bot, key: "tune" },
  { num: "03", icon: Rocket, key: "deploy" },
] as const;

const USE_CASE_META = [
  { icon: ShoppingCart, color: "#22d3ee", key: "ecommerce" },
  { icon: Building2, color: "#818cf8", key: "saas" },
  { icon: BookOpen, color: "#34d399", key: "blogs" },
] as const;

// ─── Theme toggle button ──────────────────────────────────────────────────────

// ─── Animated rocket icon ─────────────────────────────────────────────────────

function AnimatedRocket({ launching }: { launching: boolean }) {
  return (
    <>
      <Rocket
        style={{
          height: 18,
          width: 18,
          flexShrink: 0,
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          transform: launching ? "translateY(-4px) rotate(-35deg) scale(1.2)" : "translateY(0px) rotate(0deg) scale(1)",
          animation: launching ? "none" : "rocketBob 2.2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes rocketBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          30%       { transform: translateY(-3px) rotate(-8deg); }
          60%       { transform: translateY(1px) rotate(4deg); }
        }
      `}</style>
    </>
  );
}

// ─── Dashboard Showcase ───────────────────────────────────────────────────────

function DashboardShowcase({ c, isDark }: { c: ReturnType<typeof useColors>; isDark: boolean }) {
  const { t } = useTranslation();

  const screens = [
    {
      id: "dashboard",
      color: "#22d3ee",
      image: isDark ? dashboardDarkImg : dashboardLightImg,
      label: t("showcase.tabs.dashboard"),
      description: t("showcase.descriptions.dashboard"),
    },
    {
      id: "overview",
      color: "#818cf8",
      image: isDark ? overviewDarkImg : overviewLightImg,
      label: t("showcase.tabs.overview"),
      description: t("showcase.descriptions.overview"),
    },
    {
      id: "content",
      color: "#34d399",
      image: isDark ? contentDarkImg : contentLightImg,
      label: t("showcase.tabs.content"),
      description: t("showcase.descriptions.content"),
    },
    {
      id: "conversations",
      color: "#f472b6",
      image: isDark ? conversationsDarkImg : conversationsLightImg,
      label: t("showcase.tabs.conversations"),
      description: t("showcase.descriptions.conversations"),
    },
    {
      id: "widget",
      color: "#fb923c",
      image: isDark ? widgetDarkImg : widgetLightImg,
      label: t("showcase.tabs.widget"),
      description: t("showcase.descriptions.widget"),
    },
  ];

  return (
    <section id="showcase" className="py-28 px-6 lg:px-8" style={{ borderTop: `1px solid ${c.border}` }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span
            className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, color: c.accentText }}
          >
            {t("showcase.badge")}
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
            style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
          >
            {t("showcase.title")}
            <span className="text-gradient-cyan"> {t("showcase.titleHighlight")}</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: c.muted }}>
            {t("showcase.subtitle")}
          </p>
        </motion.div>

        {/* Alternating rows */}
        <div className="space-y-24">
          {screens.map((screen, i) => {
            const imageLeft = i % 2 === 0;
            return (
              <motion.div
                key={screen.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.75 }}
                className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
              >
                {/* Browser frame — order switches per row */}
                <div className={imageLeft ? "" : "lg:order-2"}>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: `1px solid ${screen.color}40`,
                      boxShadow: `0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px ${screen.color}18`,
                    }}
                  >
                    {/* Chrome bar */}
                    <div
                      className="px-3 py-2 flex items-center gap-2.5"
                      style={{
                        background: isDark ? "rgba(6,16,36,0.95)" : "#f1f5f9",
                        borderBottom: `1px solid ${c.border}`,
                      }}
                    >
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />
                      </div>
                      <div
                        className="flex-1 rounded px-2.5 py-1 text-xs flex items-center gap-1.5"
                        style={{
                          background: isDark ? "rgba(34,211,238,0.05)" : "rgba(6,182,212,0.06)",
                          border: `1px solid ${c.border}`,
                          color: c.faint,
                        }}
                      >
                        <svg
                          className="h-2.5 w-2.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                          />
                        </svg>
                        intelliconvo.com
                      </div>
                    </div>

                    {/* Screenshot — container shorter than image ratio forces vertical overflow;
                        objectPosition pushes clip window past the dark app navbar */}
                    <div style={{ lineHeight: 0, overflow: "hidden", position: "relative", paddingBottom: "55%" }}>
                      <Image
                        src={screen.image}
                        alt={screen.label}
                        fill
                        style={{ objectFit: "cover", objectPosition: "center 22%" }}
                        quality={90}
                      />
                    </div>
                  </div>
                </div>

                {/* Description — order switches per row */}
                <motion.div
                  initial={{ opacity: 0, x: imageLeft ? 24 : -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className={imageLeft ? "" : "lg:order-1"}
                >
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                    style={{
                      background: `${screen.color}15`,
                      border: `1px solid ${screen.color}35`,
                      color: screen.color,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: screen.color }} />
                    {t("showcase.badge")}
                  </div>
                  <h3
                    className="text-2xl md:text-3xl font-bold mb-4 leading-snug"
                    style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
                  >
                    {screen.label}
                  </h3>
                  <p className="text-base leading-relaxed" style={{ color: c.muted }}>
                    {screen.description}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StartTrialButton() {
  const [launch, setLaunch] = useState(false);
  const { t } = useTranslation();
  return (
    <Link href="/auth/signup">
      <button
        className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
        style={{
          background: "linear-gradient(135deg,#22d3ee,#818cf8)",
          color: "#ffffff",
          boxShadow: "0 0 30px rgba(34,211,238,0.3)",
        }}
        onMouseEnter={(e) => {
          setLaunch(true);
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 50px rgba(34,211,238,0.5)";
        }}
        onMouseLeave={(e) => {
          setLaunch(false);
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(34,211,238,0.3)";
        }}
      >
        <AnimatedRocket launching={launch} />
        {t("hero.startFreeTrial")}
      </button>
    </Link>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ c, isDark }: { c: ReturnType<typeof useColors>; isDark: boolean }) {
  const { t } = useTranslation();
  const stats = [
    { value: "5", suffix: " min", label: t("stats.setupLabel") },
    { value: "70", suffix: "+", label: t("stats.customLabel") },
    { value: "50", suffix: "+", label: t("stats.languagesLabel") },
    { value: "24", suffix: "/7", label: t("stats.availabilityLabel") },
  ];
  return (
    <div
      style={{
        borderTop: `1px solid ${c.border}`,
        borderBottom: `1px solid ${c.border}`,
        background: isDark ? "rgba(6,16,36,0.7)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <div
                className="text-4xl md:text-5xl font-extrabold leading-none mb-1.5 text-gradient-cyan"
                style={{ fontFamily: "var(--font-oxanium)" }}
              >
                {stat.value}
                {stat.suffix}
              </div>
              <div className="text-sm font-medium" style={{ color: c.muted }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Dashboard Mockup ───────────────────────────────────────────────────

function AgentDashboardMockup({ c, isDark }: { c: ReturnType<typeof useColors>; isDark: boolean }) {
  const convos = [
    { initials: "SM", name: "Sarah M.", status: "needs_agent", preview: "I can't find my order...", time: "just now" },
    { initials: "JD", name: "John D.", status: "agent_active", preview: "Thank you for helping!", time: "2m ago" },
    { initials: "EL", name: "Emma L.", status: "resolved", preview: "Perfect, that worked.", time: "5m ago" },
  ];
  const statusColor: Record<string, string> = {
    needs_agent: "#f59e0b",
    agent_active: "#22d3ee",
    resolved: "#34d399",
  };
  const statusLabel: Record<string, string> = {
    needs_agent: "Needs Agent",
    agent_active: "Agent Active",
    resolved: "Resolved",
  };

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        maxWidth: 420,
        background: c.surface,
        border: `1px solid ${c.border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(129,140,248,0.14)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: isDark ? "rgba(6,16,36,0.9)" : "#f8fafc",
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4" style={{ color: c.violetText }} />
          <span className="font-semibold text-sm" style={{ fontFamily: "var(--font-oxanium)", color: c.text }}>
            Live Agent Dashboard
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(52,211,153,0.15)",
            color: "#34d399",
            border: "1px solid rgba(52,211,153,0.3)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "#34d399" }} />3 Active
        </div>
      </div>

      {/* Conversation list */}
      <div className="divide-y" style={{ borderColor: c.border }}>
        {convos.map((conv, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
            className="px-5 py-4 flex items-start gap-3 cursor-pointer"
            style={{
              background: i === 0 ? (isDark ? "rgba(129,140,248,0.05)" : "rgba(99,102,241,0.03)") : "transparent",
            }}
          >
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: `${statusColor[conv.status]}20`,
                border: `2px solid ${statusColor[conv.status]}40`,
                color: statusColor[conv.status],
              }}
            >
              {conv.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-sm truncate" style={{ color: c.text }}>
                  {conv.name}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: c.faint }}>
                  {conv.time}
                </span>
              </div>
              <p className="text-xs truncate mb-1.5" style={{ color: c.faint }}>
                {conv.preview}
              </p>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: `${statusColor[conv.status]}15`,
                  color: statusColor[conv.status],
                  border: `1px solid ${statusColor[conv.status]}30`,
                }}
              >
                {statusLabel[conv.status]}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="px-5 py-4"
        style={{
          borderTop: `1px solid ${c.border}`,
          background: isDark ? "rgba(6,16,36,0.5)" : "#f8fafc",
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <UserCheck className="h-4 w-4" style={{ color: "#22d3ee" }} />
          <span className="text-xs font-semibold" style={{ color: c.muted }}>
            Agent joined the conversation
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((s) => (
            <Star key={s} className="h-3.5 w-3.5" style={{ color: "#f59e0b", fill: "#f59e0b" }} />
          ))}
          <span className="text-xs ml-1.5" style={{ color: c.faint }}>
            4.8 avg. rating
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Human Handoff Section ────────────────────────────────────────────────────

function HumanHandoffSection({ c, isDark }: { c: ReturnType<typeof useColors>; isDark: boolean }) {
  const { t } = useTranslation();
  const features = [
    { icon: Zap, color: "#22d3ee", titleKey: "feature1Title", bodyKey: "feature1Body" },
    { icon: BarChart3, color: "#818cf8", titleKey: "feature2Title", bodyKey: "feature2Body" },
    { icon: UserCheck, color: "#34d399", titleKey: "feature3Title", bodyKey: "feature3Body" },
    { icon: Star, color: "#f472b6", titleKey: "feature4Title", bodyKey: "feature4Body" },
  ] as const;

  return (
    <section
      id="handoff"
      className="py-28 px-6 lg:px-8 relative overflow-hidden"
      style={{ borderTop: `1px solid ${c.border}` }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: "50%",
          right: "-10%",
          transform: "translateY(-50%)",
          background: `radial-gradient(circle, ${c.orbB} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span
              className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-widest uppercase"
              style={{
                background: c.violetBg,
                border: `1px solid ${c.violetBorder}`,
                color: c.violetText,
              }}
            >
              {t("humanHandoff.badge")}
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
            >
              {t("humanHandoff.title")}
              <br />
              <span style={{ color: c.violetText }}>{t("humanHandoff.titleHighlight")}</span>
            </h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color: c.muted }}>
              {t("humanHandoff.subtitle")}
            </p>

            <div className="space-y-5">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: `${f.color}18`,
                      border: `1px solid ${f.color}30`,
                    }}
                  >
                    <f.icon className="h-4 w-4" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ fontFamily: "var(--font-oxanium)", color: c.text }}>
                      {t(`humanHandoff.${f.titleKey}`)}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: c.faint }}>
                      {t(`humanHandoff.${f.bodyKey}`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <AgentDashboardMockup c={c} isDark={isDark} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

type PricingPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  interval?: "monthly" | "annual";
  features: string[];
  trialDays?: number;
};

function PricingSection({
  c,
  isDark,
  plans,
}: {
  c: ReturnType<typeof useColors>;
  isDark: boolean;
  plans: PricingPlan[];
}) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const { t } = useTranslation();

  const monthlyPlan = plans.find((p) => p.interval === "monthly");
  const annualPlan = plans.find((p) => p.interval === "annual");
  const trialDays = plans[0]?.trialDays ?? 0;

  const savingsPercent =
    monthlyPlan && annualPlan && monthlyPlan.price > 0
      ? Math.round((1 - annualPlan.price / 12 / monthlyPlan.price) * 100)
      : 17;

  const formatPrice = (price: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);

  const PRICING_FEATURES = [
    t("pricing.feature1"),
    t("pricing.feature2"),
    t("pricing.feature3"),
    t("pricing.feature4"),
    t("pricing.feature5"),
    t("pricing.feature6"),
    t("pricing.feature7"),
    t("pricing.feature8"),
  ];

  return (
    <section
      id="pricing"
      className="py-28 px-6 lg:px-8 relative overflow-hidden"
      style={{ borderTop: `1px solid ${c.border}` }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Central orb */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700,
          height: 700,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          background: `radial-gradient(circle, ${c.orbA} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span
            className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{
              background: c.accentBg,
              border: `1px solid ${c.accentBorder}`,
              color: c.accentText,
            }}
          >
            {t("pricing.badge")}
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
            style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
          >
            {t("pricing.title")}
            <span className="text-gradient-cyan"> {t("pricing.titleHighlight")}</span>
          </h2>
          <p className="text-base" style={{ color: c.muted }}>
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-12">
          <div
            className="flex rounded-xl p-1.5 gap-1"
            style={{ background: c.surface, border: `1px solid ${c.border}` }}
          >
            {(["monthly", "annual"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                style={{
                  background: billingCycle === cycle ? "linear-gradient(135deg,#22d3ee,#818cf8)" : "transparent",
                  color: billingCycle === cycle ? "#ffffff" : c.muted,
                  boxShadow: billingCycle === cycle ? "0 0 20px rgba(34,211,238,0.3)" : "none",
                }}
              >
                {cycle === "monthly" ? t("pricing.billingMonthly") : t("pricing.billingAnnual")}
                {cycle === "annual" && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: billingCycle === "annual" ? "rgba(255,255,255,0.25)" : c.greenBg,
                      color: billingCycle === "annual" ? "#fff" : c.greenText,
                      border: `1px solid ${billingCycle === "annual" ? "rgba(255,255,255,0.35)" : c.greenBorder}`,
                    }}
                  >
                    -{savingsPercent}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        {plans.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {(["monthly", "annual"] as const).map((cycle, ci) => {
              const plan = plans.find((p) => p.interval === cycle);
              if (!plan) return null;
              const isAnnual = cycle === "annual";
              const displayPrice = isAnnual ? plan.price / 12 : plan.price;
              const isSelected = billingCycle === cycle;

              return (
                <motion.div
                  key={cycle}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: ci * 0.1 }}
                  className="rounded-2xl p-8 relative overflow-hidden transition-all duration-300"
                  style={{
                    background: isSelected ? (isDark ? "rgba(34,211,238,0.04)" : "rgba(6,182,212,0.03)") : c.surface,
                    border: `1.5px solid ${isSelected ? (isDark ? "rgba(34,211,238,0.4)" : "#0891b2") : c.border}`,
                    boxShadow: isSelected
                      ? `0 0 50px ${isDark ? "rgba(34,211,238,0.1)" : "rgba(6,182,212,0.12)"}`
                      : c.cardShadow,
                  }}
                >
                  {isAnnual && (
                    <div
                      className="absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: "linear-gradient(135deg,#22d3ee,#818cf8)",
                        color: "#fff",
                      }}
                    >
                      {t("pricing.mostPopular")}
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-oxanium)", color: c.text }}>
                    {isAnnual ? t("pricing.billingAnnual") : t("pricing.billingMonthly")}
                  </h3>

                  <div className="mb-2 flex items-end gap-2">
                    <span
                      className="text-5xl font-extrabold leading-none"
                      style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
                    >
                      {formatPrice(displayPrice, plan.currency)}
                    </span>
                    <span className="text-sm mb-1.5" style={{ color: c.faint }}>
                      {t("pricing.perMonth")}
                    </span>
                  </div>

                  {isAnnual && (
                    <p className="text-sm mb-1" style={{ color: c.faint }}>
                      {formatPrice(plan.price, plan.currency)} {t("pricing.perMonthBilled")}
                    </p>
                  )}

                  {trialDays > 0 ? (
                    <div
                      className="mt-3 mb-7 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: c.greenBg,
                        border: `1px solid ${c.greenBorder}`,
                        color: c.greenText,
                      }}
                    >
                      <CheckCircle className="h-3 w-3" />
                      {trialDays}-day free trial included
                    </div>
                  ) : (
                    <div className="mb-7" />
                  )}

                  <Link href="/auth/signup">
                    <button
                      className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mb-8"
                      style={
                        isSelected
                          ? {
                              background: "linear-gradient(135deg,#22d3ee,#818cf8)",
                              color: "#fff",
                              boxShadow: "0 0 25px rgba(34,211,238,0.35)",
                            }
                          : {
                              background: c.surface,
                              border: `1px solid ${c.border}`,
                              color: c.text,
                            }
                      }
                      onMouseEnter={(e) => {
                        if (isSelected) {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(34,211,238,0.55)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isSelected) {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 25px rgba(34,211,238,0.35)";
                        }
                      }}
                    >
                      {trialDays > 0 ? t("pricing.startTrial") : t("pricing.getStarted")}
                    </button>
                  </Link>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: c.faint }}>
                      {t("pricing.includedTitle")}
                    </p>
                    <ul className="space-y-3">
                      {PRICING_FEATURES.map((feat, fi) => (
                        <li key={fi} className="flex items-center gap-3 text-sm" style={{ color: c.muted }}>
                          <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: c.accentText }} />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Fallback when no plans loaded */
          <div className="text-center">
            <Link href="/auth/signup">
              <button
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold"
                style={{
                  background: "linear-gradient(135deg,#22d3ee,#818cf8)",
                  color: "#fff",
                  boxShadow: "0 0 30px rgba(34,211,238,0.3)",
                }}
              >
                <Rocket className="h-5 w-5" />
                {t("pricing.startTrial")}
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

function FAQSection({ c }: { c: ReturnType<typeof useColors> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { t } = useTranslation();

  const faqs = Array.from({ length: 8 }, (_, i) => ({
    q: t(`faq.q${i + 1}`),
    a: t(`faq.a${i + 1}`),
  }));

  return (
    <section id="faq" className="py-28 px-6 lg:px-8" style={{ borderTop: `1px solid ${c.border}` }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{
              background: c.accentBg,
              border: `1px solid ${c.accentBorder}`,
              color: c.accentText,
            }}
          >
            {t("faq.badge")}
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
            style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
          >
            {t("faq.title")}
            <span className="text-gradient-cyan"> {t("faq.titleHighlight")}</span>
          </h2>
          <p className="text-base" style={{ color: c.muted }}>
            {t("faq.subtitle")}
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: c.surface,
                border: `1px solid ${openIdx === i ? c.accentBorder : c.border}`,
                boxShadow: openIdx === i ? `0 0 20px ${c.orbA}` : c.cardShadow,
              }}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-base pr-4 leading-snug" style={{ color: c.text }}>
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-4 w-4" style={{ color: c.accentText }} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="px-6 pb-6 pt-0">
                      <div
                        style={{
                          height: 1,
                          background: c.border,
                          marginBottom: 16,
                        }}
                      />
                      <p className="text-sm leading-relaxed" style={{ color: c.muted }}>
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isLoading } = useAuthRedirect();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  const { data: apiPlans = [] } = useGetBillingPlans({
    query: { staleTime: 1000 * 60 * 60 },
  });
  const trialDays = apiPlans[0]?.trialDays ?? 0;
  const trialLabel = trialDays > 0 ? t("common.freeTrial", { count: trialDays }) : null;
  const trustItems = trialLabel
    ? [trialLabel, t("hero.cancelAnytime"), t("hero.gdprCompliant"), t("hero.setupIn5Minutes")]
    : [t("hero.cancelAnytime"), t("hero.gdprCompliant"), t("hero.setupIn5Minutes")];

  const typewriterWords = t("hero.typewriterWords", { returnObjects: true }) as string[];

  const features = FEATURE_META.map((f) => ({
    ...f,
    title: t(`features.${f.key}.title`),
    description: t(`features.${f.key}.description`),
  }));

  const steps = STEP_META.map((s) => ({
    ...s,
    title: t(`howItWorks.${s.key}.title`),
    body: t(`howItWorks.${s.key}.body`),
  }));

  const useCases = USE_CASE_META.map((u) => ({
    ...u,
    tag: t(`useCases.${u.key}.tag`),
    headline: t(`useCases.${u.key}.headline`),
    description: t(`useCases.${u.key}.description`),
  }));

  useEffect(() => setMounted(true), []);

  // Default to dark until hydrated to avoid flash
  const isDark = !mounted || resolvedTheme !== "light";
  const c = useColors(isDark);

  if (isLoading) return <GlobalLoading message={t("common.loading")} />;

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: c.bg, color: c.text, fontFamily: "var(--font-inter)" }}
    >
      <PublicHeader />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      >
        <ParticleCanvas isDark={isDark} />

        {/* Orbs */}
        <div
          className="absolute rounded-full pointer-events-none animate-orb-drift"
          style={{
            width: 700,
            height: 700,
            top: "-15%",
            left: "-10%",
            background: `radial-gradient(circle, ${c.orbA} 0%, transparent 65%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none animate-orb-drift-alt"
          style={{
            width: 600,
            height: 600,
            bottom: "-10%",
            right: "-5%",
            background: `radial-gradient(circle, ${c.orbB} 0%, transparent 65%)`,
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6"
                style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
              >
                {t("hero.title")}
                <br />
                <TypeWriter words={typewriterWords} />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg leading-relaxed mb-10 max-w-xl"
                style={{ color: c.muted }}
              >
                {t("hero.description")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.55 }}
                className="flex flex-wrap gap-4 mb-10"
              >
                <StartTrialButton />
                <Link href="#features">
                  <button
                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
                    style={{
                      background: c.outlineBg,
                      border: `1px solid ${c.outlineBorder}`,
                      color: c.outlineText,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = c.outlineHoverBg;
                      (e.currentTarget as HTMLElement).style.borderColor = c.outlineHoverBorder;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = c.outlineBg;
                      (e.currentTarget as HTMLElement).style.borderColor = c.outlineBorder;
                    }}
                  >
                    {t("hero.exploreFeatures")} <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.75 }}
                className="flex flex-wrap gap-3"
              >
                {trustItems.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs" style={{ color: c.faint }}>
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: c.accentText }} />
                    {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right — chat demo */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="flex justify-center lg:justify-end"
            >
              <ChatDemo
                c={c}
                demoQ1={t("chatDemo.demoQ1")}
                demoA1={t("chatDemo.demoA1")}
                demoQ2={t("chatDemo.demoQ2")}
                demoA2={t("chatDemo.demoA2")}
                chatTab={t("chatDemo.chatTab")}
                speakTab={t("chatDemo.speakTab")}
                hello={t("chatDemo.hello")}
                typeMessage={t("chatDemo.typeMessage")}
                chatAssistant={t("chatDemo.chatAssistant")}
              />
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent, ${c.bg})` }}
        />
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
      <StatsBar c={c} isDark={isDark} />

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6 lg:px-8" style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span
              className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{
                background: c.accentBg,
                border: `1px solid ${c.accentBorder}`,
                color: c.accentText,
              }}
            >
              {t("features.badge")}
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
              style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
            >
              {t("features.title")}
              <span className="text-gradient-cyan"> {t("features.titleHighlight")}</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: c.muted }}>
              {t("features.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="rounded-2xl p-7 group transition-all duration-300"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  backdropFilter: "blur(12px)",
                  boxShadow: c.cardShadow,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${f.glow}55`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${f.glow}12`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = c.border;
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `radial-gradient(circle, ${f.glow}22, ${f.glow}08)`,
                    border: `1px solid ${f.glow}30`,
                    boxShadow: `0 0 20px ${f.glow}18`,
                  }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.glow }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2.5"
                  style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: c.faint }}>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Human Handoff ───────────────────────────────────────────────────── */}
      <HumanHandoffSection c={c} isDark={isDark} />

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section
        id="how"
        className="py-28 px-6 lg:px-8 relative overflow-hidden"
        style={{
          borderTop: `1px solid ${c.border}`,
          backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      >
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 500,
            height: 500,
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(circle, ${c.orbB} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span
              className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{
                background: c.violetBg,
                border: `1px solid ${c.violetBorder}`,
                color: c.violetText,
              }}
            >
              {t("howItWorks.badge")}
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
              style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
            >
              {t("howItWorks.title")} <span style={{ color: c.violetText }}>{t("howItWorks.titleHighlight")}</span>
            </h2>
            <p className="text-base" style={{ color: c.muted }}>
              {t("howItWorks.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div
              className="hidden md:block absolute top-12 left-[33%] right-[33%] h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg,rgba(34,211,238,0.3),rgba(129,140,248,0.3))" }}
            />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.18 }}
                className="rounded-2xl p-8 text-center relative transition-all duration-300"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  backdropFilter: "blur(12px)",
                  boxShadow: c.cardShadow,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,211,238,0.35)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(34,211,238,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = c.border;
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="absolute top-5 right-6 text-5xl font-bold pointer-events-none select-none"
                  style={{ fontFamily: "var(--font-oxanium)", color: "rgba(34,211,238,0.07)" }}
                >
                  {step.num}
                </div>
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: c.ctaBg,
                    border: `1px solid ${c.ctaBorder}`,
                    boxShadow: `0 0 25px ${c.orbA}`,
                  }}
                >
                  <step.icon className="h-6 w-6" style={{ color: c.accentText }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-oxanium)", color: c.text }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: c.faint }}>
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Showcase ──────────────────────────────────────────────── */}
      <DashboardShowcase c={c} isDark={isDark} />

      {/* ── Use Cases ───────────────────────────────────────────────────────── */}
      <section id="usecases" className="py-28 px-6 lg:px-8" style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span
              className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{
                background: c.greenBg,
                border: `1px solid ${c.greenBorder}`,
                color: c.greenText,
              }}
            >
              {t("useCases.badge")}
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
              style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
            >
              {t("useCases.title")}
              <span style={{ color: c.greenText }}> {t("useCases.titleHighlight")}</span>
            </h2>
            <p className="text-base" style={{ color: c.muted }}>
              {t("useCases.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="rounded-2xl p-8 flex flex-col transition-all duration-300"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  backdropFilter: "blur(12px)",
                  boxShadow: c.cardShadow,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${uc.color}44`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${uc.color}10`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = c.border;
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: `radial-gradient(circle, ${uc.color}22, ${uc.color}08)`,
                    border: `1px solid ${uc.color}30`,
                    boxShadow: `0 0 20px ${uc.color}18`,
                  }}
                >
                  <uc.icon className="h-5 w-5" style={{ color: uc.color }} />
                </div>
                <span
                  className="inline-block text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: uc.color }}
                >
                  {uc.tag}
                </span>
                <h3
                  className="text-xl font-semibold mb-3 leading-snug"
                  style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
                >
                  {uc.headline}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: c.faint }}>
                  {uc.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <PricingSection c={c} isDark={isDark} plans={apiPlans as PricingPlan[]} />

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <FAQSection c={c} />

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 lg:px-8 relative overflow-hidden" style={{ borderTop: `1px solid ${c.border}` }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(34,211,238,0.06) 0%, rgba(129,140,248,0.05) 40%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none animate-orb-drift"
          style={{
            width: 400,
            height: 400,
            top: 0,
            left: "15%",
            background: `radial-gradient(circle, ${c.orbA} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none animate-orb-drift-alt"
          style={{
            width: 400,
            height: 400,
            bottom: 0,
            right: "15%",
            background: `radial-gradient(circle, ${c.orbB} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <div
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-8"
            style={{
              background: c.ctaBg,
              border: `1px solid ${c.ctaBorder}`,
              boxShadow: `0 0 40px ${c.orbA}`,
            }}
          >
            <Sparkles className="h-7 w-7" style={{ color: c.accentText }} />
          </div>

          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "var(--font-oxanium)", color: c.text }}
          >
            {t("cta.title")}
            <span className="text-gradient-cyan"> {t("cta.titleHighlight")}</span>
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: c.muted }}>
            {t("cta.subtitle")}
          </p>

          <Link href="/auth/signup">
            <button
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg,#22d3ee,#818cf8)",
                color: "#ffffff",
                boxShadow: "0 0 40px rgba(34,211,238,0.35)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(34,211,238,0.55)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(34,211,238,0.35)";
              }}
            >
              <Rocket className="h-5 w-5" />
              {t("cta.startTrial")}
            </button>
          </Link>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              ...(trialLabel ? [trialLabel] : []),
              t("cta.cancelAnytime"),
              t("cta.gdprCompliant"),
              t("cta.setupIn5Minutes"),
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm" style={{ color: c.faint }}>
                <CheckCircle className="h-4 w-4" style={{ color: c.accentText }} />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="px-6 lg:px-8 py-16"
        style={{ borderTop: `1px solid ${c.border}`, background: isDark ? "rgba(2,8,23,0.8)" : c.surface }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-5">
                <BrandLogo size="sm" href="/" animated={false} />
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: c.veryFaint }}>
                {t("footer.tagline")}
              </p>
              <p className="text-xs" style={{ color: c.veryFaint }}>
                {t("footer.company")}
              </p>
            </div>

            {[
              {
                heading: t("footer.product"),
                links: [
                  [t("footer.features"), "#features"],
                  [t("footer.howItWorks"), "#how"],
                  [t("footer.useCases"), "#usecases"],
                  [t("footer.pricing2"), "#pricing"],
                  [t("footer.faq"), "#faq"],
                ],
              },
              {
                heading: t("footer.legal"),
                links: [
                  [t("footer.terms"), "/terms"],
                  [t("footer.privacy"), "/privacy"],
                  [t("footer.legalNotice"), "/mentions-legales"],
                ],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-oxanium)", color: c.text }}>
                  {heading}
                </h4>
                <ul className="space-y-3">
                  {links.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm transition-colors duration-200"
                        style={{ color: c.veryFaint }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = c.accentText)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = c.veryFaint)}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: `1px solid ${c.border}` }}
          >
            <p className="text-sm" style={{ color: c.veryFaint }}>
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-5">
              {[
                {
                  label: "Twitter",
                  d: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84",
                },
                {
                  label: "LinkedIn",
                  d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
                },
              ].map(({ label, d }) => (
                <Link
                  key={label}
                  href="#"
                  className="transition-colors duration-200"
                  style={{ color: c.veryFaint }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = c.accentText)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = c.veryFaint)}
                >
                  <span className="sr-only">{label}</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={d} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
