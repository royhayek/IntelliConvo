"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePatchApiSitesSiteId,
  useGetApiSitesSiteIdStarters,
  usePutApiSitesSiteIdStarters,
  getGetApiSitesSiteIdQueryKey,
  getGetApiSitesSiteIdStartersQueryKey,
} from "@/lib/api/generated/queries/sites/sites";
import { type GetApiSitesSiteId200 } from "@/lib/api/generated/models";

interface PreferencesTabProps {
  site: GetApiSitesSiteId200;
}

export function PreferencesTab({ site }: PreferencesTabProps) {
  const queryClient = useQueryClient();
  const [siteInfo, setSiteInfo] = useState({
    siteName: site.siteName,
    siteDescription: site.siteDescription || "",
    siteIndustry: site.siteIndustry || "",
    specialInstructions: site.specialInstructions || "",
  });

  const { data: starters } = useGetApiSitesSiteIdStarters(site.id);

  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [startersList, setStartersList] = useState<string[]>([]);
  const [newStarter, setNewStarter] = useState("");

  // Update local state when starters data is loaded
  useEffect(() => {
    if (starters) {
      setWelcomeMessage(starters.welcomeMessage || "");
      setStartersList(starters.starters?.map(s => s.starterText || "").filter(Boolean) || []);
    }
  }, [starters]);

  const updateSiteMutation = usePatchApiSitesSiteId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdQueryKey(site.id) });
      },
    },
  });

  const updateStartersMutation = usePutApiSitesSiteIdStarters({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdStartersQueryKey(site.id) });
      },
    },
  });

  const handleSaveSiteInfo = () => {
    updateSiteMutation.mutate({ siteId: site.id, data: siteInfo });
  };

  const handleSaveStarters = () => {
    updateStartersMutation.mutate({
      siteId: site.id,
      data: {
        welcomeMessage,
        starters: startersList,
      },
    });
  };

  const addStarter = () => {
    if (newStarter.trim()) {
      setStartersList([...startersList, newStarter.trim()]);
      setNewStarter("");
    }
  };

  const removeStarter = (index: number) => {
    setStartersList(startersList.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Site Preferences</h2>
        <p className="text-gray-600">Configure your site information and conversation settings</p>
      </div>

      <Tabs defaultValue="site-info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="site-info">Site Info</TabsTrigger>
          <TabsTrigger value="conversation-starters">Conversation Starters</TabsTrigger>
          <TabsTrigger value="active-hosts">Active Host Names</TabsTrigger>
          <TabsTrigger value="danger-zone">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="site-info" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Site Info</CardTitle>
                <p className="text-sm text-gray-600">Manage your site information and settings</p>
              </div>
              <Button onClick={handleSaveSiteInfo} disabled={updateSiteMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateSiteMutation.isPending ? "Saving..." : "Update Site Info"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  value={siteInfo.siteName}
                  onChange={(e) => setSiteInfo({ ...siteInfo, siteName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description *</Label>
                <textarea
                  id="siteDescription"
                  value={siteInfo.siteDescription}
                  onChange={(e) => setSiteInfo({ ...siteInfo, siteDescription: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mojo is a digital wallet platform in Lebanon..."
                />
              </div>

              <div>
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <textarea
                  id="specialInstructions"
                  value={siteInfo.specialInstructions}
                  onChange={(e) => setSiteInfo({ ...siteInfo, specialInstructions: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter special site instructions"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={siteInfo.siteIndustry}
                  onChange={(e) => setSiteInfo({ ...siteInfo, siteIndustry: e.target.value })}
                  placeholder="Digital Payments"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation-starters" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Conversation Starters (Total {startersList.length})</CardTitle>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={handleSaveStarters} disabled={updateStartersMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateStartersMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Use this headline to prompt the user to start a conversation.
                </p>
                <Input
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Welcome to Mojo, how can I help you today?"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>Conversation Starters</Label>
                    <p className="text-sm text-gray-600">
                      Help users get a conversation started with these prompts.
                    </p>
                  </div>
                  <Button
                    onClick={addStarter}
                    disabled={!newStarter.trim() || startersList.length >= 10}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <Input
                    value={newStarter}
                    onChange={(e) => setNewStarter(e.target.value)}
                    placeholder="Add a new conversation starter"
                    onKeyPress={(e) => e.key === "Enter" && addStarter()}
                  />
                </div>

                <div className="space-y-2">
                  {startersList.map((starter, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{index + 1}. {starter}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStarter(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active-hosts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Host Names</CardTitle>
              <p className="text-sm text-gray-600">
                Manage the host names connected to your system
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">{site.siteUrl}</span>
                  <span className="text-green-600 text-sm">✓ Enabled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger-zone" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <p className="text-sm text-gray-600">
                You can delete your site and all associated data so long as you do not have any active subscriptions.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <p className="font-medium">{site.siteUrl}</p>
                  <p className="text-sm text-red-600">⚠ Active Subscription</p>
                </div>
                <Button variant="destructive" disabled>
                  Delete Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}