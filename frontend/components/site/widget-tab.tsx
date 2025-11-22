"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Check, Palette, MessageSquare, Layout, Zap, FileText, Smartphone, Sliders, Save, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { CodeBlock } from "@/components/ui/code-block";
import { WidgetPreview } from "@/components/ui/widget-preview";
import {
  FormColorPicker,
  FormSelectField,
  FormNumberField,
  FormToggleField,
  FormInput,
  FormTextarea,
} from "@/components/form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetApiV1WidgetSiteIdSettingsAdmin,
  usePatchApiV1WidgetSiteIdSettings,
  usePutApiV1WidgetSiteIdSettingsReset,
  getGetApiV1WidgetSiteIdSettingsAdminQueryKey,
} from "@/lib/api/generated/queries/widget/widget";
import { type SiteResponse } from "@/lib/api/generated/models";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";

interface WidgetTabProps {
  site: SiteResponse;
}

interface WidgetSettings {
  // Appearance
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  shadowSize: "none" | "small" | "medium" | "large";

  // Launcher
  launcherIcon: "chat" | "message" | "help" | "support";
  launcherSize: "small" | "medium" | "large";
  launcherPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  launcherOffsetX: number;
  launcherOffsetY: number;
  launcherShape: "circle" | "rounded-square" | "square";
  launcherBackgroundColor: string;
  launcherIconColor: string;
  launcherTooltip: string;
  launcherShowTooltip: boolean;
  launcherAnimation: "none" | "pulse" | "bounce" | "shake";
  launcherShowBadge: boolean;
  launcherBadgeColor: string;

  // Chat Window
  chatWindowWidth: number;
  chatWindowHeight: number;
  headerTitle: string;
  headerSubtitle: string;
  headerShowAvatar: boolean;
  headerAvatarUrl: string;
  headerShowStatus: boolean;
  headerShowCloseButton: boolean;
  headerShowMinimizeButton: boolean;
  userBubbleBackgroundColor: string;
  userBubbleTextColor: string;
  assistantBubbleBackgroundColor: string;
  assistantBubbleTextColor: string;
  inputPlaceholder: string;
  inputBorderRadius: number;

  // Behavior
  autoOpenEnabled: boolean;
  autoOpenDelay: number;
  autoOpenOnlyOnce: boolean;
  autoOpenOnMobile: boolean;
  showTypingIndicator: boolean;
  typingIndicatorText: string;
  enableSoundNotifications: boolean;
  enableVoiceInput: boolean;
  enableFileAttachments: boolean;
  enableEmojiPicker: boolean;
  persistConversation: boolean;
  showQuickReplies: boolean;

  // Content
  botName: string;
  welcomeMessage: string;
  offlineMessage: string;
  errorMessage: string;
  showConversationStarters: boolean;
  startersTitle: string;
  showPoweredBy: boolean;
  poweredByText: string;

  // Responsive
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  mobileFullScreen: boolean;
  mobileFontSize: number;
  mobileLauncherSize: "small" | "medium" | "large";
  enableTouchOptimizations: boolean;

  // Advanced
  enableAnimations: boolean;
  animationDuration: number;
  theme: "light" | "dark" | "auto";
  enableHighContrast: boolean;
  respectReducedMotion: boolean;
  enableKeyboardNavigation: boolean;
  customCss: string;
  enableAnalytics: boolean;

  // Dark Mode Colors
  darkModePrimaryColor: string;
  darkModeSecondaryColor: string;
  darkModeBackgroundColor: string;
  darkModeSecondaryBackgroundColor: string;
  darkModeTextColor: string;
  darkModeTextSecondaryColor: string;
  darkModeBorderColor: string;
}

