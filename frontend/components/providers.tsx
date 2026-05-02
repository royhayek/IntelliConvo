"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/config";

function I18nBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("intelliconvo_lang");
    if (saved && (saved === "en" || saved === "fr")) {
      i18n.changeLanguage(saved);
    } else {
      const browser = navigator.language?.startsWith("fr") ? "fr" : "en";
      i18n.changeLanguage(browser);
    }
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 401) return false;
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nBootstrap>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </QueryClientProvider>
      </I18nBootstrap>
    </I18nextProvider>
  );
}