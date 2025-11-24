"use client";

import { useState, useEffect, useMemo } from "react";
import { Settings, Save, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useDeleteApiV1AdminEmbeddingsPineconeAll } from "@/lib/api/generated/queries/admin-embeddings/admin-embeddings";
import {
  useGetApiV1AdminSettings,
  usePatchApiV1AdminSettingsBulk,
  usePostApiV1AdminSettingsCacheClear,
  getGetApiV1AdminSettingsQueryKey,
} from "@/lib/api/generated/queries/admin-settings/admin-settings";
import type { AdminSystemSetting } from "@/lib/api/generated/models/adminSystemSetting";
import type { DeleteApiV1AdminEmbeddingsPineconeAll200 } from "@/lib/api/generated/models/deleteApiV1AdminEmbeddingsPineconeAll200";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORY_ICONS, CATEGORY_NAMES } from "@/lib/constants/settings-config";
import { CategorySettingsCard, DangerZoneCard } from "@/components/admin/settings";

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeletePineconeDialog, setShowDeletePineconeDialog] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteApiV1AdminEmbeddingsPineconeAll200 | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);

  const { data: settingsData, isLoading, error, refetch } = useGetApiV1AdminSettings();

  const bulkUpdateMutation = usePatchApiV1AdminSettingsBulk({
    mutation: {
      onSuccess: () => {
        setSaveSuccess(true);
        setHasChanges(false);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSettingsQueryKey() });
        setTimeout(() => setSaveSuccess(false), 3000);
      },
    },
  });

  const deletePineconeMutation = useDeleteApiV1AdminEmbeddingsPineconeAll({
    mutation: {
      onSuccess: (data) => {
        setDeleteResult(data);
        setShowDeletePineconeDialog(false);
      },
      onError: (error) => {
        setDeleteResult({
          success: false,
          message: error instanceof Error ? error.message : "Failed to delete Pinecone data",
        });
      },
    },
  });

  const clearCacheMutation = usePostApiV1AdminSettingsCacheClear({
    mutation: {
      onSuccess: () => {
        setCacheCleared(true);
        queryClient.invalidateQueries();
        setTimeout(() => setCacheCleared(false), 3000);
      },
    },
  });

  const settingsByCategory = useMemo(() => {
    const settings = settingsData?.data?.settings || [];
    return settings.reduce((acc, setting) => {
      const category = setting.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {} as Record<string, AdminSystemSetting[]>);
  }, [settingsData]);

  useEffect(() => {
    if (settingsData?.data?.settings) {
      const initial: Record<string, string> = {};
      settingsData.data.settings.forEach((setting) => {
        initial[setting.key] = setting.value;
      });
      setLocalSettings(initial);
    }
  }, [settingsData]);

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const changedSettings = Object.entries(localSettings)
      .filter(([key, value]) => {
        const original = settingsData?.data?.settings?.find((s) => s.key === key);
        return original && original.value !== value;
      })
      .map(([key, value]) => ({ key, value }));

    if (changedSettings.length > 0) {
      bulkUpdateMutation.mutate({ data: { settings: changedSettings } });
    }
  };

  const handleDeleteAllPinecone = () => {
    setDeleteResult(null);
    deletePineconeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load settings"}
        </AlertDescription>
      </Alert>
    );
  }

  const categories = Object.keys(settingsByCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {clearCacheMutation.isPending ? "Clearing..." : "Clear Cache"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || bulkUpdateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {bulkUpdateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {bulkUpdateMutation.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {bulkUpdateMutation.error instanceof Error
              ? bulkUpdateMutation.error.message
              : "Failed to save settings"}
          </AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {cacheCleared && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <AlertDescription>All caches cleared successfully!</AlertDescription>
        </Alert>
      )}

      {clearCacheMutation.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {clearCacheMutation.error instanceof Error
              ? clearCacheMutation.error.message
              : "Failed to clear cache"}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={categories[0] || 'GENERAL'} className="space-y-6">
        <TabsList className="flex-wrap">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
            return (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {CATEGORY_NAMES[category] || category}
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="danger" className="flex items-center gap-2 text-red-600 data-[state=active]:text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <CategorySettingsCard
              category={category}
              settings={settingsByCategory[category] || []}
              localSettings={localSettings}
              onSettingChange={handleSettingChange}
            />
          </TabsContent>
        ))}

        <TabsContent value="danger">
          <DangerZoneCard
            deleteResult={deleteResult}
            onDeletePinecone={() => setShowDeletePineconeDialog(true)}
          />
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={showDeletePineconeDialog}
        onOpenChange={setShowDeletePineconeDialog}
        onConfirm={handleDeleteAllPinecone}
        isDeleting={deletePineconeMutation.isPending}
        title="Delete All Pinecone Data"
        description="This action will permanently delete ALL vectors from the Pinecone index and remove all embedding records from the database."
        itemName="Entire Pinecone Index"
        itemDetails="All embeddings across all sites and users will be deleted"
        warningMessage="This is an extremely destructive action. The chatbot will lose ALL knowledge and sites will need to be re-crawled to restore functionality. This cannot be undone."
        confirmText="Delete Everything"
        variant="danger"
      />
    </div>
  );
}
