"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpecialInstructionsCardProps {
  instructions: string | null;
}

export function SpecialInstructionsCard({ instructions }: SpecialInstructionsCardProps) {
  if (!instructions) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Special Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {instructions}
        </p>
      </CardContent>
    </Card>
  );
}
