import { Button } from "@/components/ui/button";
import { TimeAgo } from "@/components/ui/time-ago";
import { cn } from "@/lib/utils";

interface ConversationListItemProps {
  conversationId: string;
  userIdentifier?: string | null;
  messageCount?: number | null;
  startedAt?: string | Date | null;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
}

export function ConversationListItem({
  conversationId,
  userIdentifier,
  messageCount,
  startedAt,
  isSelected = false,
  onClick,
  className,
}: ConversationListItemProps) {
  const initials = (userIdentifier || "A").charAt(0).toUpperCase();
  const displayName = userIdentifier || "Anonymous";

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full justify-start text-left p-3 h-auto font-normal",
        isSelected
          ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200"
          : "hover:bg-gray-50 dark:hover:bg-slate-700 border border-transparent",
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {messageCount ?? 0} messages
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          {startedAt ? (
            <TimeAgo date={startedAt} className="text-xs" />
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">N/A</p>
          )}
        </div>
      </div>
    </Button>
  );
}
