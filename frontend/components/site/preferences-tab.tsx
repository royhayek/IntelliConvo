"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SectionHeader } from "@/components/ui/section-header";
import { FormSection } from "@/components/ui/form-section";
import { StarterFieldItem } from "@/components/site/starter-field-item";
import { DangerZoneCard } from "@/components/site/danger-zone-card";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  usePatchSitesSiteId,
  useGetSitesSiteIdStarters,
  usePutSitesSiteIdStarters,
  useDeleteSitesSiteId,
  getGetSitesSiteIdQueryKey,
  getGetSitesSiteIdStartersQueryKey,
  getGetSitesQueryKey,
} from "@/lib/api/generated/queries/sites/sites";
import { type SiteResponse } from "@/lib/api/generated/models";

// Validation schemas
const siteInfoSchema = z.object({
  siteName: z
    .string()
    .min(1, "Site name is required")
    .max(100, "Site name must be less than 100 characters"),
  siteDescription: z
    .string()
    .min(1, "Site description is required")
    .max(500, "Description must be less than 500 characters"),
  specialInstructions: z
    .string()
    .max(1000, "Instructions must be less than 1000 characters")
    .optional(),
  siteIndustry: z
    .string()
    .max(100, "Industry must be less than 100 characters")
    .optional(),
});

const conversationStartersSchema = z.object({
  startersHeadline: z
    .string()
    .max(200, "Starters headline must be less than 200 characters")
    .optional(),
  starters: z
    .array(
      z.object({
        text: z
          .string()
          .min(1, "Starter text is required")
          .max(150, "Starter must be less than 150 characters"),
      })
    )
    .max(10, "Maximum 10 conversation starters allowed"),
});

type SiteInfoFormData = z.infer<typeof siteInfoSchema>;
type ConversationStartersFormData = z.infer<typeof conversationStartersSchema>;

interface PreferencesTabProps {
  site: SiteResponse;
}

