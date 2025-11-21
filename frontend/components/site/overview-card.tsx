import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OverviewCardLink {
  label: string;
  href: string;
}

interface OverviewCardProps {
  title: string;
  description: string;
  links: OverviewCardLink[];
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function OverviewCard({
  title,
  description,
  links,
  icon: Icon,
  iconColor = "text-indigo-600",
  className,
}: OverviewCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start space-x-4">
          <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-2">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {link.label}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
