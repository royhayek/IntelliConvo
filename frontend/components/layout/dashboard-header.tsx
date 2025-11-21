"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Settings,
  Home,
  Bell,
  Search,
  ArrowLeft,
  CreditCard,
  LogOut,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/ui/brand-logo";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { NavigationSettingsDrawer } from "@/components/layout/navigation-settings-drawer";
import { useAuthStore } from "@/lib/store";

interface DashboardHeaderProps {
  variant?: "dashboard" | "site";
  siteName?: string;
  showBackButton?: boolean;
  showNavigation?: boolean;
  showQuickActions?: boolean;
  showNavigationSettings?: boolean;
}

export function DashboardHeader({
  variant = "dashboard",
  siteName,
  showBackButton = false,
  showNavigation = true,
  showQuickActions = true,
  showNavigationSettings = false,
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
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-white/60 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-slate-700/40">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </motion.div>
                </Link>
                <div className="h-6 border-l border-gray-300/50 dark:border-gray-600/50"></div>
              </>
            )}

            {/* Brand Logo */}
            <BrandLogo size="md" showText={true} href="/dashboard" />
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation Pills (Dashboard only) */}
            {showNavigation && variant === "dashboard" && (
              <motion.nav
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden md:flex items-center space-x-1 bg-gray-100/80 dark:bg-slate-800/50 rounded-lg p-1"
              >
                <div className="flex items-center space-x-1 bg-white dark:bg-slate-700 rounded-md px-3 py-1.5 shadow-sm">
                  <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</span>
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
                  className="p-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all"
                  title="Search sites"
                >
                  <Search className="w-4 h-4" />
                </motion.button>
                <NotificationBadge count={3} position="top-right">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </motion.button>
                </NotificationBadge>
                <ThemeToggle />
              </motion.div>
            )}

            {/* Navigation Settings (Site view) */}
            {showNavigationSettings && variant === "site" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden sm:flex items-center space-x-2"
              >
                <NavigationSettingsDrawer variant="icon" />
                <ThemeToggle />
              </motion.div>
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-2 sm:px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{user?.fullName || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user?.fullName || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account/subscriptions" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Subscriptions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}