import type { DashboardStats, AttentionItem, QuickLink } from "@/lib/types/admin-dashboard";
import {
  Users,
  Globe,
  MessageSquare,
  CreditCard,
  DollarSign,
  Brain,
  FileText,
  Shield,
} from "lucide-react";

/**
 * Build attention items from dashboard stats
 */
export function buildAttentionItems(stats: DashboardStats): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (stats.embeddings.urlsWithoutEmbeddings > 0) {
    items.push({
      label: "URLs without embeddings",
      value: stats.embeddings.urlsWithoutEmbeddings,
      severity: "warning",
      link: "/admin/urls",
    });
  }

  if (stats.files.failedFiles > 0) {
    items.push({
      label: "Failed file uploads",
      value: stats.files.failedFiles,
      severity: "error",
      link: "/admin/files",
    });
  }

  if (stats.files.stuckFiles > 0) {
    items.push({
      label: "Stuck file processing",
      value: stats.files.stuckFiles,
      severity: "warning",
      link: "/admin/files",
    });
  }

  if (stats.sites.failedCrawlsLast24h > 0) {
    items.push({
      label: "Failed crawls (24h)",
      value: stats.sites.failedCrawlsLast24h,
      severity: "error",
      link: "/admin/sites",
    });
  }

  if (stats.subscriptions.expiringTrialsNext7Days > 0) {
    items.push({
      label: "Trials expiring (7 days)",
      value: stats.subscriptions.expiringTrialsNext7Days,
      severity: "info",
      link: "/admin/subscriptions",
    });
  }

  if (stats.security.expiredTokensNeedingCleanup > 100) {
    items.push({
      label: "Expired tokens to cleanup",
      value: stats.security.expiredTokensNeedingCleanup,
      severity: "warning",
      link: "/admin/sessions",
    });
  }

  return items;
}

/**
 * Build quick access links from dashboard stats
 */
export function buildQuickLinks(stats: DashboardStats): QuickLink[] {
  return [
    { label: "Users", href: "/admin/users", icon: Users, count: stats.users.total },
    { label: "Sites", href: "/admin/sites", icon: Globe, count: stats.sites.total },
    { label: "Conversations", href: "/admin/conversations", icon: MessageSquare, count: stats.conversations.total },
    { label: "Embeddings", href: "/admin/embeddings", icon: Brain, count: stats.embeddings.total },
    { label: "Files", href: "/admin/files", icon: FileText, count: stats.files.total },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, count: stats.subscriptions.total },
    { label: "Transactions", href: "/admin/billing/transactions", icon: DollarSign, count: stats.billing.totalTransactions },
    { label: "Sessions", href: "/admin/sessions", icon: Shield, count: stats.security.activeSessions },
  ];
}
