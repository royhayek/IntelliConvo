import { cn } from "@/lib/utils";

interface TopSiteItemProps {
  rank: number;
  siteName?: string | null;
  conversationCount?: number;
  messageCount?: number;
  className?: string;
}

export function TopSiteItem({
  rank,
  siteName,
  conversationCount = 0,
  messageCount = 0,
  className,
}: TopSiteItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg",
        className
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
            #{rank}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {siteName || "Unknown Site"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {conversationCount} {conversationCount === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
        </p>
      </div>
    </div>
  );
}
