import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { ControllerRenderProps, FieldError } from "react-hook-form";

interface StarterFieldItemProps {
  index: number;
  field: ControllerRenderProps<any, any>;
  onRemove: () => void;
  error?: FieldError;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function StarterFieldItem({
  index,
  field,
  onRemove,
  error,
  placeholder = "How can I reset my password?",
  disabled = false,
  className,
}: StarterFieldItemProps) {
  return (
    <FormItem>
      <div className={cn("flex items-start gap-2", className)}>
        <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          {index + 1}.
        </div>
        <div className="flex-1">
          <FormControl>
            <Input
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </div>
        <IconButton
          icon={X}
          label={`Remove starter ${index + 1}`}
          tooltip={`Remove starter ${index + 1}`}
          onClick={onRemove}
          disabled={disabled}
          variant="ghost"
          size="sm"
          className="flex-shrink-0 text-red-600 hover:text-red-800 dark:hover:bg-red-900/30"
        />
      </div>
    </FormItem>
  );
}
