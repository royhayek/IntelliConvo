"use client";

import { User, Mail, Shield, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimeAgo } from "@/components/ui/time-ago";
import { getAuthProviderBadgeConfig, getUserRoleBadgeConfig } from "@/lib/utils/badge-helpers";

interface UserInfoCardProps {
  user: {
    fullName: string | null;
    email: string;
    authProvider: string;
    isAdmin: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  const authConfig = getAuthProviderBadgeConfig(user.authProvider);
  const roleConfig = getUserRoleBadgeConfig(user.isAdmin);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-lg font-medium">{user.fullName || "—"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Mail className="h-4 w-4" /> Email
            </label>
            <p className="mt-1 text-lg">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Auth Provider</label>
            <p className="mt-1">
              <Badge variant={authConfig.variant} className={authConfig.className}>
                {authConfig.label || user.authProvider}
              </Badge>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Shield className="h-4 w-4" /> Role
            </label>
            <p className="mt-1">
              <Badge variant={roleConfig.variant} className={roleConfig.className}>
                {roleConfig.label}
              </Badge>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Created
            </label>
            <p className="mt-1">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Clock className="h-4 w-4" /> Last Login
            </label>
            <p className="mt-1">
              {user.lastLoginAt ? (
                <TimeAgo date={user.lastLoginAt} />
              ) : (
                <span className="text-gray-400">Never</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
