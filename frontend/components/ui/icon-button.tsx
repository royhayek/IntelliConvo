import { LucideIcon } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: LucideIcon;
  label: string;
  showLabel?: boolean;
  tooltip?: string;
  iconClassName?: string;
}

export function IconButton({
  icon: Icon,
  label,
  showLabel = false,
  tooltip,
  iconClassName,
  className,
  size = "sm",
  ...props
}: IconButtonProps) {
  const button = (
    <Button
      size={size}
      className={cn("gap-2", !showLabel && "aspect-square", className)}
      aria-label={label}
      {...props}
    >
      <Icon className={cn("h-4 w-4", iconClassName)} />
      {showLabel && <span>{label}</span>}
    </Button>
  );

  if (tooltip && !showLabel) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
}
