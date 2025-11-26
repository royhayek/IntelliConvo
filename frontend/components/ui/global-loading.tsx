"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BrandLogo } from "./brand-logo";

interface GlobalLoadingProps {
  /**
   * Variant determines the layout style
   * - 'page': Full page centered loading (default)
   * - 'inline': Inline loading for smaller sections
   */
  variant?: "page" | "inline";

  /**
   * Custom message to display below the animation
   */
  message?: string;

  /**
   * Animation style
   * - 'pulse': Pulsing waves (default)
   * - 'spin': Rotating rings
   * - 'ripple': Ripple effect
   */
  animation?: "pulse" | "spin" | "ripple";

  /**
   * Custom logo component (optional)
   * If not provided, uses the default chat icon
   */
  logo?: React.ReactNode;
}

/**
 * Global loading component with beautiful animations that respect theme
 *
 * @example
 * ```tsx
 * // Full page loading
 * <GlobalLoading message="Loading your workspace..." />
 *
 * // Inline loading
 * <GlobalLoading variant="inline" animation="spin" />
 * ```
 */
export function GlobalLoading({
  variant = "page",
  message,
  animation = "pulse",
  logo,
}: GlobalLoadingProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for theme to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is active
  const isDark = mounted && resolvedTheme === "dark";

  // Default logo if none provided
  const defaultLogo = <BrandLogo size="lg" showText={false} href={null} animated={false} />;

  const logoElement = logo || defaultLogo;

  // Pulse animation - waves emanating from logo
  const PulseAnimation = () => (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Logo */}
      <div className="relative z-10">
        {logoElement}
      </div>

      {/* Pulse waves */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`absolute w-20 h-20 rounded-full animate-ping ${
            isDark
              ? 'bg-indigo-500/30'
              : 'bg-indigo-500/20'
          }`}
          style={{ animationDuration: '2s' }}
        />
        <div
          className={`absolute w-16 h-16 rounded-full animate-ping ${
            isDark
              ? 'bg-purple-500/30'
              : 'bg-purple-500/20'
          }`}
          style={{ animationDuration: '2s', animationDelay: '0.5s' }}
        />
        <div
          className={`absolute w-12 h-12 rounded-full animate-ping ${
            isDark
              ? 'bg-indigo-400/30'
              : 'bg-indigo-400/20'
          }`}
          style={{ animationDuration: '2s', animationDelay: '1s' }}
        />
      </div>
    </div>
  );

  // Spin animation - rotating rings
  const SpinAnimation = () => (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Logo */}
      <div className="relative z-10">
        {logoElement}
      </div>

      {/* Rotating rings */}
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 rounded-full border-4 border-transparent ${
            isDark
              ? 'border-t-indigo-500 border-r-purple-500'
              : 'border-t-indigo-600 border-r-purple-600'
          } animate-spin`}
          style={{ animationDuration: '1.5s' }}
        />
      </div>
      <div className="absolute inset-2">
        <div
          className={`absolute inset-0 rounded-full border-4 border-transparent ${
            isDark
              ? 'border-b-purple-500 border-l-indigo-500'
              : 'border-b-purple-600 border-l-indigo-600'
          } animate-spin`}
          style={{ animationDuration: '2s', animationDirection: 'reverse' }}
        />
      </div>
    </div>
  );

  // Ripple animation - expanding circles
  const RippleAnimation = () => (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Logo */}
      <div className="relative z-10">
        {logoElement}
      </div>

      {/* Ripples */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full border-2 ${
              isDark
                ? 'border-indigo-500/40'
                : 'border-indigo-600/40'
            }`}
            style={{
              animation: `ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 96px;
            height: 96px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );

  // Select animation based on prop
  const AnimationComponent = () => {
    switch (animation) {
      case "spin":
        return <SpinAnimation />;
      case "ripple":
        return <RippleAnimation />;
      case "pulse":
      default:
        return <PulseAnimation />;
    }
  };

  // Inline variant
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <AnimationComponent />
          {message && (
            <p className={`text-sm font-medium animate-pulse ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full page variant
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br ${
        isDark
          ? 'from-gray-900 to-gray-800'
          : 'from-gray-50 to-gray-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Animation */}
        {/* <AnimationComponent /> */}

        {/* Message */}
        {message && (
          <div className="text-center space-y-2 max-w-sm">
            <h2 className={`text-xl font-semibold animate-pulse ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {message}
            </h2>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Please wait a moment...
            </p>
          </div>
        )}

        {/* Loading dots */}
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                isDark ? 'bg-indigo-400' : 'bg-indigo-600'
              } animate-bounce`}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
