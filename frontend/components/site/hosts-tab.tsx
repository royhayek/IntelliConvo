"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Globe, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoAlert } from "@/components/ui/info-alert";
import { SectionHeader } from "@/components/ui/section-header";
import { HostListItem } from "@/components/site/host-list-item";
import { toast } from "sonner";
import {
  useGetApiV1SitesSiteIdHosts,
  usePostApiV1SitesSiteIdHosts,
  usePatchApiV1SitesSiteIdHostsHostId,
  useDeleteApiV1SitesSiteIdHostsHostId,
  getGetApiV1SitesSiteIdHostsQueryKey,
} from "@/lib/api/generated/queries/sites/sites";
import {
  type SiteResponse,
} from "@/lib/api/generated/models";

interface HostsTabProps {
  site: SiteResponse;
}

export function HostsTab({ site }: HostsTabProps) {
  const queryClient = useQueryClient();
  const [newHost, setNewHost] = useState("");

  const { data: hostsData, isLoading } = useGetApiV1SitesSiteIdHosts(site.id);
  const hosts = hostsData?.hosts || [];

  const addHostMutation = usePostApiV1SitesSiteIdHosts({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host added successfully!");
        setNewHost("");
      },
    },
  });

  const updateHostMutation = usePatchApiV1SitesSiteIdHostsHostId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host updated successfully!");
      },
    },
  });

  const deleteHostMutation = useDeleteApiV1SitesSiteIdHostsHostId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host deleted successfully!");
      },
    },
  });

  const handleAddHost = () => {
    if (!newHost.trim()) {
      toast.error("Please enter a hostname");
      return;
    }

    // Basic hostname validation
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(newHost.trim())) {
      toast.error("Please enter a valid hostname (e.g., example.com or subdomain.example.com)");
      return;
    }

    addHostMutation.mutate({ siteId: site.id, data: { hostName: newHost.trim() } });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Access & Security"
        description="Manage which domains and hostnames can access your chat widget"
      />

      {/* Security Info */}
      <InfoAlert
        variant="info"
        icon={Shield}
        title="Security Note"
        message="Only domains listed below can embed and use your chat widget. This prevents unauthorized usage and protects your API quota."
      />

      {/* Add New Host */}
      <Card>
        <CardHeader>
          <CardTitle>Add Allowed Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Enter domain (e.g., example.com, blog.example.com)"
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddHost()}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                You can add specific subdomains (subdomain.example.com) or root domains (example.com)
              </p>
            </div>
            <Button
              onClick={handleAddHost}
              disabled={addHostMutation.isPending || !newHost.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {addHostMutation.isPending ? "Adding..." : "Add Domain"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Hosts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Allowed Domains</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading domains...</span>
            </div>
          ) : hosts.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No domains configured</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add your first domain to enable widget access. Without any domains, your widget won't be accessible.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hosts.map((host) => (
                <HostListItem
                  key={host.id}
                  hostname={host.hostName || ""}
                  isActive={host.isEnabled || false}
                  addedAt={host.createdAt}
                  onToggleActive={() => updateHostMutation.mutate({
                    siteId: site.id,
                    hostId: host.id,
                    data: { isEnabled: !host.isEnabled }
                  })}
                  onDelete={() => deleteHostMutation.mutate({ siteId: site.id, hostId: host.id })}
                  isUpdating={updateHostMutation.isPending}
                  isDeleting={deleteHostMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {hosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Access Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{hosts.length}</p>
                <p className="text-sm text-blue-600">Total Domains</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {hosts.filter(h => h.isEnabled).length}
                </p>
                <p className="text-sm text-green-600">Enabled Domains</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Configuration Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">How to configure domains:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <strong>Root domain:</strong> example.com (allows widget on main site)</li>
              <li>• <strong>Subdomain:</strong> blog.example.com (allows widget on specific subdomain)</li>
              <li>• <strong>Wildcard:</strong> *.example.com (allows widget on all subdomains)</li>
              <li>• <strong>Development:</strong> localhost:3000 (for testing locally)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Security best practices:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Only add domains you own and control</li>
              <li>• Regularly review and remove unused domains</li>
              <li>• Disable domains temporarily if needed</li>
              <li>• Monitor usage statistics for unusual activity</li>
            </ul>
          </div>

          <InfoAlert
            variant="warning"
            title="Important"
            message="Changes to domain permissions may take a few minutes to take effect. Clear your browser cache if you experience issues after making changes."
          />
        </CardContent>
      </Card>
    </div>
  );
}