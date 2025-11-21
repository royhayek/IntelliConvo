import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogVariant = "default" | "danger" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  icon?: ReactNode;
}

const variantConfig: Record<ConfirmDialogVariant, { className: string; iconColor: string }> = {
  default: {
    className: "bg-indigo-600 hover:bg-indigo-700",
    iconColor: "text-indigo-600",
  },
  danger: {
    className: "bg-red-600 hover:bg-red-700",
    iconColor: "text-red-600",
  },
  warning: {
    className: "bg-yellow-600 hover:bg-yellow-700",
    iconColor: "text-yellow-600",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-4">
            {icon || (variant !== "default" && (
              <div className={cn("h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0")}>
                <AlertTriangle className={cn("h-5 w-5", config.iconColor)} />
              </div>
            ))}
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={config.className}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
