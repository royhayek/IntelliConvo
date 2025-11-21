import { Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MessageRole = "user" | "assistant" | "system";

interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  timestamp?: Date | string;
  isLoading?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  isLoading = false,
  showAvatar = true,
  showTimestamp = true,
  className,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  // Format timestamp
  const formattedTime = timestamp
    ? typeof timestamp === "string"
      ? new Date(timestamp).toLocaleTimeString()
      : timestamp.toLocaleTimeString()
    : "";

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "flex items-start space-x-2 max-w-[80%]",
          isUser && "flex-row-reverse space-x-reverse"
        )}
      >
        {/* Avatar */}
        {showAvatar && !isSystem && (
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
              isUser
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
            )}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            isUser
              ? "bg-indigo-600 text-white"
              : isSystem
              ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800"
              : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white"
          )}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
              {showTimestamp && timestamp && (
                <p
                  className={cn(
                    "text-xs mt-1",
                    isUser
                      ? "text-indigo-200"
                      : isSystem
                      ? "text-yellow-700 dark:text-yellow-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {formattedTime}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading message component for convenience
export function MessageBubbleLoading() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-2 max-w-[80%]">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4" />
        </div>
        <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
