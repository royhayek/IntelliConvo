"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  text: string;
  successMessage?: string;
  errorMessage?: string;
  showLabel?: boolean;
  resetDelay?: number;
}

export function CopyButton({
  text,
  successMessage = "Copied!",
  errorMessage = "Failed to copy",
  showLabel = false,
  resetDelay = 2000,
  className,
  size = "sm",
  variant = "outline",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(false);
      setTimeout(() => setCopied(false), resetDelay);
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), resetDelay);
    }
  };

  const tooltipContent = error ? errorMessage : copied ? successMessage : "Copy to clipboard";
  const Icon = copied ? Check : Copy;
  const iconColor = copied ? "text-green-600" : error ? "text-red-600" : "";

  const button = (
    <Button
      size={size}
      variant={variant}
      onClick={handleCopy}
      className={cn("gap-2", !showLabel && "aspect-square", className)}
      aria-label="Copy to clipboard"
      {...props}
    >
      <Icon className={cn("h-4 w-4", iconColor)} />
      {showLabel && <span>{copied ? successMessage : "Copy"}</span>}
    </Button>
  );

  return <Tooltip content={tooltipContent}>{button}</Tooltip>;
}
