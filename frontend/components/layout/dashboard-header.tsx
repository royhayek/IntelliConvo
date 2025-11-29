"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  ArrowLeft,
  LogOut,
  Shield,
  CreditCard,
  Crown,
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
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NavigationSettingsDrawer } from "@/components/layout/navigation-settings-drawer";
import { useAuthStore } from "@/lib/store";
import { useLogout } from "@/lib/hooks/useAuth";

interface DashboardHeaderProps {
  variant?: "dashboard" | "site";
  siteName?: string;
  siteId?: string;
  showBackButton?: boolean;
  backHref?: string;
  showNavigation?: boolean;
  showQuickActions?: boolean;
  showNavigationSettings?: boolean;
}

export function DashboardHeader({
  variant = "dashboard",
  siteName,
  siteId,
  showBackButton = false,
  backHref = "/dashboard",
  showNavigation = true,
  showQuickActions = true,
  showNavigationSettings = false,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const handleLogout = useLogout();

  // Build the returnTo parameter for account settings navigation
  const accountSettingsHref = `/account/settings${pathname !== "/dashboard" ? `?returnTo=${encodeURIComponent(pathname)}` : ""}`;

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
            {/* Back Button */}
            {showBackButton && (
              <>
                <Link href={backHref}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900 hover:bg-white/60 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-slate-700/40"
                    >
                      <ArrowLeft className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Back to Dashboard</span>
                    </Button>
                  </motion.div>
                </Link>
                <div className="h-6 border-l border-gray-300/50 dark:border-gray-600/50"></div>
              </>
            )}

            {/* Brand Logo */}
            <BrandLogo size="xs" showText={true} href="/dashboard" />
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">          
            {/* Quick Actions (Dashboard only) */}
            {showQuickActions && variant === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden sm:flex items-center space-x-2"
              >
                <NotificationBell />
                <ThemeToggle />
              </motion.div>
            )}

            {/* Site view actions */}
            {showNavigationSettings && variant === "site" && (
              <>
                {/* Mobile/Tablet - Show only notifications and theme toggle */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex lg:hidden items-center space-x-2"
                >
                  <NotificationBell />
                  <ThemeToggle />
                </motion.div>

                {/* Desktop - Show all including navigation settings */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="hidden lg:flex items-center space-x-2"
                >
                  <NotificationBell />
                  <NavigationSettingsDrawer variant="icon" />
                  <ThemeToggle />
                </motion.div>
              </>
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-2 sm:px-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                      {user?.fullName
                        ? user.fullName.charAt(0).toUpperCase()
                        : user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">
                    {user?.fullName || user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                        {user?.fullName
                          ? user.fullName.charAt(0).toUpperCase()
                          : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.fullName || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href={accountSettingsHref} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                {variant === "site" && siteId && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/account/subscriptions?siteId=${siteId}`}
                        className="cursor-pointer"
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/account/billing?siteId=${siteId}`}
                        className="cursor-pointer"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Billing History
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400"
                >
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
