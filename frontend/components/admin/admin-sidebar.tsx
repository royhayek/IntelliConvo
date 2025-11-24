"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Globe,
  Link2,
  Brain,
  FileText,
  MessageSquare,
  MessagesSquare,
  Mail,
  CreditCard,
  Receipt,
  FileCheck,
  AlertOctagon,
  Palette,
  Shield,
  Settings,
  X,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Users", href: "/admin/users", icon: Users },
      { title: "Sites", href: "/admin/sites", icon: Globe },
      { title: "URLs", href: "/admin/urls", icon: Link2 },
    ],
  },
  {
    title: "Technical Operations",
    items: [
      { title: "Embeddings", href: "/admin/embeddings", icon: Brain },
      { title: "Knowledge Files", href: "/admin/files", icon: FileText },
    ],
  },
  {
    title: "Communication",
    items: [
      { title: "Conversations", href: "/admin/conversations", icon: MessageSquare },
      { title: "Messages", href: "/admin/messages", icon: MessagesSquare },
      { title: "Emails", href: "/admin/emails", icon: Mail },
    ],
  },
  {
    title: "Billing",
    items: [
      { title: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
      { title: "Transactions", href: "/admin/billing/transactions", icon: Receipt },
      { title: "Disputes", href: "/admin/billing/disputes", icon: AlertOctagon },
      { title: "Billing Info", href: "/admin/billing/info", icon: FileCheck },
    ],
  },
  {
    title: "Support & Security",
    items: [
      { title: "Widgets", href: "/admin/widgets", icon: Palette },
      { title: "Sessions", href: "/admin/sessions", icon: Shield },
      { title: "Audit Logs", href: "/admin/audit", icon: ClipboardList },
      { title: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when clicking a link
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 h-full overflow-y-auto transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">Admin Portal</span>
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-6">
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            active
                              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <Icon className={cn(
                            "h-4 w-4",
                            active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
                          )} />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
