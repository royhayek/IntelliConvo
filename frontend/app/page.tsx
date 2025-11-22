"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/feature-card";
import { TrustBadge } from "@/components/marketing/trust-badge";
import { CTASection } from "@/components/marketing/cta-section";
import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen gradient-surface">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Intelligentconvo
              </span>
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="hover:bg-white/60 dark:hover:bg-slate-700/40">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="gradient" size="lg">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <div className="mb-6">
            <TrustBadge text="Trusted by 1000+ websites" delay={0.2} />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight"
          >
            Meet{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Intelligentconvo
            </span>
            <br />
            <span className="text-5xl md:text-6xl text-gray-600 dark:text-gray-400">
              the AI that will get you{" "}
              <motion.span
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-indigo-600 dark:text-indigo-400 inline-block"
              >
                excited
              </motion.span>{" "}
              again
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Automatically crawl your website, create a knowledge base, and provide visitors
            with AI-powered assistance through both{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">text chat</span> and{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">voice interactions</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Link href="/auth/signup">
              <Button variant="gradient" size="lg" className="px-10 py-4 text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-10 py-4 text-lg hover:bg-white/80 dark:hover:bg-slate-800/60">
                <Globe className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          id="features"
          className="mt-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Key Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to make your website more interactive and intelligent
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Zero-Training Required",
                description: "Automatically crawls your website and learns from your content. No manual training needed.",
                delay: 0.1
              },
              {
                icon: MessageSquare,
                title: "Voice + Text Enabled",
                description: "Support both text chat and voice interactions for maximum accessibility.",
                delay: 0.2
              },
              {
                icon: Globe,
                title: "Plug and Play",
                description: "Single line of code integration. Add our widget to any website in seconds.",
                delay: 0.3
              }
            ].map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={feature.delay}
              />
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <CTASection
          title="Ready to get started?"
          description="Transform your website with an AI-powered assistant. Join thousands of websites already using Intelligentconvo."
          primaryAction={{
            label: "Get Started",
            href: "/auth/signup",
            icon: CheckCircle,
          }}
          secondaryText="Cancel anytime"
        />
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="glass-effect border-t border-white/10 mt-32"
      >
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Intelligentconvo</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Making websites more intelligent, one conversation at a time.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              &copy; 2025 Intelligentconvo. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
