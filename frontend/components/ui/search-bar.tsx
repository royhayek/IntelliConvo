import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showClearButton?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  showClearButton = true,
  className,
}: SearchBarProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {showClearButton && value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </Button>
      )}
    </div>
  );
}
