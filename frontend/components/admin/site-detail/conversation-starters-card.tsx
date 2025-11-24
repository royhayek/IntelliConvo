"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConversationStarter {
  id: string;
  text: string;
  orderIndex: number;
}

interface ConversationStartersCardProps {
  starters: ConversationStarter[];
}

export function ConversationStartersCard({ starters }: ConversationStartersCardProps) {
  if (starters.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation Starters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {starters.map((starter) => (
            <li
              key={starter.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded"
            >
              <Badge variant="outline">{starter.orderIndex + 1}</Badge>
              <span>{starter.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
