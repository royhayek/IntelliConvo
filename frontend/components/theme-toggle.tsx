"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useThemeStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (!mounted) {
      return <Sun className="w-4 h-4" />;
    }

    if (theme === "dark") {
      return <Moon className="w-4 h-4" />;
    } else if (theme === "system") {
      return (
        <div className="relative w-4 h-4">
          <Sun className="w-4 h-4 absolute top-0 left-0 opacity-50" />
          <Moon className="w-2 h-2 absolute bottom-0 right-0" />
        </div>
      );
    }
    return <Sun className="w-4 h-4" />;
  };

  const getTitle = () => {
    if (theme === "dark") return "Dark mode (click for system)";
    if (theme === "system") return "System theme (click for light)";
    return "Light mode (click for dark)";
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all"
      title={getTitle()}
    >
      {getIcon()}
    </motion.button>
  );
}