export function PreferencesTab({ site }: PreferencesTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Site Info Form
  const siteInfoForm = useForm<SiteInfoFormData>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: {
      siteName: site.siteName,
      siteDescription: site.siteDescription || "",
      siteIndustry: site.siteIndustry || "",
      specialInstructions: site.specialInstructions || "",
    },
  });

  // Conversation Starters Data
  const { data: starters } = useGetSitesSiteIdStarters(site.id);

  // Conversation Starters Form
  const startersForm = useForm<ConversationStartersFormData>({
    resolver: zodResolver(conversationStartersSchema),
    defaultValues: {
      startersHeadline: "",
      starters: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: startersForm.control,
    name: "starters",
  });

  // Update form when starters data is loaded
  useEffect(() => {
    if (starters) {
      startersForm.reset({
        startersHeadline: starters.startersHeadline || "",
        starters:
          starters.starters
            ?.map((s) => ({ text: s.starterText || "" }))
            .filter((s) => s.text) || [],
      });
    }
  }, [starters, startersForm]);

  const updateSiteMutation = usePatchSitesSiteId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetSitesSiteIdQueryKey(site.id),
        });
      },
    },
  });

  const updateStartersMutation = usePutSitesSiteIdStarters({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetSitesSiteIdStartersQueryKey(site.id),
        });
      },
    },
  });

  const deleteSiteMutation = useDeleteSitesSiteId({
    mutation: {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        // Invalidate the sites list query so dashboard updates
        queryClient.invalidateQueries({
          queryKey: getGetSitesQueryKey(),
        });
        router.push("/dashboard");
      },
    },
  });

  const handleDeleteSite = () => {
    deleteSiteMutation.mutate({ siteId: site.id });
  };

  const onSaveSiteInfo = (data: SiteInfoFormData) => {
    updateSiteMutation.mutate({
      siteId: site.id,
      data: {
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        siteIndustry: data.siteIndustry,
        specialInstructions: data.specialInstructions,
      },
    });
  };

  const onSaveStarters = (data: ConversationStartersFormData) => {
    updateStartersMutation.mutate({
      siteId: site.id,
      data: {
        startersHeadline: data.startersHeadline,
        starters: data.starters.map((s) => s.text),
      },
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Site Settings"
        description="Configure your site information and conversation settings"
      />

      <Tabs defaultValue="site-info" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger
              value="site-info"
              className="whitespace-nowrap text-xs sm:text-sm"
            >
              Site Info
            </TabsTrigger>
            <TabsTrigger
              value="conversation-starters"
              className="whitespace-nowrap text-xs sm:text-sm"
            >
              Conversation Starters
            </TabsTrigger>
            <TabsTrigger
              value="active-hosts"
              className="whitespace-nowrap text-xs sm:text-sm"
            >
              Active Host Names
            </TabsTrigger>
            <TabsTrigger
              value="danger-zone"
              className="whitespace-nowrap text-xs sm:text-sm"
            >
              Danger Zone
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="site-info" className="space-y-6">
          <FormSection
            title="Site Info"
            description="Manage your site information and settings"
            asCard={true}
            action={
              <Button
                onClick={siteInfoForm.handleSubmit(onSaveSiteInfo)}
                disabled={
                  updateSiteMutation.isPending ||
                  !siteInfoForm.formState.isDirty
                }
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSiteMutation.isPending
                  ? "Saving..."
                  : "Update Site Info"}
              </Button>
            }
          >
            <Form {...siteInfoForm}>
              <form
                onSubmit={siteInfoForm.handleSubmit(onSaveSiteInfo)}
                className="space-y-4"
              >
                <FormField
                  control={siteInfoForm.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Site" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={siteInfoForm.control}
                  name="siteDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your site in a few sentences"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={siteInfoForm.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter special site instructions"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional instructions for how the AI should handle
                        conversations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={siteInfoForm.control}
                  name="siteIndustry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="Digital Payments" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </FormSection>
        </TabsContent>

        <TabsContent value="conversation-starters" className="space-y-6">
          <FormSection
            title={`Conversation Starters (Total ${fields.length})`}
            asCard={true}
            action={
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={startersForm.handleSubmit(onSaveStarters)}
                  disabled={
                    updateStartersMutation.isPending ||
                    !startersForm.formState.isDirty
                  }
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateStartersMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            }
          >
            <Form {...startersForm}>
              <form
                onSubmit={startersForm.handleSubmit(onSaveStarters)}
                className="space-y-6"
              >
                <FormField
                  control={startersForm.control}
                  name="startersHeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starters Headline</FormLabel>
                      <FormDescription>
                        Headline text displayed above the conversation starter buttons.
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="How can I help you today?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Conversation Starters</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Help users get a conversation started with these
                        prompts.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => append({ text: "" })}
                      disabled={fields.length >= 10}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Starter
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed rounded-lg">
                      No conversation starters yet. Click "Add Starter" to
                      create one.
                    </div>
                  )}

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={startersForm.control}
                        name={`starters.${index}.text`}
                        render={({ field }) => (
                          <StarterFieldItem
                            index={index}
                            field={field}
                            onRemove={() => remove(index)}
                            disabled={updateStartersMutation.isPending}
                          />
                        )}
                      />
                    ))}
                  </div>
                </div>
              </form>
            </Form>
          </FormSection>
        </TabsContent>

        <TabsContent value="active-hosts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Host Names</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage the host names connected to your system
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {site.siteUrl}
                  </span>
                  <span className="text-green-600 text-sm">✓ Enabled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger-zone" className="space-y-6">
          <DangerZoneCard
            siteUrl={site.siteUrl}
            hasActiveSubscription={
              site.subscription?.status === "ACTIVE" ||
              site.subscription?.status === "TRIAL" ||
              false
            }
            onDelete={() => setDeleteDialogOpen(true)}
            isDeleting={deleteSiteMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteSite}
        title="Delete Site"
        description="This will permanently delete your site and all associated data including conversations, messages, embeddings, and settings."
        itemName={site.siteName}
        itemDetails={site.siteUrl}
        warningMessage="This action cannot be undone. All data will be permanently deleted from our servers."
        isDeleting={deleteSiteMutation.isPending}
        confirmText="Delete Site"
      />
    </div>
  );
}
