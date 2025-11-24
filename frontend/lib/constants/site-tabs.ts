import {
  Settings,
  Globe,
  FileText,
  MessageSquare,
  Sliders,
  Code,
  Play,
  Shield,
  LucideIcon,
} from "lucide-react";

export interface SiteTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SITE_TABS: SiteTab[] = [
  { id: "overview", label: "Overview", icon: Settings },
  { id: "sitemap", label: "Sitemap & URLs", icon: Globe },
  { id: "knowledge", label: "PDFs & Knowledge", icon: FileText },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "preferences", label: "Site Preferences", icon: Sliders },
  { id: "hosts", label: "Access & Security", icon: Shield },
  { id: "widget", label: "Widget & Button", icon: Code },
  { id: "playground", label: "Playground", icon: Play },
];