const defaultSettings: WidgetSettings = {
  // Appearance
  primaryColor: "#6366f1",
  secondaryColor: "#818cf8",
  backgroundColor: "#ffffff",
  textColor: "#1e293b",
  textSecondaryColor: "#64748b",
  borderColor: "#e2e8f0",
  fontFamily: "system",
  fontSize: 14,
  borderRadius: 16,
  shadowSize: "medium",

  // Launcher
  launcherIcon: "chat",
  launcherSize: "medium",
  launcherPosition: "bottom-right",
  launcherOffsetX: 20,
  launcherOffsetY: 20,
  launcherShape: "circle",
  launcherBackgroundColor: "",
  launcherIconColor: "#ffffff",
  launcherTooltip: "Chat with us",
  launcherShowTooltip: true,
  launcherAnimation: "pulse",
  launcherShowBadge: false,
  launcherBadgeColor: "#ef4444",

  // Chat Window
  chatWindowWidth: 400,
  chatWindowHeight: 600,
  headerTitle: "Chat Assistant",
  headerSubtitle: "",
  headerShowAvatar: true,
  headerAvatarUrl: "",
  headerShowStatus: true,
  headerShowCloseButton: true,
  headerShowMinimizeButton: false,
  userBubbleBackgroundColor: "",
  userBubbleTextColor: "#ffffff",
  assistantBubbleBackgroundColor: "#f1f5f9",
  assistantBubbleTextColor: "#1e293b",
  inputPlaceholder: "Type your message...",
  inputBorderRadius: 24,

  // Behavior
  autoOpenEnabled: false,
  autoOpenDelay: 5000,
  autoOpenOnlyOnce: true,
  autoOpenOnMobile: false,
  showTypingIndicator: true,
  typingIndicatorText: "Assistant is typing...",
  enableSoundNotifications: false,
  enableVoiceInput: true,
  enableFileAttachments: false,
  enableEmojiPicker: true,
  persistConversation: true,
  showQuickReplies: true,

  // Content
  botName: "Assistant",
  welcomeMessage: "Hello! How can I help you today?",
  offlineMessage: "We're currently offline. Please leave a message.",
  errorMessage: "Something went wrong. Please try again.",
  showConversationStarters: true,
  startersTitle: "Suggested questions",
  showPoweredBy: true,
  poweredByText: "Powered by Intelligentconvo",

  // Responsive
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  mobileFullScreen: true,
  mobileFontSize: 16,
  mobileLauncherSize: "medium",
  enableTouchOptimizations: true,

  // Advanced
  enableAnimations: true,
  animationDuration: 200,
  theme: "light",
  enableHighContrast: false,
  respectReducedMotion: true,
  enableKeyboardNavigation: true,
  customCss: "",
  enableAnalytics: true,

  // Dark Mode Colors
  darkModePrimaryColor: "#6366f1",
  darkModeSecondaryColor: "#818cf8",
  darkModeBackgroundColor: "#1e293b",
  darkModeSecondaryBackgroundColor: "#374151",
  darkModeTextColor: "#f1f5f9",
  darkModeTextSecondaryColor: "#94a3b8",
  darkModeBorderColor: "#475569",
};

