import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InfoItem {
  label: string;
  value: string | number;
}

interface AssistantInfoCardProps {
  siteName: string;
  urlsCount: number;
  knowledgeFilesCount: number;
  lastUpdated: Date | string | null;
  title?: string;
  additionalInfo?: InfoItem[];
  className?: string;
}

export function AssistantInfoCard({
  siteName,
  urlsCount,
  knowledgeFilesCount,
  lastUpdated,
  title = "Assistant Info",
  additionalInfo = [],
  className,
}: AssistantInfoCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  const infoItems: InfoItem[] = [
    { label: "Site", value: siteName },
    { label: "URLs Trained", value: urlsCount },
    { label: "Knowledge Files", value: knowledgeFilesCount },
    { label: "Last Updated", value: formatDate(lastUpdated) },
    ...additionalInfo,
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {infoItems.map((item, index) => (
          <div key={index}>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {item.label}:
            </span>
            <p className="text-sm text-gray-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
