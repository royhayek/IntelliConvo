"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BackLinkConfig } from "@/lib/utils/navigation";

interface AccountPageHeaderProps {
  backLink: BackLinkConfig;
  userEmail?: string;
}

export function AccountPageHeader({ backLink, userEmail }: AccountPageHeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href={backLink.href}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLink.text}
              </Button>
            </Link>
            <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Intelligentconvo
              </span>
            </div>
          </div>

          {userEmail && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {userEmail}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
