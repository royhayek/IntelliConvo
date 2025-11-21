import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopyButton?: boolean;
  showLanguageLabel?: boolean;
  title?: string;
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "text",
  showCopyButton = true,
  showLanguageLabel = false,
  title,
  maxHeight,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Header */}
      {(title || showLanguageLabel || showCopyButton) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {title && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {title}
              </span>
            )}
            {showLanguageLabel && language && (
              <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {language.toUpperCase()}
              </span>
            )}
          </div>
          {showCopyButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Code Block */}
      <pre
        className={cn(
          "bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono border border-gray-700 dark:border-gray-800",
          maxHeight && `max-h-[${maxHeight}] overflow-y-auto`
        )}
      >
        <code className="text-gray-100">{code}</code>
      </pre>
    </div>
  );
}
