"use client";

import Link from "next/link";
import { ArrowRight, Globe, FileText, MessageSquare, Code } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type GetApiSitesSiteId200 } from "@/lib/api/generated/models";

interface OverviewTabProps {
  site: GetApiSitesSiteId200;
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
      icon: <Globe className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "How Does Intelligentconvo Represent You?",
      description: "Provide additional instructions and customize starter messages to match your needs.",
      links: [
        { label: "Site Info", href: `/sites/${site.id}?tab=preferences` },
        { label: "Conversation Starters", href: `/sites/${site.id}?tab=preferences` },
      ],
      icon: <MessageSquare className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "Who is Intelligentconvo Talking to?",
      description: "See conversations with visitors and review generated 'Highlights' of content.",
      links: [
        { label: "Conversations", href: `/sites/${site.id}?tab=conversations` },
      ],
      icon: <MessageSquare className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "How can I try Intelligentconvo for my site?",
      description: "You can test Intelligentconvo in the playground and when ready deploy with install code instructions.",
      links: [
        { label: "Install Code", href: `/sites/${site.id}?tab=widget` },
        { label: "Playground", href: `/sites/${site.id}?tab=playground` },
      ],
      icon: <Code className="h-6 w-6 text-indigo-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Site Overview</h2>
        <p className="text-gray-600">
          Quick access to key features and settings for your AI assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {card.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {card.links.map((link, linkIndex) => (
                  <Link
                    key={linkIndex}
                    href={link.href}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                      {link.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Site Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Site Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{site._count?.urls || 0}</div>
              <div className="text-sm text-gray-600">URLs Indexed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{site._count?.conversations || 0}</div>
              <div className="text-sm text-gray-600">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{site._count?.knowledgeFiles || 0}</div>
              <div className="text-sm text-gray-600">Knowledge Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {site.lastCrawledAt ? new Date(site.lastCrawledAt).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}