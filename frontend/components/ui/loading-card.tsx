import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export function LoadingCard({
  message = "Loading...",
  className,
}: LoadingCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <span className="text-gray-600 dark:text-gray-400">{message}</span>
        </div>
      </CardContent>
    </Card>
  );
}
