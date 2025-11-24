"use client";

import { MessageSquare, Clock, Coins, DollarSign } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatCents } from "@/lib/utils";

interface ConversationStats {
  total: number;
  activeLast24h: number;
  totalMessages: number;
  messagesLast24h: number;
  avgMessagesPerConversation: number;
  totalTokensUsed: number;
  estimatedCostCents: number;
}

interface ConversationsStatsGridProps {
  stats: ConversationStats;
}

export function ConversationsStatsGrid({ stats }: ConversationsStatsGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Conversations"
          value={stats.total.toLocaleString()}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          label="Active (24h)"
          value={stats.activeLast24h}
          icon={Clock}
          color="green"
        />
        <StatCard
          label="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          label="Tokens Used"
          value={stats.totalTokensUsed.toLocaleString()}
          icon={Coins}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Messages (24h)"
          value={stats.messagesLast24h}
          icon={Clock}
          color="green"
        />
        <StatCard
          label="Avg Messages/Conversation"
          value={stats.avgMessagesPerConversation.toFixed(1)}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          label="Estimated Cost"
          value={formatCents(stats.estimatedCostCents)}
          icon={DollarSign}
          color="orange"
        />
      </div>
    </>
  );
}
