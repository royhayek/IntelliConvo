"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Trash2, Globe, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  useGetApiSitesSiteIdHosts,
  usePostApiSitesSiteIdHosts,
  usePatchApiSitesSiteIdHostsHostId,
  useDeleteApiSitesSiteIdHostsHostId,
  getGetApiSitesSiteIdHostsQueryKey,
} from "@/lib/api/generated/queries/sites/sites";
import {
  type GetApiSitesSiteId200,
  type GetApiSitesSiteIdHosts200HostsItem,
} from "@/lib/api/generated/models";

interface HostsTabProps {
  site: GetApiSitesSiteId200;
}

export function HostsTab({ site }: HostsTabProps) {
  const queryClient = useQueryClient();
  const [newHost, setNewHost] = useState("");

  const { data: hostsData, isLoading } = useGetApiSitesSiteIdHosts(site.id);
  const hosts = hostsData?.hosts || [];

  const addHostMutation = usePostApiSitesSiteIdHosts({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host added successfully!");
        setNewHost("");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to add host");
      },
    },
  });

  const updateHostMutation = usePatchApiSitesSiteIdHostsHostId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host updated successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to update host");
      },
    },
  });

  const deleteHostMutation = useDeleteApiSitesSiteIdHostsHostId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdHostsQueryKey(site.id) });
        toast.success("Host deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete host");
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

  const getHostStatus = (host: GetApiSitesSiteIdHosts200HostsItem) => {
    if (!host.isActive) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
        text: "Inactive",
        className: "text-gray-500"
      };
    }

    if (host.lastSeenAt) {
      const lastSeen = new Date(host.lastSeenAt);
      const daysSinceLastSeen = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastSeen === 0) {
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          text: "Active Today",
          className: "text-green-600"
        };
      } else if (daysSinceLastSeen <= 7) {
        return {
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          text: `Last seen ${daysSinceLastSeen} day${daysSinceLastSeen > 1 ? 's' : ''} ago`,
          className: "text-yellow-600"
        };
      }
    }

    return {
      icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
      text: "Not recently active",
      className: "text-orange-600"
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Access & Security</h2>
        <p className="text-gray-600">Manage which domains and hostnames can access your chat widget</p>
      </div>

      {/* Security Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Note:</strong> Only domains listed below can embed and use your chat widget.
          This prevents unauthorized usage and protects your API quota.
        </AlertDescription>
      </Alert>

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
              <p className="text-sm text-gray-500 mt-1">
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
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading domains...</span>
            </div>
          ) : hosts.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains configured</h3>
              <p className="text-gray-600">
                Add your first domain to enable widget access. Without any domains, your widget won't be accessible.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hosts.map((host) => {
                const status = getHostStatus(host);
                return (
                  <div
                    key={host.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{host.hostname}</h4>
                        <div className="flex items-center space-x-2 text-sm">
                          {status.icon}
                          <span className={status.className}>{status.text}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Added: {host.addedAt ? new Date(host.addedAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateHostMutation.mutate({
                          siteId: site.id,
                          hostId: host.id!,
                          data: { isEnabled: !host.isActive }
                        })}
                        disabled={updateHostMutation.isPending}
                        className={host.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}
                      >
                        {host.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteHostMutation.mutate({ siteId: site.id, hostId: host.id! })}
                        disabled={deleteHostMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{hosts.length}</p>
                <p className="text-sm text-blue-600">Total Domains</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {hosts.filter(h => h.isActive).length}
                </p>
                <p className="text-sm text-green-600">Active Domains</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {hosts.filter(h => h.lastSeenAt && new Date(h.lastSeenAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length}
                </p>
                <p className="text-sm text-orange-600">Active Today</p>
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
            <h4 className="font-medium text-gray-900 mb-2">How to configure domains:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Root domain:</strong> example.com (allows widget on main site)</li>
              <li>• <strong>Subdomain:</strong> blog.example.com (allows widget on specific subdomain)</li>
              <li>• <strong>Wildcard:</strong> *.example.com (allows widget on all subdomains)</li>
              <li>• <strong>Development:</strong> localhost:3000 (for testing locally)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Security best practices:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Only add domains you own and control</li>
              <li>• Regularly review and remove unused domains</li>
              <li>• Disable domains temporarily if needed</li>
              <li>• Monitor usage statistics for unusual activity</li>
            </ul>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Changes to domain permissions may take a few minutes to take effect.
              Clear your browser cache if you experience issues after making changes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}