"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  Settings,
  Home,
  Bell,
  Search,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";

interface DashboardHeaderProps {
  variant?: "dashboard" | "site";
  siteName?: string;
  showBackButton?: boolean;
  showNavigation?: boolean;
  showQuickActions?: boolean;
}

export function DashboardHeader({
  variant = "dashboard",
  siteName,
  showBackButton = false,
  showNavigation = true,
  showQuickActions = true,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        // Don't wait for logout API call
        // await authApi.logout(refreshToken);
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      logout();
      router.push("/");
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect border-b border-white/10 shadow-soft sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand & Navigation */}
          <div className="flex items-center space-x-4">
            {/* Back Button (Site Dashboard) */}
            {showBackButton && (
              <>
                <Link href="/dashboard">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-white/60">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </motion.div>
                </Link>
                <div className="h-6 border-l border-gray-300/50"></div>
              </>
            )}

            {/* Brand Logo */}
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:block">
                  Intelligentconvo
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation Pills (Dashboard only) */}
            {showNavigation && variant === "dashboard" && (
              <motion.nav
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden md:flex items-center space-x-1 bg-gray-100/80 rounded-lg p-1"
              >
                <div className="flex items-center space-x-1 bg-white rounded-md px-3 py-1.5 shadow-sm">
                  <Home className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Dashboard</span>
                </div>
              </motion.nav>
            )}

            {/* Quick Actions (Dashboard only) */}
            {showQuickActions && variant === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden sm:flex items-center space-x-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 transition-all"
                  title="Search sites"
                >
                  <Search className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 transition-all relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                </motion.button>
              </motion.div>
            )}

            {/* Profile Dropdown */}
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-lg hover:bg-white/60 transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user?.fullName || user?.email}</span>
                <motion.div
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>

              {/* Enhanced Dropdown */}
              <div className="absolute right-0 pt-2 z-[9999] invisible group-hover:visible">
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="w-56 bg-white rounded-xl shadow-lg border border-gray-200/50 py-2 mt-1 backdrop-blur-sm"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link href="/account/subscriptions" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                      <div className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Subscriptions
                    </Link>
                    <Link href="/account/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                      <Settings className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" />
                      Account Settings
                    </Link>
                    <Link href="/account/billing" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                      <div className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      Billing History
                    </Link>
                  </div>

                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                  >
                    <div className="w-4 h-4 mr-3 text-red-400 group-hover:text-red-600">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    Sign Out
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}