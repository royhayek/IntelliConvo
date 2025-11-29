"use client";

import { motion } from "framer-motion";
import { useAuthRedirect } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Bot,
  Rocket,
  TrendingUp,
  Users,
  Brain,
  Shield,
  Clock,
  BarChart3,
  Star,
  Quote,
  Award,
  Target,
  Workflow,
} from "lucide-react";

const stats = [
  { value: "10,000+", label: "Active Users" },
  { value: "500K+", label: "Conversations" },
  { value: "99.9%", label: "Uptime" },
  { value: "<100ms", label: "Response Time" },
];

const features = [
  {
    icon: Brain,
    title: "Intelligent Learning",
    description: "Our AI automatically learns from your website content to provide accurate, contextual responses to your visitors.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-100ms response times ensure your visitors receive instant answers without any waiting.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Communicate with visitors in their preferred language with automatic translation support.",
  },
  {
    icon: MessageSquare,
    title: "Voice & Text",
    description: "Support both text and voice interactions for maximum accessibility and user convenience.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and security measures to protect your data and your customers.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Comprehensive insights into user behavior to help improve your customer experience.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect Your Website",
    description: "Simply enter your website URL and our AI begins learning from your content automatically.",
    icon: Globe,
  },
  {
    number: "02",
    title: "Customize Experience",
    description: "Fine-tune the AI's personality and responses to perfectly match your brand voice.",
    icon: Bot,
  },
  {
    number: "03",
    title: "Deploy Seamlessly",
    description: "Add a single line of code to your website and go live in minutes, not days.",
    icon: Rocket,
  },
];

const testimonials = [
  {
    quote: "IntelliConvo has completely transformed our customer support operations. We've seen an 80% reduction in response times and our customer satisfaction scores have never been higher.",
    author: "Sarah Johnson",
    role: "CEO, TechStart Inc",
    company: "TechStart",
  },
  {
    quote: "The voice interaction feature is remarkable. Our accessibility scores improved dramatically and our users consistently praise the natural conversation experience.",
    author: "Michael Chen",
    role: "Product Manager, WebFlow",
    company: "WebFlow",
  },
  {
    quote: "Setup was incredibly straightforward. The AI's accuracy is impressive and the analytics provide invaluable insights into our customer behavior and needs.",
    author: "Emily Rodriguez",
    role: "CTO, ShopNow",
    company: "ShopNow",
  },
];

export default function Home() {
  // Redirect authenticated users: admins to /admin, regular users to /dashboard
  const { isLoading } = useAuthRedirect();

  // Show loading state while auth is hydrating
  if (isLoading) {
    return <AuthLoading message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900 dark:text-white">
                IntelliConvo
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-slate-700 dark:text-slate-300">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 mb-8"
            >
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Trusted by over 10,000 businesses worldwide
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 leading-tight tracking-tight"
            >
              Transform Your Website
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                With Intelligent AI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto"
            >
              Deploy a powerful AI assistant that learns from your content and engages visitors
              through natural conversations. Elevate your customer experience today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-base h-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-slate-300 dark:border-slate-700 px-8 py-6 text-base h-auto">
                  Learn More
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400"
            >
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                Cancel anytime
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-32 py-16 border-y border-slate-200 dark:border-slate-800"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            id="features"
            className="mb-32"
          >
            <div className="max-w-3xl mx-auto text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50">
                  Features
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                  Everything You Need to Succeed
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Comprehensive features designed to enhance your website and delight your customers
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-8 h-full border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-6">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* How It Works Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <div className="max-w-3xl mx-auto text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-4 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900/50">
                  <Workflow className="h-3.5 w-3.5 mr-2" />
                  How It Works
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                  Get Started in Three Simple Steps
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  From setup to deployment in minutes, not hours
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="p-8 border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-5xl font-bold text-slate-100 dark:text-slate-900">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </Card>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-indigo-200 dark:border-indigo-900" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Testimonials Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <div className="max-w-3xl mx-auto text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50">
                  <Star className="h-3.5 w-3.5 mr-2" />
                  Testimonials
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                  Trusted by Leading Companies
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  See what our customers have to say about their experience
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-8 h-full border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                    <Quote className="h-8 w-8 text-indigo-200 dark:text-indigo-900 mb-6" />
                    <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                      {testimonial.quote}
                    </p>
                    <div className="flex items-center pt-6 border-t border-slate-200 dark:border-slate-800">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold mr-4">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {testimonial.author}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 border-0">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnpNNiAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnpNNiA2YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-10"></div>
              <div className="relative p-12 md:p-20 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Target className="h-12 w-12 text-white mx-auto mb-6" />
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Ready to Transform Your Website?
                  </h2>
                  <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                    Join thousands of businesses using IntelliConvo to provide exceptional customer experiences
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/auth/signup">
                      <Button size="lg" className="bg-white hover:bg-slate-50 text-indigo-600 px-8 py-6 text-base h-auto">
                        <Rocket className="mr-2 h-5 w-5" />
                        Start Your Free Trial
                      </Button>
                    </Link>
                    <div className="flex items-center space-x-2 text-indigo-100">
                      <CheckCircle className="h-5 w-5" />
                      <span>No credit card required</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                  IntelliConvo
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Making websites more intelligent, one conversation at a time.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                &copy; 2025 IntelliConvo. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </Link>
                <Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
