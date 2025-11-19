"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, ExternalLink, Settings, Palette, MessageSquare, Layout, Zap, FileText, Smartphone, Sliders, Save, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetApiWidgetSiteIdSettingsAdmin,
  usePatchApiWidgetSiteIdSettings,
  usePutApiWidgetSiteIdSettingsReset,
  getGetApiWidgetSiteIdSettingsAdminQueryKey,
} from "@/lib/api/generated/queries/widget/widget";
import { type GetApiSitesSiteId200 } from "@/lib/api/generated/models";
import { useToast } from "@/hooks/use-toast";

interface WidgetTabProps {
  site: GetApiSitesSiteId200;
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
  shadowSize: string;

  // Launcher
  launcherIcon: string;
  launcherSize: string;
  launcherPosition: string;
  launcherOffsetX: number;
  launcherOffsetY: number;
  launcherShape: string;
  launcherBackgroundColor: string;
  launcherIconColor: string;
  launcherTooltip: string;
  launcherShowTooltip: boolean;
  launcherAnimation: string;
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
  mobileLauncherSize: string;
  enableTouchOptimizations: boolean;

  // Advanced
  enableAnimations: boolean;
  animationDuration: number;
  theme: string;
  enableHighContrast: boolean;
  respectReducedMotion: boolean;
  enableKeyboardNavigation: boolean;
  customCss: string;
  enableAnalytics: boolean;
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
};

// Collapsible Section Component
function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 text-left font-medium text-sm hover:bg-gray-50"
      >
        {title}
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );
}

// Color Picker Component
function ColorPicker({ label, value, onChange, description }: { label: string; value: string; onChange: (value: string) => void; description?: string }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
}

