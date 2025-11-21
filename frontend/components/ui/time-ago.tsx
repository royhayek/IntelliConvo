"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimeAgoProps {
  date: string | Date;
  updateInterval?: number;
  showTooltip?: boolean;
  className?: string;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 120) return "1 minute ago";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return "1 hour ago";
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "1 day ago";
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 1209600) return "1 week ago";
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 5184000) return "1 month ago";
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  if (seconds < 63072000) return "1 year ago";
  return `${Math.floor(seconds / 31536000)} years ago`;
}

export function TimeAgo({
  date,
  updateInterval = 60000, // Update every minute by default
  showTooltip = true,
  className,
}: TimeAgoProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const [timeAgo, setTimeAgo] = useState(getTimeAgo(dateObj));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(dateObj));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [dateObj, updateInterval]);

  const formattedDate = dateObj.toLocaleString();

  return (
    <time
      dateTime={dateObj.toISOString()}
      title={showTooltip ? formattedDate : undefined}
      className={cn("text-gray-600 dark:text-gray-400", className)}
    >
      {timeAgo}
    </time>
  );
}
