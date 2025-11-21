import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  loadingText?: string;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient";
  layout?: "horizontal" | "vertical";
  fullWidth?: boolean;
  className?: string;
}

export function ActionButtons({
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  loadingText,
  confirmDisabled = false,
  cancelDisabled = false,
  confirmVariant = "default",
  layout = "horizontal",
  fullWidth = true,
  className,
}: ActionButtonsProps) {
  return (
    <div
      className={cn(
        "flex gap-3",
        layout === "vertical" ? "flex-col" : "flex-row",
        layout === "horizontal" && "pt-4",
        className
      )}
    >
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={cancelDisabled || isLoading}
          className={cn(fullWidth && "flex-1")}
        >
          {cancelText}
        </Button>
      )}
      {onConfirm && (
        <Button
          type={onCancel ? "submit" : "button"}
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={confirmDisabled || isLoading}
          className={cn(
            fullWidth && "flex-1",
            confirmVariant === "default" && "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {loadingText || confirmText}
            </>
          ) : (
            confirmText
          )}
        </Button>
      )}
    </div>
  );
}
