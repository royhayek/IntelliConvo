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
  useGetSitesSiteIdHosts,
  usePostSitesSiteIdHosts,
  usePatchSitesSiteIdHostsHostId,
  useDeleteSitesSiteIdHostsHostId,
  getGetSitesSiteIdHostsQueryKey,
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

  const { data: hostsData, isLoading } = useGetSitesSiteIdHosts(site.id);
  const hosts = hostsData?.hosts || [];

  const addHostMutation = usePostSitesSiteIdHosts({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host added successfully!");
        setNewHost("");
      },
    },
  });

  const updateHostMutation = usePatchSitesSiteIdHostsHostId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host updated successfully!");
      },
    },
  });

  const deleteHostMutation = useDeleteSitesSiteIdHostsHostId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host deleted successfully!");
      },
    },
  });

  const handleAddHost = () => {
    if (!newHost.trim()) {
      toast.error("Please enter a hostname");
      return;
    }

    const hostname = newHost.trim();

    // Validate hostname format (supports domains, wildcards, localhost with ports, IPs with ports)
    const isValid = validateHostname(hostname);

    if (!isValid) {
      toast.error("Please enter a valid hostname (e.g., example.com, *.example.com, localhost:3000, or 192.168.1.1:8080)");
      return;
    }

    addHostMutation.mutate({ siteId: site.id, data: { hostName: hostname } });
  };

  // Hostname validation function
  const validateHostname = (hostname: string): boolean => {
    if (!hostname || hostname.length === 0) {
      return false;
    }

    // Remove protocol if present
    let normalized = hostname.toLowerCase().replace(/^https?:\/\//, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // Wildcard pattern (*.example.com)
    if (normalized.startsWith('*.')) {
      const domain = normalized.slice(2);
      return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain);
    }

    // Localhost with optional port
    if (normalized.startsWith('localhost')) {
      if (normalized === 'localhost') return true;
      const portMatch = normalized.match(/^localhost:(\d+)$/);
      if (portMatch) {
        const port = parseInt(portMatch[1], 10);
        return port > 0 && port <= 65535;
      }
      return false;
    }

    // IP address with optional port
    const ipPortMatch = normalized.match(/^(\d+\.\d+\.\d+\.\d+)(?::(\d+))?$/);
    if (ipPortMatch) {
      const [, ip, port] = ipPortMatch;
      const parts = ip.split('.');
      const validIp = parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });

      if (!validIp) return false;

      if (port) {
        const portNum = parseInt(port, 10);
        return portNum > 0 && portNum <= 65535;
      }

      return true;
    }

    // Regular hostname with optional port
    const hostPortMatch = normalized.match(/^([^:]+)(?::(\d+))?$/);
    if (hostPortMatch) {
      const [, host, port] = hostPortMatch;

      // Validate hostname part
      const validHost = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(host);

      if (!validHost) return false;

      // Validate port if present
      if (port) {
        const portNum = parseInt(port, 10);
        return portNum > 0 && portNum <= 65535;
      }

      return true;
    }

    return false;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Allowed Domains"
        description="Manage which domains can embed and use your chat widget"
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
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="example.com, *.example.com, or localhost:3000"
                  value={newHost}
                  onChange={(e) => setNewHost(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddHost()}
                />
              </div>
              <Button
                onClick={handleAddHost}
                disabled={addHostMutation.isPending || !newHost.trim()}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addHostMutation.isPending ? "Adding..." : "Add Domain"}
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Supports domains, wildcards, and localhost/IPs with ports for development
            </p>
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
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Supported domain formats:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <strong>Root domain:</strong> example.com (allows widget on example.com and www.example.com)</li>
              <li>• <strong>Subdomain:</strong> blog.example.com (allows widget only on blog.example.com)</li>
              <li>• <strong>Wildcard:</strong> *.example.com (allows widget on ANY subdomain like api.example.com, shop.example.com)</li>
              <li>• <strong>Localhost:</strong> localhost or localhost:3000 (for local development)</li>
              <li>• <strong>IP address:</strong> 192.168.1.1 or 192.168.1.1:8080 (for testing on local networks)</li>
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