import { Globe, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

interface HostStatus {
  icon: React.ReactNode;
  text: string;
  className: string;
}

interface HostListItemProps {
  hostname: string;
  isActive: boolean;
  addedAt?: string | Date | null;
  onToggleActive: () => void;
  onDelete: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  className?: string;
}

export function HostListItem({
  hostname,
  isActive,
  addedAt,
  onToggleActive,
  onDelete,
  isUpdating = false,
  isDeleting = false,
  className,
}: HostListItemProps) {
  const getHostStatus = (): HostStatus => {
    if (!isActive) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
        text: "Disabled",
        className: "text-gray-500"
      };
    }

    return {
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      text: "Enabled",
      className: "text-green-600"
    };
  };

  const status = getHostStatus();

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">{hostname}</h4>
          <div className="flex items-center space-x-2 text-sm">
            {status.icon}
            <span className={status.className}>{status.text}</span>
          </div>
          {addedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Added: {new Date(addedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleActive}
          disabled={isUpdating || isDeleting}
          className={cn(
            isActive
              ? "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              : "border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
          )}
        >
          {isUpdating ? "..." : isActive ? "Disable" : "Enable"}
        </Button>
        <IconButton
          icon={Trash2}
          label={`Delete ${hostname}`}
          tooltip={`Delete ${hostname}`}
          onClick={onDelete}
          disabled={isUpdating || isDeleting}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
        />
      </div>
    </div>
  );
}
