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
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuthStore } from "@/lib/store";
import { useLogout } from "@/lib/hooks/useAuth";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  // Build the returnTo parameter for account settings navigation
  const accountSettingsHref = `/account/settings${pathname !== "/dashboard" ? `?returnTo=${encodeURIComponent(pathname)}` : ""}`;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect shadow-soft sticky top-0 z-40"
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
                      className="text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-gray-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-900/20"
                    >
                      <ArrowLeft className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t("header.backToDashboard")}</span>
                    </Button>
                  </motion.div>
                </Link>
                <div className="h-6 border-l border-cyan-200/50 dark:border-cyan-800/30"></div>
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
                <LanguageToggle />
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
                  <LanguageToggle />
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
                  <LanguageToggle />
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
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-sm">
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
                      <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-sm">
                        {user?.fullName
                          ? user.fullName.charAt(0).toUpperCase()
                          : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.fullName || t("header.user")}
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
                        {t("header.adminPortal")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href={accountSettingsHref} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("header.accountSettings")}
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
                        {t("header.subscription")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/account/billing?siteId=${siteId}`}
                        className="cursor-pointer"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t("header.billingHistory")}
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
                  {t("header.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
