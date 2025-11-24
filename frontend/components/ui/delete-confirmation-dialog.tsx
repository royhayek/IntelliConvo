import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemDetails?: string;
  warningMessage?: string;
  isDeleting?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Deletion",
  description = "Are you sure you want to permanently delete this item? This action cannot be undone.",
  itemName,
  itemDetails,
  warningMessage,
  isDeleting = false,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
}: DeleteConfirmationDialogProps) {
  const titleColor = variant === "danger" ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400";
  const buttonClass = variant === "danger"
    ? "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
    : "bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-700 dark:hover:bg-orange-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-5 w-5 ${titleColor}`} />
            <DialogTitle className={titleColor}>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 min-w-0 overflow-hidden">
          {(itemName || itemDetails) && (
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 min-w-0 overflow-hidden">
              {itemName && (
                <p className="text-sm font-medium text-gray-900 dark:text-white min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {itemName}
                </p>
              )}
              {itemDetails && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {itemDetails}
                </p>
              )}
            </div>
          )}

          {warningMessage && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-lg p-3">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                {warningMessage}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row space-x-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 sm:flex-none ${buttonClass}`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