// Select Component
function SelectField({ label, value, onChange, options, description }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  description?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Number Input Component
function NumberField({ label, value, onChange, min, max, step = 1, description, suffix }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  suffix?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
      <div className="flex items-center gap-2 mt-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

// Toggle Component
function ToggleField({ label, checked, onChange, description }: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function WidgetTab({ site }: WidgetTabProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [settings, setSettings] = useState<WidgetSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load settings from API
  const { data: loadedSettings, isLoading } = useGetApiWidgetSiteIdSettingsAdmin(site.id);

  // Update local state when settings are loaded
  useEffect(() => {
    if (loadedSettings) {
      setSettings({ ...defaultSettings, ...loadedSettings as unknown as WidgetSettings });
    }
  }, [loadedSettings]);

  // Save settings mutation
  const saveMutation = usePatchApiWidgetSiteIdSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiWidgetSiteIdSettingsAdminQueryKey(site.id) });
        toast({
          title: "Settings saved",
          description: "Your widget settings have been updated successfully.",
        });
        setHasChanges(false);
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
  const resetMutation = usePutApiWidgetSiteIdSettingsReset({
    mutation: {
      onSuccess: (data) => {
        setSettings({ ...defaultSettings, ...data as unknown as WidgetSettings });
        setHasChanges(false);
        queryClient.invalidateQueries({ queryKey: getGetApiWidgetSiteIdSettingsAdminQueryKey(site.id) });
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

  // Update settings
  const updateSettings = useCallback((updates: Partial<WidgetSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Save settings
  const saveSettings = () => {
    saveMutation.mutate({ siteId: site.id, data: settings as any });
  };

  // Reset to defaults
  const resetSettings = () => {
    resetMutation.mutate({ siteId: site.id });
  };

  const isSaving = saveMutation.isPending;

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
        apiUrl: '${process.env.NEXT_PUBLIC_API_URL || 'https://api.intelligentconvo.com'}'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Widget Customization</h2>
          <p className="text-gray-600">Customize every aspect of your chat widget</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
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
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker
                        label="Primary Color"
                        value={settings.primaryColor}
                        onChange={(v) => updateSettings({ primaryColor: v })}
                        description="Main brand color"
                      />
                      <ColorPicker
                        label="Secondary Color"
                        value={settings.secondaryColor}
                        onChange={(v) => updateSettings({ secondaryColor: v })}
                        description="Accent color"
                      />
                      <ColorPicker
                        label="Background"
                        value={settings.backgroundColor}
                        onChange={(v) => updateSettings({ backgroundColor: v })}
                      />
                      <ColorPicker
                        label="Text Color"
                        value={settings.textColor}
                        onChange={(v) => updateSettings({ textColor: v })}
                      />
                      <ColorPicker
                        label="Secondary Text"
                        value={settings.textSecondaryColor}
                        onChange={(v) => updateSettings({ textSecondaryColor: v })}
                      />
                      <ColorPicker
                        label="Border Color"
                        value={settings.borderColor}
                        onChange={(v) => updateSettings({ borderColor: v })}
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Typography">
                    <SelectField
                      label="Font Family"
                      value={settings.fontFamily}
                      onChange={(v) => updateSettings({ fontFamily: v })}
                      options={[
                        { value: "system", label: "System Default" },
                        { value: "Inter, sans-serif", label: "Inter" },
                        { value: "Roboto, sans-serif", label: "Roboto" },
                        { value: "Open Sans, sans-serif", label: "Open Sans" },
                        { value: "Lato, sans-serif", label: "Lato" },
                      ]}
                    />
                    <NumberField
                      label="Font Size"
                      value={settings.fontSize}
                      onChange={(v) => updateSettings({ fontSize: v })}
                      min={10}
                      max={20}
                      suffix="px"
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Shape & Shadow">
                    <NumberField
                      label="Border Radius"
                      value={settings.borderRadius}
                      onChange={(v) => updateSettings({ borderRadius: v })}
                      min={0}
                      max={32}
                      suffix="px"
                    />
                    <SelectField
                      label="Shadow Size"
                      value={settings.shadowSize}
                      onChange={(v) => updateSettings({ shadowSize: v })}
                      options={[
                        { value: "none", label: "None" },
                        { value: "small", label: "Small" },
                        { value: "medium", label: "Medium" },
                        { value: "large", label: "Large" },
                      ]}
                    />
                  </CollapsibleSection>
                </TabsContent>

                {/* Launcher Tab */}
                <TabsContent value="launcher" className="p-4 space-y-4">
                  <CollapsibleSection title="Position & Size" defaultOpen>
                    <SelectField
                      label="Position"
                      value={settings.launcherPosition}
                      onChange={(v) => updateSettings({ launcherPosition: v })}
                      options={[
                        { value: "bottom-right", label: "Bottom Right" },
                        { value: "bottom-left", label: "Bottom Left" },
                        { value: "top-right", label: "Top Right" },
                        { value: "top-left", label: "Top Left" },
                      ]}
                    />
                    <SelectField
                      label="Size"
                      value={settings.launcherSize}
                      onChange={(v) => updateSettings({ launcherSize: v })}
                      options={[
                        { value: "small", label: "Small (48px)" },
                        { value: "medium", label: "Medium (56px)" },
                        { value: "large", label: "Large (64px)" },
                      ]}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField
                        label="Offset X"
                        value={settings.launcherOffsetX}
                        onChange={(v) => updateSettings({ launcherOffsetX: v })}
                        min={0}
                        max={100}
                        suffix="px"
                      />
                      <NumberField
                        label="Offset Y"
                        value={settings.launcherOffsetY}
                        onChange={(v) => updateSettings({ launcherOffsetY: v })}
                        min={0}
                        max={100}
                        suffix="px"
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Appearance">
                    <SelectField
                      label="Icon"
                      value={settings.launcherIcon}
                      onChange={(v) => updateSettings({ launcherIcon: v })}
                      options={[
                        { value: "chat", label: "Chat Bubble" },
                        { value: "message", label: "Message" },
                        { value: "help", label: "Help" },
                        { value: "support", label: "Support" },
                      ]}
                    />
                    <SelectField
                      label="Shape"
                      value={settings.launcherShape}
                      onChange={(v) => updateSettings({ launcherShape: v })}
                      options={[
                        { value: "circle", label: "Circle" },
                        { value: "rounded-square", label: "Rounded Square" },
                        { value: "square", label: "Square" },
                      ]}
                    />
                    <ColorPicker
                      label="Background Color"
                      value={settings.launcherBackgroundColor || settings.primaryColor}
                      onChange={(v) => updateSettings({ launcherBackgroundColor: v })}
                      description="Leave empty to use primary color"
                    />
                    <ColorPicker
                      label="Icon Color"
                      value={settings.launcherIconColor}
                      onChange={(v) => updateSettings({ launcherIconColor: v })}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Tooltip & Animation">
                    <ToggleField
                      label="Show Tooltip"
                      checked={settings.launcherShowTooltip}
                      onChange={(v) => updateSettings({ launcherShowTooltip: v })}
                    />
                    <div>
                      <Label className="text-sm">Tooltip Text</Label>
                      <Input
                        value={settings.launcherTooltip}
                        onChange={(e) => updateSettings({ launcherTooltip: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <SelectField
                      label="Animation"
                      value={settings.launcherAnimation}
                      onChange={(v) => updateSettings({ launcherAnimation: v })}
                      options={[
                        { value: "none", label: "None" },
                        { value: "pulse", label: "Pulse" },
                        { value: "bounce", label: "Bounce" },
                        { value: "shake", label: "Shake" },
                        { value: "glow", label: "Glow" },
                      ]}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Badge">
                    <ToggleField
                      label="Show Badge"
                      checked={settings.launcherShowBadge}
                      onChange={(v) => updateSettings({ launcherShowBadge: v })}
                      description="Show unread message count"
                    />
                    <ColorPicker
                      label="Badge Color"
                      value={settings.launcherBadgeColor}
                      onChange={(v) => updateSettings({ launcherBadgeColor: v })}
                    />
                  </CollapsibleSection>
                </TabsContent>

                {/* Window Tab */}
                <TabsContent value="window" className="p-4 space-y-4">
                  <CollapsibleSection title="Size" defaultOpen>
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField
                        label="Width"
                        value={settings.chatWindowWidth}
                        onChange={(v) => updateSettings({ chatWindowWidth: v })}
                        min={300}
                        max={600}
                        suffix="px"
                      />
                      <NumberField
                        label="Height"
                        value={settings.chatWindowHeight}
                        onChange={(v) => updateSettings({ chatWindowHeight: v })}
                        min={400}
                        max={800}
                        suffix="px"
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Header">
                    <div>
                      <Label className="text-sm">Title</Label>
                      <Input
                        value={settings.headerTitle}
                        onChange={(e) => updateSettings({ headerTitle: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Subtitle</Label>
                      <Input
                        value={settings.headerSubtitle}
                        onChange={(e) => updateSettings({ headerSubtitle: e.target.value })}
                        placeholder="Optional"
                        className="mt-1"
                      />
                    </div>
                    <ToggleField
                      label="Show Avatar"
                      checked={settings.headerShowAvatar}
                      onChange={(v) => updateSettings({ headerShowAvatar: v })}
                    />
                    <div>
                      <Label className="text-sm">Avatar URL</Label>
                      <Input
                        value={settings.headerAvatarUrl}
                        onChange={(e) => updateSettings({ headerAvatarUrl: e.target.value })}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                    <ToggleField
                      label="Show Connection Status"
                      checked={settings.headerShowStatus}
                      onChange={(v) => updateSettings({ headerShowStatus: v })}
                    />
                    <ToggleField
                      label="Show Close Button"
                      checked={settings.headerShowCloseButton}
                      onChange={(v) => updateSettings({ headerShowCloseButton: v })}
                    />
                    <ToggleField
                      label="Show Minimize Button"
                      checked={settings.headerShowMinimizeButton}
                      onChange={(v) => updateSettings({ headerShowMinimizeButton: v })}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Message Bubbles">
                    <div className="space-y-4">
                      <p className="text-sm font-medium">User Messages</p>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Background"
                          value={settings.userBubbleBackgroundColor || settings.primaryColor}
                          onChange={(v) => updateSettings({ userBubbleBackgroundColor: v })}
                        />
                        <ColorPicker
                          label="Text"
                          value={settings.userBubbleTextColor}
                          onChange={(v) => updateSettings({ userBubbleTextColor: v })}
                        />
                      </div>
                      <p className="text-sm font-medium">Assistant Messages</p>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Background"
                          value={settings.assistantBubbleBackgroundColor}
                          onChange={(v) => updateSettings({ assistantBubbleBackgroundColor: v })}
                        />
                        <ColorPicker
                          label="Text"
                          value={settings.assistantBubbleTextColor}
                          onChange={(v) => updateSettings({ assistantBubbleTextColor: v })}
                        />
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Input Area">
                    <div>
                      <Label className="text-sm">Placeholder Text</Label>
                      <Input
                        value={settings.inputPlaceholder}
                        onChange={(e) => updateSettings({ inputPlaceholder: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <NumberField
                      label="Border Radius"
                      value={settings.inputBorderRadius}
                      onChange={(v) => updateSettings({ inputBorderRadius: v })}
                      min={0}
                      max={32}
                      suffix="px"
                    />
                  </CollapsibleSection>
                </TabsContent>

                {/* Behavior Tab */}
                <TabsContent value="behavior" className="p-4 space-y-4">
                  <CollapsibleSection title="Auto-open" defaultOpen>
                    <ToggleField
                      label="Enable Auto-open"
                      checked={settings.autoOpenEnabled}
                      onChange={(v) => updateSettings({ autoOpenEnabled: v })}
                      description="Automatically open chat after delay"
                    />
                    <NumberField
                      label="Delay"
                      value={settings.autoOpenDelay}
                      onChange={(v) => updateSettings({ autoOpenDelay: v })}
                      min={0}
                      max={60000}
                      step={1000}
                      suffix="ms"
                    />
                    <ToggleField
                      label="Only Once Per Session"
                      checked={settings.autoOpenOnlyOnce}
                      onChange={(v) => updateSettings({ autoOpenOnlyOnce: v })}
                    />
                    <ToggleField
                      label="Auto-open on Mobile"
                      checked={settings.autoOpenOnMobile}
                      onChange={(v) => updateSettings({ autoOpenOnMobile: v })}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Features">
                    <ToggleField
                      label="Voice Input"
                      checked={settings.enableVoiceInput}
                      onChange={(v) => updateSettings({ enableVoiceInput: v })}
                      description="Enable microphone button"
                    />
                    <ToggleField
                      label="File Attachments"
                      checked={settings.enableFileAttachments}
                      onChange={(v) => updateSettings({ enableFileAttachments: v })}
                      description="Allow users to upload files"
                    />
                    <ToggleField
                      label="Emoji Picker"
                      checked={settings.enableEmojiPicker}
                      onChange={(v) => updateSettings({ enableEmojiPicker: v })}
                    />
                    <ToggleField
                      label="Quick Replies"
                      checked={settings.showQuickReplies}
                      onChange={(v) => updateSettings({ showQuickReplies: v })}
                      description="Show suggested responses"
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Notifications">
                    <ToggleField
                      label="Sound Notifications"
                      checked={settings.enableSoundNotifications}
                      onChange={(v) => updateSettings({ enableSoundNotifications: v })}
                      description="Play sound on new messages"
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Typing Indicator">
                    <ToggleField
                      label="Show Typing Indicator"
                      checked={settings.showTypingIndicator}
                      onChange={(v) => updateSettings({ showTypingIndicator: v })}
                    />
                    <div>
                      <Label className="text-sm">Typing Text</Label>
                      <Input
                        value={settings.typingIndicatorText}
                        onChange={(e) => updateSettings({ typingIndicatorText: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Persistence">
                    <ToggleField
                      label="Persist Conversation"
                      checked={settings.persistConversation}
                      onChange={(v) => updateSettings({ persistConversation: v })}
                      description="Remember chat history between sessions"
                    />
                  </CollapsibleSection>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="p-4 space-y-4">
                  <CollapsibleSection title="Bot Identity" defaultOpen>
                    <div>
                      <Label className="text-sm">Bot Name</Label>
                      <Input
                        value={settings.botName}
                        onChange={(e) => updateSettings({ botName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Messages">
                    <div>
                      <Label className="text-sm">Welcome Message</Label>
                      <Textarea
                        value={settings.welcomeMessage}
                        onChange={(e) => updateSettings({ welcomeMessage: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Offline Message</Label>
                      <Textarea
                        value={settings.offlineMessage}
                        onChange={(e) => updateSettings({ offlineMessage: e.target.value })}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Error Message</Label>
                      <Textarea
                        value={settings.errorMessage}
                        onChange={(e) => updateSettings({ errorMessage: e.target.value })}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Conversation Starters">
                    <ToggleField
                      label="Show Conversation Starters"
                      checked={settings.showConversationStarters}
                      onChange={(v) => updateSettings({ showConversationStarters: v })}
                    />
                    <div>
                      <Label className="text-sm">Section Title</Label>
                      <Input
                        value={settings.startersTitle}
                        onChange={(e) => updateSettings({ startersTitle: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Branding">
                    <ToggleField
                      label="Show Powered By"
                      checked={settings.showPoweredBy}
                      onChange={(v) => updateSettings({ showPoweredBy: v })}
                    />
                    <div>
                      <Label className="text-sm">Powered By Text</Label>
                      <Input
                        value={settings.poweredByText}
                        onChange={(e) => updateSettings({ poweredByText: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </CollapsibleSection>
                </TabsContent>

                {/* Responsive Tab */}
                <TabsContent value="responsive" className="p-4 space-y-4">
                  <CollapsibleSection title="Breakpoints" defaultOpen>
                    <NumberField
                      label="Mobile Breakpoint"
                      value={settings.mobileBreakpoint}
                      onChange={(v) => updateSettings({ mobileBreakpoint: v })}
                      min={320}
                      max={1024}
                      suffix="px"
                      description="Screen width below this is mobile"
                    />
                    <NumberField
                      label="Tablet Breakpoint"
                      value={settings.tabletBreakpoint}
                      onChange={(v) => updateSettings({ tabletBreakpoint: v })}
                      min={768}
                      max={1440}
                      suffix="px"
                      description="Screen width below this is tablet"
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Mobile Settings">
                    <ToggleField
                      label="Full Screen on Mobile"
                      checked={settings.mobileFullScreen}
                      onChange={(v) => updateSettings({ mobileFullScreen: v })}
                      description="Chat window fills entire screen"
                    />
                    <NumberField
                      label="Mobile Font Size"
                      value={settings.mobileFontSize}
                      onChange={(v) => updateSettings({ mobileFontSize: v })}
                      min={12}
                      max={20}
                      suffix="px"
                    />
                    <SelectField
                      label="Mobile Launcher Size"
                      value={settings.mobileLauncherSize}
                      onChange={(v) => updateSettings({ mobileLauncherSize: v })}
                      options={[
                        { value: "small", label: "Small (48px)" },
                        { value: "medium", label: "Medium (56px)" },
                        { value: "large", label: "Large (64px)" },
                      ]}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Touch Optimization">
                    <ToggleField
                      label="Enable Touch Optimizations"
                      checked={settings.enableTouchOptimizations}
                      onChange={(v) => updateSettings({ enableTouchOptimizations: v })}
                      description="Larger touch targets for mobile"
                    />
                  </CollapsibleSection>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="p-4 space-y-4">
                  <CollapsibleSection title="Theme" defaultOpen>
                    <SelectField
                      label="Color Theme"
                      value={settings.theme}
                      onChange={(v) => updateSettings({ theme: v })}
                      options={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                        { value: "auto", label: "Auto (System)" },
                      ]}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Animations">
                    <ToggleField
                      label="Enable Animations"
                      checked={settings.enableAnimations}
                      onChange={(v) => updateSettings({ enableAnimations: v })}
                    />
                    <NumberField
                      label="Animation Duration"
                      value={settings.animationDuration}
                      onChange={(v) => updateSettings({ animationDuration: v })}
                      min={0}
                      max={1000}
                      step={50}
                      suffix="ms"
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Accessibility">
                    <ToggleField
                      label="High Contrast Mode"
                      checked={settings.enableHighContrast}
                      onChange={(v) => updateSettings({ enableHighContrast: v })}
                    />
                    <ToggleField
                      label="Respect Reduced Motion"
                      checked={settings.respectReducedMotion}
                      onChange={(v) => updateSettings({ respectReducedMotion: v })}
                      description="Disable animations for users who prefer reduced motion"
                    />
                    <ToggleField
                      label="Keyboard Navigation"
                      checked={settings.enableKeyboardNavigation}
                      onChange={(v) => updateSettings({ enableKeyboardNavigation: v })}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="Custom CSS">
                    <div>
                      <Label className="text-sm">Custom Styles</Label>
                      <Textarea
                        value={settings.customCss}
                        onChange={(e) => updateSettings({ customCss: e.target.value })}
                        placeholder=".intelligentconvo-widget { /* your styles */ }"
                        className="mt-1 font-mono text-sm"
                        rows={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">Advanced: Add custom CSS to override widget styles</p>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Analytics">
                    <ToggleField
                      label="Enable Analytics"
                      checked={settings.enableAnalytics}
                      onChange={(v) => updateSettings({ enableAnalytics: v })}
                      description="Track widget usage and interactions"
                    />
                  </CollapsibleSection>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-sm">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="relative bg-gray-100 rounded-lg overflow-hidden"
                style={{ height: "500px" }}
              >
                {/* Preview Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500 text-sm">
                    <p className="mb-2">Widget Preview</p>
                    <p className="text-xs">Changes reflect in real-time</p>
                  </div>
                </div>

                {/* Simulated Chat Window */}
                <div
                  className="absolute shadow-lg rounded-lg overflow-hidden"
                  style={{
                    width: `${Math.min(settings.chatWindowWidth * 0.6, 240)}px`,
                    height: `${Math.min(settings.chatWindowHeight * 0.6, 360)}px`,
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: settings.backgroundColor,
                    borderRadius: `${settings.borderRadius}px`,
                  }}
                >
                  {/* Header */}
                  <div
                    className="p-3 text-white"
                    style={{
                      backgroundColor: settings.primaryColor,
                      borderTopLeftRadius: `${settings.borderRadius}px`,
                      borderTopRightRadius: `${settings.borderRadius}px`,
                    }}
                  >
                    <div className="text-sm font-medium">{settings.headerTitle}</div>
                    {settings.headerSubtitle && (
                      <div className="text-xs opacity-80">{settings.headerSubtitle}</div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="p-3 space-y-2 flex-1" style={{ fontSize: `${settings.fontSize * 0.8}px` }}>
                    {/* Welcome message */}
                    <div
                      className="p-2 rounded-lg max-w-[80%]"
                      style={{
                        backgroundColor: settings.assistantBubbleBackgroundColor,
                        color: settings.assistantBubbleTextColor,
                      }}
                    >
                      {settings.welcomeMessage.substring(0, 50)}...
                    </div>

                    {/* User message */}
                    <div
                      className="p-2 rounded-lg max-w-[80%] ml-auto"
                      style={{
                        backgroundColor: settings.userBubbleBackgroundColor || settings.primaryColor,
                        color: settings.userBubbleTextColor,
                      }}
                    >
                      Hello!
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-2 border-t" style={{ borderColor: settings.borderColor }}>
                    <div
                      className="px-3 py-2 text-xs bg-gray-100 rounded-full"
                      style={{
                        borderRadius: `${settings.inputBorderRadius}px`,
                        color: settings.textSecondaryColor,
                      }}
                    >
                      {settings.inputPlaceholder}
                    </div>
                  </div>
                </div>

                {/* Launcher Button */}
                <div
                  className={`absolute flex items-center justify-center cursor-pointer ${
                    settings.launcherPosition.includes('bottom') ? 'bottom-4' : 'top-4'
                  } ${
                    settings.launcherPosition.includes('right') ? 'right-4' : 'left-4'
                  }`}
                  style={{
                    width: settings.launcherSize === 'small' ? '32px' : settings.launcherSize === 'large' ? '42px' : '36px',
                    height: settings.launcherSize === 'small' ? '32px' : settings.launcherSize === 'large' ? '42px' : '36px',
                    backgroundColor: settings.launcherBackgroundColor || settings.primaryColor,
                    color: settings.launcherIconColor,
                    borderRadius: settings.launcherShape === 'circle' ? '50%' : settings.launcherShape === 'rounded-square' ? '8px' : '0',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Embed Code</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(embedCode, 'html')}
              >
                {copied === 'html' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied === 'html' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
            <p className="text-sm text-gray-600 mt-2">
              Add this code to your website. The widget will automatically load your saved settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