// Zod Validation Schema
const widgetSettingsSchema = z.object({
  // Appearance
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  textSecondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  fontFamily: z.string().min(1),
  fontSize: z.number().min(10).max(24),
  borderRadius: z.number().min(0).max(32),
  shadowSize: z.enum(["none", "small", "medium", "large"]),

  // Launcher
  launcherIcon: z.enum(["chat", "message", "help", "support"]),
  launcherSize: z.enum(["small", "medium", "large"]),
  launcherPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
  launcherOffsetX: z.number().min(0).max(100),
  launcherOffsetY: z.number().min(0).max(100),
  launcherShape: z.enum(["circle", "rounded-square", "square"]),
  launcherBackgroundColor: z.string(),
  launcherIconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  launcherTooltip: z.string().max(50),
  launcherShowTooltip: z.boolean(),
  launcherAnimation: z.enum(["none", "pulse", "bounce", "shake"]),
  launcherShowBadge: z.boolean(),
  launcherBadgeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),

  // Chat Window
  chatWindowWidth: z.number().min(300).max(800),
  chatWindowHeight: z.number().min(400).max(1000),
  headerTitle: z.string().min(1).max(50),
  headerSubtitle: z.string().max(100),
  headerShowAvatar: z.boolean(),
  headerAvatarUrl: z.string().url().or(z.literal("")),
  headerShowStatus: z.boolean(),
  headerShowCloseButton: z.boolean(),
  headerShowMinimizeButton: z.boolean(),
  userBubbleBackgroundColor: z.string(),
  userBubbleTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  assistantBubbleBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  assistantBubbleTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  inputPlaceholder: z.string().max(100),
  inputBorderRadius: z.number().min(0).max(50),

  // Behavior
  autoOpenEnabled: z.boolean(),
  autoOpenDelay: z.number().min(0).max(60000),
  autoOpenOnlyOnce: z.boolean(),
  autoOpenOnMobile: z.boolean(),
  showTypingIndicator: z.boolean(),
  typingIndicatorText: z.string().max(50),
  enableSoundNotifications: z.boolean(),
  enableVoiceInput: z.boolean(),
  enableFileAttachments: z.boolean(),
  enableEmojiPicker: z.boolean(),
  persistConversation: z.boolean(),
  showQuickReplies: z.boolean(),

  // Content
  botName: z.string().min(1).max(50),
  welcomeMessage: z.string().max(200),
  offlineMessage: z.string().max(200),
  errorMessage: z.string().max(200),
  showConversationStarters: z.boolean(),
  startersTitle: z.string().max(50),
  showPoweredBy: z.boolean(),
  poweredByText: z.string().max(100),

  // Responsive
  mobileBreakpoint: z.number().min(320).max(1024),
  tabletBreakpoint: z.number().min(768).max(1440),
  mobileFullScreen: z.boolean(),
  mobileFontSize: z.number().min(12).max(20),
  mobileLauncherSize: z.enum(["small", "medium", "large"]),
  enableTouchOptimizations: z.boolean(),

  // Advanced
  enableAnimations: z.boolean(),
  animationDuration: z.number().min(0).max(1000),
  theme: z.enum(["light", "dark", "auto"]),
  enableHighContrast: z.boolean(),
  respectReducedMotion: z.boolean(),
  enableKeyboardNavigation: z.boolean(),
  customCss: z.string().max(10000),
  enableAnalytics: z.boolean(),

  // Dark Mode Colors
  darkModePrimaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  darkModeSecondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  darkModeBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  darkModeSecondaryBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  darkModeTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  darkModeTextSecondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  darkModeBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

type WidgetSettingsFormData = z.infer<typeof widgetSettingsSchema>;

// Collapsible Section Component
function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border dark:border-gray-600 rounded-lg">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full p-3 text-left font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white h-auto justify-start"
      >
        {title}
        {isOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
      </Button>
      {isOpen && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );
}

export function WidgetTab({ site }: WidgetTabProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  // React Hook Form
  const form = useForm<WidgetSettingsFormData>({
    resolver: zodResolver(widgetSettingsSchema),
    defaultValues: defaultSettings,
    mode: "onChange",
  });

  // Load settings from API
  const { data: loadedSettings, isLoading } = useGetApiV1WidgetSiteIdSettingsAdmin(site.id);

  // Update form when settings are loaded
  useEffect(() => {
    if (loadedSettings) {
      form.reset({ ...defaultSettings, ...loadedSettings as unknown as WidgetSettings });
    }
  }, [loadedSettings, form]);

  // Save settings mutation
  const saveMutation = usePatchApiV1WidgetSiteIdSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1WidgetSiteIdSettingsAdminQueryKey(site.id) });
        toast({
          title: "Settings saved",
          description: "Your widget settings have been updated successfully.",
        });
        form.reset(form.getValues()); // Reset dirty state
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save widget settings. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  // Reset settings mutation
  const resetMutation = usePutApiV1WidgetSiteIdSettingsReset({
    mutation: {
      onSuccess: (data) => {
        form.reset({ ...defaultSettings, ...data as unknown as WidgetSettings });
        queryClient.invalidateQueries({ queryKey: getGetApiV1WidgetSiteIdSettingsAdminQueryKey(site.id) });
        toast({
          title: "Settings reset",
          description: "Widget settings have been reset to defaults.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to reset settings. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  // Save settings
  const onSaveSettings = (data: WidgetSettingsFormData) => {
    saveMutation.mutate({ siteId: site.id, data: data as any });
  };

  // Reset to defaults
  const resetSettings = () => {
    resetMutation.mutate({ siteId: site.id });
  };

  const isSaving = saveMutation.isPending;
  const hasChanges = form.formState.isDirty;
  const settings = form.watch(); // Get current form values for preview

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const embedCode = `<!-- Intelligentconvo Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://widget.intelligentconvo.com'}/widget.js';
    script.async = true;
    script.onload = function() {
      window.intelligentconvo('init', {
        siteId: '${site.id}',
        apiUrl: '${process.env.NEXT_PUBLIC_API_URL || 'https://api.intelligentconvo.com/api/v1'}'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSaveSettings)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Widget Customization</h2>
            <p className="text-gray-600 dark:text-gray-400">Customize every aspect of your chat widget</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

      {/* Preview Panel - Now on top */}
      <WidgetPreview settings={settings} />

      {/* Settings Panel - Now below */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-wrap">
              <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="launcher" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent">
                <MessageSquare className="h-4 w-4 mr-2" />
                Launcher
              </TabsTrigger>
              <TabsTrigger value="window" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent">
                <Layout className="h-4 w-4 mr-2" />
                Window
              </TabsTrigger>
              <TabsTrigger value="behavior" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent">
                <Zap className="h-4 w-4 mr-2" />
                Behavior
              </TabsTrigger>
              <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="responsive" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent">
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent">
                <Sliders className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="p-4 space-y-4">
                  <CollapsibleSection title="Colors" defaultOpen>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-3">Light Theme</p>
                        <div className="grid grid-cols-2 gap-4">
                          <FormColorPicker name="primaryColor" label="Primary Color" control={form.control} description="Main brand color" />
                          <FormColorPicker name="secondaryColor" label="Secondary Color" control={form.control} description="Accent color" />
                          <FormColorPicker name="backgroundColor" label="Background" control={form.control} />
                          <FormColorPicker name="textColor" label="Text Color" control={form.control} />
                          <FormColorPicker name="textSecondaryColor" label="Secondary Text" control={form.control} />
                          <FormColorPicker name="borderColor" label="Border Color" control={form.control} />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-3">Dark Theme</p>
                        <div className="grid grid-cols-2 gap-4">
                          <FormColorPicker name="darkModePrimaryColor" label="Primary Color" control={form.control} description="Main brand color" />
                          <FormColorPicker name="darkModeSecondaryColor" label="Secondary Color" control={form.control} description="Accent color" />
                          <FormColorPicker name="darkModeBackgroundColor" label="Background" control={form.control} />
                          <FormColorPicker name="darkModeTextColor" label="Text Color" control={form.control} />
                          <FormColorPicker name="darkModeTextSecondaryColor" label="Secondary Text" control={form.control} />
                          <FormColorPicker name="darkModeBorderColor" label="Border Color" control={form.control} />
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Typography">
                    <FormSelectField name="fontFamily" label="Font Family" control={form.control} options={[
                        { value: "system", label: "System Default" },
                        { value: "Inter, sans-serif", label: "Inter" },
                        { value: "Roboto, sans-serif", label: "Roboto" },
                        { value: "Open Sans, sans-serif", label: "Open Sans" },
                        { value: "Lato, sans-serif", label: "Lato" },
                      ]} />
                    <FormNumberField name="fontSize" label="Font Size" control={form.control} min={10} max={20} suffix="px" />
                  </CollapsibleSection>

                  <CollapsibleSection title="Shape & Shadow">
                    <FormNumberField name="borderRadius" label="Border Radius" control={form.control} min={0} max={32} suffix="px" />
                    <FormSelectField name="shadowSize" label="Shadow Size" control={form.control} options={[
                        { value: "none", label: "None" },
                        { value: "small", label: "Small" },
                        { value: "medium", label: "Medium" },
                        { value: "large", label: "Large" },
                      ]} />
                  </CollapsibleSection>
                </TabsContent>

                {/* Launcher Tab */}
                <TabsContent value="launcher" className="p-4 space-y-4">
                  <CollapsibleSection title="Position & Size" defaultOpen>
                    <FormSelectField name="launcherPosition" label="Position" control={form.control} options={[
                        { value: "bottom-right", label: "Bottom Right" },
                        { value: "bottom-left", label: "Bottom Left" },
                        { value: "top-right", label: "Top Right" },
                        { value: "top-left", label: "Top Left" },
                      ]} />
                    <FormSelectField name="launcherSize" label="Size" control={form.control} options={[
                        { value: "small", label: "Small (48px)" },
                        { value: "medium", label: "Medium (56px)" },
                        { value: "large", label: "Large (64px)" },
                      ]} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormNumberField name="launcherOffsetX" label="Offset X" control={form.control} min={0} max={100} suffix="px" />
                      <FormNumberField name="launcherOffsetY" label="Offset Y" control={form.control} min={0} max={100} suffix="px" />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Appearance">
                    <FormSelectField name="launcherIcon" label="Icon" control={form.control} options={[
                        { value: "chat", label: "Chat Bubble" },
                        { value: "message", label: "Message" },
                        { value: "help", label: "Help" },
                        { value: "support", label: "Support" },
                      ]} />
                    <FormSelectField name="launcherShape" label="Shape" control={form.control} options={[
                        { value: "circle", label: "Circle" },
                        { value: "rounded-square", label: "Rounded Square" },
                        { value: "square", label: "Square" },
                      ]} />
                    <FormColorPicker name="launcherBackgroundColor" label="Background Color" control={form.control} description="Leave empty to use primary color" />
                    <FormColorPicker name="launcherIconColor" label="Icon Color" control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Tooltip & Animation">
                    <FormToggleField name="launcherShowTooltip" label="Show Tooltip" control={form.control} />
                    <FormInput name="launcherTooltip" label="Tooltip Text" control={form.control} />
                    <FormSelectField name="launcherAnimation" label="Animation" control={form.control} options={[
                        { value: "none", label: "None" },
                        { value: "pulse", label: "Pulse" },
                        { value: "bounce", label: "Bounce" },
                        { value: "shake", label: "Shake" },
                        { value: "glow", label: "Glow" },
                      ]} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Badge">
                    <FormToggleField name="launcherShowBadge" label="Show Badge" control={form.control} description="Show unread message count" />
                    <FormColorPicker name="launcherBadgeColor" label="Badge Color" control={form.control} />
                  </CollapsibleSection>
                </TabsContent>

                {/* Window Tab */}
                <TabsContent value="window" className="p-4 space-y-4">
                  <CollapsibleSection title="Size" defaultOpen>
                    <div className="grid grid-cols-2 gap-4">
                      <FormNumberField name="chatWindowWidth" label="Width" control={form.control} min={300} max={600} suffix="px" />
                      <FormNumberField name="chatWindowHeight" label="Height" control={form.control} min={400} max={800} suffix="px" />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Header">
                    <FormInput name="headerTitle" label="Title" control={form.control} />
                    <FormInput name="headerSubtitle" label="Subtitle" placeholder="Optional" control={form.control} />
                    <FormToggleField name="headerShowAvatar" label="Show Avatar" control={form.control} />
                    <FormInput name="headerAvatarUrl" label="Avatar URL" placeholder="https://..." control={form.control} />
                    <FormToggleField name="headerShowStatus" label="Show Connection Status" control={form.control} />
                    <FormToggleField name="headerShowCloseButton" label="Show Close Button" control={form.control} />
                    <FormToggleField name="headerShowMinimizeButton" label="Show Minimize Button" control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Message Bubbles">
                    <div className="space-y-4">
                      <p className="text-sm font-medium">User Messages</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormColorPicker name="userBubbleBackgroundColor" label="Background" control={form.control} />
                        <FormColorPicker name="userBubbleTextColor" label="Text" control={form.control} />
                      </div>
                      <p className="text-sm font-medium">Assistant Messages</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormColorPicker name="assistantBubbleBackgroundColor" label="Background" control={form.control} />
                        <FormColorPicker name="assistantBubbleTextColor" label="Text" control={form.control} />
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Input Area">
                    <FormInput name="inputPlaceholder" label="Placeholder Text" control={form.control} />
                    <FormNumberField name="inputBorderRadius" label="Border Radius" control={form.control} min={0} max={32} suffix="px" />
                  </CollapsibleSection>
                </TabsContent>

                {/* Behavior Tab */}
                <TabsContent value="behavior" className="p-4 space-y-4">
                  <CollapsibleSection title="Auto-open" defaultOpen>
                    <FormToggleField name="autoOpenEnabled" label="Enable Auto-open" control={form.control} description="Automatically open chat after delay" />
                    <FormNumberField name="autoOpenDelay" label="Delay" control={form.control} min={0} max={60000} step={1000} suffix="ms" />
                    <FormToggleField name="autoOpenOnlyOnce" label="Only Once Per Session" control={form.control} />
                    <FormToggleField name="autoOpenOnMobile" label="Auto-open on Mobile" control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Features">
                    <FormToggleField name="enableVoiceInput" label="Voice Input" control={form.control} description="Enable microphone button" />
                    <FormToggleField name="enableFileAttachments" label="File Attachments" control={form.control} description="Allow users to upload files" />
                    <FormToggleField name="enableEmojiPicker" label="Emoji Picker" control={form.control} />
                    <FormToggleField name="showQuickReplies" label="Quick Replies" control={form.control} description="Show suggested responses" />
                  </CollapsibleSection>

                  <CollapsibleSection title="Notifications">
                    <FormToggleField name="enableSoundNotifications" label="Sound Notifications" control={form.control} description="Play sound on new messages" />
                  </CollapsibleSection>

                  <CollapsibleSection title="Typing Indicator">
                    <FormToggleField name="showTypingIndicator" label="Show Typing Indicator" control={form.control} />
                    <FormInput name="typingIndicatorText" label="Typing Text" control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Persistence">
                    <FormToggleField name="persistConversation" label="Persist Conversation" control={form.control} description="Remember chat history between sessions" />
                  </CollapsibleSection>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="p-4 space-y-4">
                  <CollapsibleSection title="Bot Identity" defaultOpen>
                    <FormInput name="botName" label="Bot Name" control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Messages">
                    <FormTextarea name="welcomeMessage" label="Welcome Message" rows={3} control={form.control} />
                    <FormTextarea name="offlineMessage" label="Offline Message" rows={2} control={form.control} />
                    <FormTextarea name="errorMessage" label="Error Message" rows={2} control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Conversation Starters">
                    <FormToggleField name="showConversationStarters" label="Show Conversation Starters" control={form.control} />
                    <FormInput name="startersTitle" label="Section Title" control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Branding">
                    <FormToggleField name="showPoweredBy" label="Show Powered By" control={form.control} />
                    <FormInput name="poweredByText" label="Powered By Text" control={form.control} />
                  </CollapsibleSection>
                </TabsContent>

                {/* Responsive Tab */}
                <TabsContent value="responsive" className="p-4 space-y-4">
                  <CollapsibleSection title="Breakpoints" defaultOpen>
                    <FormNumberField name="mobileBreakpoint" label="Mobile Breakpoint" control={form.control} min={320} max={1024} suffix="px" description="Screen width below this is mobile" />
                    <FormNumberField name="tabletBreakpoint" label="Tablet Breakpoint" control={form.control} min={768} max={1440} suffix="px" description="Screen width below this is tablet" />
                  </CollapsibleSection>

                  <CollapsibleSection title="Mobile Settings">
                    <FormToggleField name="mobileFullScreen" label="Full Screen on Mobile" control={form.control} description="Chat window fills entire screen" />
                    <FormNumberField name="mobileFontSize" label="Mobile Font Size" control={form.control} min={12} max={20} suffix="px" />
                    <FormSelectField name="mobileLauncherSize" label="Mobile Launcher Size" control={form.control} options={[
                        { value: "small", label: "Small (48px)" },
                        { value: "medium", label: "Medium (56px)" },
                        { value: "large", label: "Large (64px)" },
                      ]} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Touch Optimization">
                    <FormToggleField name="enableTouchOptimizations" label="Enable Touch Optimizations" control={form.control} description="Larger touch targets for mobile" />
                  </CollapsibleSection>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="p-4 space-y-4">
                  <CollapsibleSection title="Theme" defaultOpen>
                    <FormSelectField name="theme" label="Color Theme" control={form.control} options={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                        { value: "auto", label: "Auto (System)" },
                      ]} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Animations">
                    <FormToggleField name="enableAnimations" label="Enable Animations" control={form.control} />
                    <FormNumberField name="animationDuration" label="Animation Duration" control={form.control} min={0} max={1000} step={50} suffix="ms" />
                  </CollapsibleSection>

                  <CollapsibleSection title="Accessibility">
                    <FormToggleField name="enableHighContrast" label="High Contrast Mode" control={form.control} />
                    <FormToggleField name="respectReducedMotion" label="Respect Reduced Motion" control={form.control} description="Disable animations for users who prefer reduced motion" />
                    <FormToggleField name="enableKeyboardNavigation" label="Keyboard Navigation" control={form.control} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Custom CSS">
                    <FormTextarea
                      name="customCss"
                      label="Custom Styles"
                      placeholder=".intelligentconvo-widget { /* your styles */ }"
                      rows={6}
                      description="Advanced: Add custom CSS to override widget styles"
                      control={form.control}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Analytics">
                    <FormToggleField name="enableAnalytics" label="Enable Analytics" control={form.control} description="Track widget usage and interactions" />
                  </CollapsibleSection>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <CodeBlock
              code={embedCode}
              language="html"
              title="Embed Code"
              showLanguageLabel={true}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Add this code to your website. The widget will automatically load your saved settings.
            </p>
          </div>
        </CardContent>
      </Card>
      </form>
    </Form>
  );
}
