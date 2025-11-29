"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Globe,
  FileText,
  Building2,
  MessageSquare,
  Settings,
  Save,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useGetAdminSitesSiteId,
  usePatchAdminSitesSiteId,
  getGetAdminSitesSiteIdQueryKey,
} from "@/lib/api/generated/queries/admin-sites/admin-sites";
import type { PatchAdminSitesSiteIdBody, PatchAdminSitesSiteIdBodyCrawlStatus } from "@/lib/api/generated/models";

const CRAWL_STATUS_OPTIONS: { value: PatchAdminSitesSiteIdBodyCrawlStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export default function AdminSiteEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.siteId as string;

  const [formData, setFormData] = useState<PatchAdminSitesSiteIdBody>({
    siteName: "",
    siteDescription: "",
    siteIndustry: "",
    specialInstructions: "",
    welcomeMessage: "",
    crawlStatus: "PENDING",
  });
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch site details
  const {
    data: siteResponse,
    isLoading,
    error: fetchError,
  } = useGetAdminSitesSiteId(siteId);

  const site = siteResponse?.data;

  // Update mutation
  const updateMutation = usePatchAdminSitesSiteId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminSitesSiteIdQueryKey(siteId),
        });
        router.push(`/admin/sites/${siteId}`);
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to update site"
        );
      },
    },
  });

  // Initialize form data when site is loaded
  useEffect(() => {
    if (site) {
      setFormData({
        siteName: site.siteName || "",
        siteDescription: site.siteDescription || "",
        siteIndustry: site.siteIndustry || "",
        specialInstructions: site.specialInstructions || "",
        welcomeMessage: site.welcomeMessage || "",
        crawlStatus: site.crawlStatus as PatchAdminSitesSiteIdBodyCrawlStatus,
      });
    }
  }, [site]);

  // Track changes
  useEffect(() => {
    if (site) {
      const changed =
        formData.siteName !== site.siteName ||
        formData.siteDescription !== (site.siteDescription || "") ||
        formData.siteIndustry !== (site.siteIndustry || "") ||
        formData.specialInstructions !== (site.specialInstructions || "") ||
        formData.welcomeMessage !== (site.welcomeMessage || "") ||
        formData.crawlStatus !== site.crawlStatus;
      setHasChanges(changed);
    }
  }, [formData, site]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);

    // Only send changed fields
    const updates: PatchAdminSitesSiteIdBody = {};
    if (formData.siteName !== site?.siteName) {
      updates.siteName = formData.siteName;
    }
    if (formData.siteDescription !== (site?.siteDescription || "")) {
      updates.siteDescription = formData.siteDescription;
    }
    if (formData.siteIndustry !== (site?.siteIndustry || "")) {
      updates.siteIndustry = formData.siteIndustry;
    }
    if (formData.specialInstructions !== (site?.specialInstructions || "")) {
      updates.specialInstructions = formData.specialInstructions;
    }
    if (formData.welcomeMessage !== (site?.welcomeMessage || "")) {
      updates.welcomeMessage = formData.welcomeMessage;
    }
    if (formData.crawlStatus !== site?.crawlStatus) {
      updates.crawlStatus = formData.crawlStatus;
    }

    updateMutation.mutate({
      siteId,
      data: updates,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load site</AlertDescription>
      </Alert>
    );
  }

  if (!site) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Error alert */}
      {mutationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/sites/${siteId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Site</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/sites/${siteId}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Core details about the site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Site Name */}
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={formData.siteName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, siteName: e.target.value })
                }
                placeholder="Enter site name"
                required
              />
            </div>

            {/* Site URL (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                value={site.siteUrl}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Site URL cannot be changed after creation
              </p>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="siteIndustry" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Industry
              </Label>
              <Input
                id="siteIndustry"
                value={formData.siteIndustry || ""}
                onChange={(e) =>
                  setFormData({ ...formData, siteIndustry: e.target.value })
                }
                placeholder="e.g., Technology, Healthcare, E-commerce"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="siteDescription" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="siteDescription"
                value={formData.siteDescription || ""}
                onChange={(e) =>
                  setFormData({ ...formData, siteDescription: e.target.value })
                }
                placeholder="Brief description of the site"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI & Chat Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI & Chat Settings
            </CardTitle>
            <CardDescription>
              Configure how the AI chatbot behaves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Welcome Message */}
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                value={formData.welcomeMessage || ""}
                onChange={(e) =>
                  setFormData({ ...formData, welcomeMessage: e.target.value })
                }
                placeholder="The initial message displayed to users"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This message is shown when a user starts a new conversation
              </p>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions || ""}
                onChange={(e) =>
                  setFormData({ ...formData, specialInstructions: e.target.value })
                }
                placeholder="Custom instructions for the AI assistant..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                These instructions guide the AI&apos;s behavior and responses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status & Technical */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status & Technical
            </CardTitle>
            <CardDescription>
              Crawl status and technical information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Crawl Status */}
            <div className="space-y-2">
              <Label htmlFor="crawlStatus">Crawl Status</Label>
              <Select
                value={formData.crawlStatus}
                onValueChange={(value: PatchAdminSitesSiteIdBodyCrawlStatus) =>
                  setFormData({ ...formData, crawlStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {CRAWL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing this manually may affect site functionality
              </p>
            </div>

            {/* Read-only Info */}
            <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Site ID:</strong> {site.id}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Owner:</strong> {site.user.fullName || site.user.email}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Created:</strong>{" "}
                {new Date(site.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {site.lastCrawledAt && (
                <p className="text-sm text-muted-foreground">
                  <strong>Last Crawled:</strong>{" "}
                  {new Date(site.lastCrawledAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
