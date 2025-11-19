import { useState, useCallback } from "react";

interface Toast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = useCallback(({ title, description, variant }: Toast) => {
    // Simple alert-based toast for now
    // You can replace this with a proper toast library like react-hot-toast or sonner
    if (variant === "destructive") {
      console.error(`${title}: ${description || ""}`);
      alert(`Error: ${title}\n${description || ""}`);
    } else {
      console.log(`${title}: ${description || ""}`);
      // For success messages, we could use a notification or just log
      // Using alert for visibility during development
      alert(`${title}\n${description || ""}`);
    }
  }, []);

  return { toast };
}
