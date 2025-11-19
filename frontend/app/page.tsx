"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Globe,
  ArrowRight,
  Star,
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
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Intelligentconvo
              </span>
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="hover:bg-white/60">
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
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full px-6 py-2 text-sm font-medium text-indigo-700 border border-indigo-200"
          >
            <Star className="h-4 w-4" />
            <span>Trusted by 1000+ websites</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight"
          >
            Meet{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Intelligentconvo
            </span>
            <br />
            <span className="text-5xl md:text-6xl text-gray-600">
              the AI that will get you{" "}
              <motion.span
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-indigo-600 inline-block"
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
            className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Automatically crawl your website, create a knowledge base, and provide visitors
            with AI-powered assistance through both{" "}
            <span className="font-semibold text-gray-800">text chat</span> and{" "}
            <span className="font-semibold text-gray-800">voice interactions</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Link href="/auth/signup">
              <Button variant="gradient" size="lg" className="px-10 py-4 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-10 py-4 text-lg hover:bg-white/80">
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Key Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <div className="glass-effect p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 border border-white/20 backdrop-blur-sm">
                    <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <motion.div
            whileHover={{ scale: 1.02, rotateX: 2 }}
            className="relative overflow-hidden gradient-brand rounded-3xl p-16 text-white shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                Ready to get started?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl mb-10 opacity-90 max-w-2xl mx-auto"
              >
                Try Intelligentconvo free for 14 days. No credit card required.
                Join thousands of websites already using our AI assistant.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
              >
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="px-10 py-4 text-lg hover:scale-105 transition-transform">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Start Free Trial
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 text-white/80">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">14-day free trial</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>
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
              <span className="text-lg font-bold text-gray-700">Intelligentconvo</span>
            </div>
            <p className="text-gray-600 mb-4">
              Making websites more intelligent, one conversation at a time.
            </p>
            <p className="text-gray-500 text-sm">
              &copy; 2025 Intelligentconvo. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
