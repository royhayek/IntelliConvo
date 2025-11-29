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
  { id: "website-content", label: "Website Content", icon: Globe },
  { id: "uploaded-documents", label: "Uploaded Documents", icon: FileText },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "site-settings", label: "Site Settings", icon: Sliders },
  { id: "allowed-domains", label: "Allowed Domains", icon: Shield },
  { id: "widget-customization", label: "Widget Customization", icon: Code },
  { id: "test-chatbot", label: "Test Chatbot", icon: Play },
];
