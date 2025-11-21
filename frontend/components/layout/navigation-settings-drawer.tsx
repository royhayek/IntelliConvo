"use client";

import { motion } from "framer-motion";
import { Settings, LayoutGrid, AlignLeft, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface NavigationSettingsDrawerProps {
  variant?: "icon" | "button";
  className?: string;
}

export function NavigationSettingsDrawer({
  variant = "icon",
  className,
}: NavigationSettingsDrawerProps) {
  const { navigationLayout, setNavigationLayout } = useUIStore();

  const layoutOptions = [
    {
      id: "vertical" as const,
      label: "Vertical Sidebar",
      description: "Navigation menu on the left side",
      icon: AlignLeft,
    },
    {
      id: "horizontal" as const,
      label: "Horizontal Tabs",
      description: "Navigation tabs at the top",
      icon: LayoutGrid,
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {variant === "icon" ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all",
              className
            )}
            title="Navigation settings"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        ) : (
          <Button variant="ghost" size="sm" className={className}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Navigation Settings
          </SheetTitle>
          <SheetDescription>
            Customize how you navigate through your site dashboard
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Layout Preference
            </h3>
            <div className="space-y-3">
              {layoutOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = navigationLayout === option.id;

                return (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNavigationLayout(option.id)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      isSelected
                        ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-600"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 mt-0.5 h-10 w-10 rounded-lg flex items-center justify-center",
                        isSelected
                          ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={cn(
                            "text-sm font-semibold",
                            isSelected
                              ? "text-indigo-900 dark:text-indigo-300"
                              : "text-gray-900 dark:text-white"
                          )}
                        >
                          {option.label}
                        </h4>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isSelected
                            ? "text-indigo-700 dark:text-indigo-400"
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {option.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 text-xs text-blue-900 dark:text-blue-300">
                <p className="font-medium mb-1">Your preference is saved</p>
                <p className="text-blue-700 dark:text-blue-400">
                  The layout you choose will be remembered across all your sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
