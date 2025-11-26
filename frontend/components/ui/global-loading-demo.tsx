"use client";

import { useState } from "react";
import { GlobalLoading } from "./global-loading";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { MessageSquare, Sparkles, Zap, Heart } from "lucide-react";

/**
 * Demo component to showcase all GlobalLoading variations
 * This can be used in a test page or Storybook
 */
export function GlobalLoadingDemo() {
  const [animation, setAnimation] = useState<"pulse" | "spin" | "ripple">("pulse");
  const [showInline, setShowInline] = useState(false);
  const [customLogo, setCustomLogo] = useState(false);

  const logos = {
    default: <MessageSquare className="h-12 w-12 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />,
    sparkles: <Sparkles className="h-12 w-12 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />,
    zap: <Zap className="h-12 w-12 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400" strokeWidth={1.5} />,
    heart: <Heart className="h-12 w-12 text-pink-600 dark:text-pink-400 fill-pink-600 dark:fill-pink-400" strokeWidth={1.5} />,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            GlobalLoading Component Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore different animation styles and configurations
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Animation Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Animation Style
              </label>
              <div className="flex gap-2">
                <Button
                  variant={animation === "pulse" ? "default" : "outline"}
                  onClick={() => setAnimation("pulse")}
                >
                  Pulse
                </Button>
                <Button
                  variant={animation === "spin" ? "default" : "outline"}
                  onClick={() => setAnimation("spin")}
                >
                  Spin
                </Button>
                <Button
                  variant={animation === "ripple" ? "default" : "outline"}
                  onClick={() => setAnimation("ripple")}
                >
                  Ripple
                </Button>
              </div>
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variant
              </label>
              <div className="flex gap-2">
                <Button
                  variant={!showInline ? "default" : "outline"}
                  onClick={() => setShowInline(false)}
                >
                  Full Page
                </Button>
                <Button
                  variant={showInline ? "default" : "outline"}
                  onClick={() => setShowInline(true)}
                >
                  Inline
                </Button>
              </div>
            </div>

            {/* Logo Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Logo
              </label>
              <Button
                variant={customLogo ? "default" : "outline"}
                onClick={() => setCustomLogo(!customLogo)}
              >
                {customLogo ? "Using Custom Logo" : "Using Default Logo"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {showInline ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <GlobalLoading
                  variant="inline"
                  animation={animation}
                  message={`${animation.charAt(0).toUpperCase() + animation.slice(1)} animation`}
                  logo={customLogo ? logos.sparkles : undefined}
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="h-96 relative">
                  <GlobalLoading
                    variant="page"
                    animation={animation}
                    message={`${animation.charAt(0).toUpperCase() + animation.slice(1)} animation`}
                    logo={customLogo ? logos.sparkles : undefined}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Animations Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            All Animation Styles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["pulse", "spin", "ripple"] as const).map((anim) => (
              <Card key={anim}>
                <CardHeader>
                  <CardTitle className="capitalize">{anim}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8">
                    <GlobalLoading
                      variant="inline"
                      animation={anim}
                      message={`${anim} effect`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Logo Variations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Logo Variations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(logos).map(([name, logo]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="capitalize">{name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8">
                    <GlobalLoading
                      variant="inline"
                      animation="pulse"
                      message={name}
                      logo={logo}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Code Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm text-gray-800 dark:text-gray-200">
{`<GlobalLoading
  variant="${showInline ? "inline" : "page"}"
  animation="${animation}"
  message="Loading your content..."
  ${customLogo ? 'logo={<Sparkles className="h-12 w-12 text-purple-600" />}' : ''}
/>`}
              </code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
