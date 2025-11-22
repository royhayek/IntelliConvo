"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  AlertTriangle,
  Database,
  Mail,
  CreditCard,
  Bot,
  Shield,
  Globe,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useDeleteApiV1AdminEmbeddingsPineconeAll } from "@/lib/api/generated/queries/admin-embeddings/admin-embeddings";
import type { DeleteApiV1AdminEmbeddingsPineconeAll200 } from "@/lib/api/generated/models/deleteApiV1AdminEmbeddingsPineconeAll200";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Danger zone state
  const [showDeletePineconeDialog, setShowDeletePineconeDialog] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteApiV1AdminEmbeddingsPineconeAll200 | null>(null);

  // General settings
  const [siteName, setSiteName] = useState("IntelligentConvo");
  const [supportEmail, setSupportEmail] = useState("support@intelligentconvo.com");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // AI settings
  const [defaultModel, setDefaultModel] = useState("gpt-4");
  const [maxTokens, setMaxTokens] = useState("4096");
  const [temperature, setTemperature] = useState("0.7");

  // Security settings
  const [sessionTimeout, setSessionTimeout] = useState("7");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);

  // Delete Pinecone mutation
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllPinecone = () => {
    setDeleteResult(null);
    deletePineconeMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2 text-red-600 data-[state=active]:text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Platform Name</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Disable access for non-admin users
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure AI model settings and parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultModel">Default Model</Label>
                  <Select value={defaultModel} onValueChange={setDefaultModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Controls randomness (0 = deterministic, 2 = creative)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure authentication and security options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (days)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-gray-500">
                      Users must verify email before accessing
                    </p>
                  </div>
                  <Switch
                    checked={requireEmailVerification}
                    onCheckedChange={setRequireEmailVerification}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email delivery settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Email Settings</p>
                <p className="text-sm">
                  Email configuration is managed via environment variables.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Configuration</CardTitle>
              <CardDescription>
                Configure Stripe and billing settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Stripe Integration</p>
                <p className="text-sm">
                  Stripe configuration is managed via environment variables.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <div className="space-y-6">
            {/* Delete Result Alert */}
            {deleteResult && (
              <Alert variant={deleteResult.success ? "default" : "destructive"} className={deleteResult.success ? "bg-green-50 text-green-700 border-green-200" : ""}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{deleteResult.message}</AlertDescription>
              </Alert>
            )}

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  These actions are destructive and cannot be undone. Please proceed with extreme caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Delete All Pinecone Data */}
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <h4 className="font-medium text-red-900 dark:text-red-100">Delete All Pinecone Data</h4>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Permanently delete ALL vectors from the Pinecone index. This will remove all embeddings
                      for all sites and users. The chatbot will lose all knowledge until sites are re-crawled.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeletePineconeDialog(true)}
                    className="ml-4 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Pinecone Confirmation Dialog */}
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
