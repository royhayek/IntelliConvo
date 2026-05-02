"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "en", label: "English",  flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

interface LanguageToggleProps {
  className?: string;
  buttonStyle?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
}

export function LanguageToggle({ className, buttonStyle, hoverStyle }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const currentLang: LangCode = i18n.language?.startsWith("fr") ? "fr" : "en";

  const select = (code: LangCode) => {
    i18n.changeLanguage(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("intelliconvo_lang", code);
    }
  };

  const defaultClass =
    "p-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all flex items-center justify-center";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Select language"
          className={className ?? defaultClass}
          style={buttonStyle}
          onMouseEnter={(e) => {
            if (hoverStyle) Object.assign((e.currentTarget as HTMLElement).style, hoverStyle);
          }}
          onMouseLeave={(e) => {
            if (hoverStyle && buttonStyle) Object.assign((e.currentTarget as HTMLElement).style, buttonStyle);
          }}
        >
          <Globe className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[150px]">
        {LANGUAGES.map(({ code, label, flag }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => select(code)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <span className="text-base leading-none">{flag}</span>
            <span className="text-sm">{label}</span>
            {currentLang === code && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
