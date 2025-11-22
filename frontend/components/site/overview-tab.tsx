"use client";

import { Globe, FileText, MessageSquare, Code, Link as LinkIcon, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatPill } from "@/components/ui/stat-pill";
import { SectionHeader } from "@/components/ui/section-header";
import { OverviewCard } from "@/components/site/overview-card";
import { type SiteResponse } from "@/lib/api/generated/models";

interface OverviewTabProps {
  site: SiteResponse;
}

export function OverviewTab({ site }: OverviewTabProps) {
  const cards = [
    {
      title: "What Does Intelligentconvo Know?",
      description: "Manage the content from your website and supplement with additional knowledge.",
      links: [
        { label: "Sitemap & URLs", href: `/sites/${site.id}?tab=sitemap` },
        { label: "Knowledge & PDFs", href: `/sites/${site.id}?tab=knowledge` },
      ],
      icon: Globe,
    },
    {
      title: "How Does Intelligentconvo Represent You?",
      description: "Provide additional instructions and customize starter messages to match your needs.",
      links: [
        { label: "Site Info", href: `/sites/${site.id}?tab=preferences` },
        { label: "Conversation Starters", href: `/sites/${site.id}?tab=preferences` },
      ],
      icon: MessageSquare,
    },
    {
      title: "Who is Intelligentconvo Talking to?",
      description: "See conversations with visitors and review generated 'Highlights' of content.",
      links: [
        { label: "Conversations", href: `/sites/${site.id}?tab=conversations` },
      ],
      icon: MessageSquare,
    },
    {
      title: "How can I try Intelligentconvo for my site?",
      description: "You can test Intelligentconvo in the playground and when ready deploy with install code instructions.",
      links: [
        { label: "Install Code", href: `/sites/${site.id}?tab=widget` },
        { label: "Playground", href: `/sites/${site.id}?tab=playground` },
      ],
      icon: Code,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Site Overview"
        description="Quick access to key features and settings for your AI assistant."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <OverviewCard
            key={index}
            title={card.title}
            description={card.description}
            links={card.links}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Site Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Site Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatPill
              value={site._count?.siteUrls || 0}
              label="URLs Indexed"
              icon={LinkIcon}
              variant="blue"
            />
            <StatPill
              value={site._count?.conversations || 0}
              label="Conversations"
              icon={MessageSquare}
              variant="green"
            />
            <StatPill
              value={site._count?.knowledgeFiles || 0}
              label="Knowledge Files"
              icon={FileText}
              variant="purple"
            />
            <StatPill
              value={site.lastCrawledAt ? new Date(site.lastCrawledAt).toLocaleDateString() : 'Never'}
              label="Last Updated"
              icon={Clock}
              variant="indigo"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}