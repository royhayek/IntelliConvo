import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "lucide-react";

interface WidgetSettings {
  // Appearance
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  borderRadius: number;
  shadowSize: string;
  fontFamily: string;
  fontSize: number;
  theme: string;

  // Dark Mode Colors
  darkModePrimaryColor: string;
  darkModeSecondaryColor: string;
  darkModeBackgroundColor: string;
  darkModeSecondaryBackgroundColor: string;
  darkModeTextColor: string;
  darkModeTextSecondaryColor: string;
  darkModeBorderColor: string;

  // Chat Window
  chatWindowWidth: number;
  chatWindowHeight: number;

  // Header
  headerTitle: string;
  headerSubtitle?: string;
  headerShowAvatar: boolean;
  headerAvatarUrl?: string;
  headerShowStatus: boolean;
  headerShowMinimizeButton: boolean;
  headerShowCloseButton: boolean;

  // Messages
  userBubbleBackgroundColor?: string;
  userBubbleTextColor: string;
  assistantBubbleBackgroundColor: string;
  assistantBubbleTextColor: string;
  showTypingIndicator: boolean;

  // Input
  inputPlaceholder: string;
  inputBorderRadius: number;
  enableFileAttachments: boolean;
  enableEmojiPicker: boolean;
  enableVoiceInput: boolean;

  // Launcher
  launcherPosition: string;
  launcherSize: string;
  launcherShape: string;
  launcherBackgroundColor?: string;
  launcherIconColor: string;
  launcherIcon: string;
  launcherCustomIconUrl?: string;
  launcherAnimation: string;
  launcherShowBadge: boolean;
  launcherBadgeColor: string;
  launcherShowTooltip: boolean;
  launcherTooltip: string;

  // Footer
  showPoweredBy: boolean;
  poweredByText: string;
}

interface WidgetPreviewProps {
  settings: WidgetSettings;
}

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden"
          style={{ height: "500px" }}
        >
          {/* Chat Window Preview - Exact CSS match at 0.6x scale */}
          <div
            className="absolute overflow-hidden flex flex-col"
            style={{
              width: `${Math.min(settings.chatWindowWidth * 0.6, 240)}px`,
              height: `${Math.min(settings.chatWindowHeight * 0.6, 360)}px`,
              ...(settings.launcherPosition.includes("bottom")
                ? { bottom: "60px" }
                : { top: "12px" }),
              ...(settings.launcherPosition.includes("right")
                ? { right: "12px" }
                : { left: "12px" }),
              backgroundColor:
                settings.theme === "dark"
                  ? settings.darkModeBackgroundColor
                  : settings.backgroundColor,
              borderRadius: `${settings.borderRadius}px`,
              boxShadow:
                settings.shadowSize === "none"
                  ? "none"
                  : settings.shadowSize === "small"
                  ? "0 4px 6px -1px rgba(0,0,0,0.1)"
                  : settings.shadowSize === "large"
                  ? "0 25px 50px -12px rgba(0,0,0,0.25)"
                  : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
              fontFamily:
                settings.fontFamily === "system"
                  ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
                  : settings.fontFamily,
              fontSize: `${settings.fontSize * 0.6}px`,
            }}
          >
            {/* Header */}
            <div
              className="shrink-0"
              style={{
                backgroundColor:
                  settings.theme === "dark"
                    ? settings.darkModePrimaryColor
                    : settings.primaryColor,
                borderTopLeftRadius: `${settings.borderRadius}px`,
                borderTopRightRadius: `${settings.borderRadius}px`,
                padding: "10px 12px",
                color: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "7px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "7px" }}
                >
                  {settings.headerShowAvatar && (
                    <div
                      style={{
                        position: "relative",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "8px",
                        fontWeight: 600,
                        overflow: "visible",
                      }}
                    >
                      {settings.headerAvatarUrl ? (
                        <img
                          src={settings.headerAvatarUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        "AI"
                      )}
                      {settings.headerShowStatus && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            backgroundColor: "#22c55e",
                            border: `1px solid ${settings.primaryColor}`,
                          }}
                        />
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        margin: 0,
                      }}
                    >
                      {settings.headerTitle}
                    </span>
                    {settings.headerSubtitle && (
                      <span
                        style={{
                          fontSize: "7px",
                          opacity: 0.8,
                          fontWeight: 400,
                        }}
                      >
                        {settings.headerSubtitle}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  {settings.headerShowMinimizeButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 hover:bg-transparent"
                      style={{
                        width: "19px",
                        height: "19px",
                        borderRadius: "5px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "inherit",
                        fontSize: "14px",
                        lineHeight: 1,
                        minWidth: "19px",
                      }}
                    >
                      −
                    </Button>
                  )}
                  {settings.headerShowCloseButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 hover:bg-transparent"
                      style={{
                        width: "19px",
                        height: "19px",
                        borderRadius: "5px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "inherit",
                        fontSize: "12px",
                        minWidth: "19px",
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                <Button
                 type="button"
                  variant="ghost"
                  className="h-auto hover:bg-transparent"
                  style={{
                    padding: "2px 10px",
                    borderRadius: "5px",
                    fontSize: "8px",
                    fontWeight: 500,
                    backgroundColor:
                      settings.theme === "dark"
                        ? settings.darkModeBackgroundColor
                        : "white",
                    color:
                      settings.theme === "dark"
                        ? settings.darkModePrimaryColor
                        : settings.primaryColor,
                  }}
                >
                  Chat
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto hover:bg-transparent"
                  style={{
                    padding: "2px 10px",
                    borderRadius: "5px",
                    fontSize: "8px",
                    fontWeight: 500,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  Speak
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "10px",
                overflow: "hidden",
                backgroundColor:
                  settings.theme === "dark"
                    ? settings.darkModeSecondaryBackgroundColor
                    : "#f8fafc",
              }}
            >
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}>
                {/* Assistant message */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "19px",
                      height: "19px",
                      borderRadius: "50%",
                      backgroundColor: settings.secondaryColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "7px",
                      fontWeight: 600,
                      color: settings.primaryColor,
                      flexShrink: 0,
                    }}
                  >
                    AI
                  </div>
                  <div
                    style={{
                      padding: "7px 10px",
                      borderRadius: `${
                        Math.min(settings.borderRadius - 4, 12) * 0.6
                      }px`,
                      borderBottomLeftRadius: "2px",
                      backgroundColor: settings.assistantBubbleBackgroundColor,
                      color: settings.assistantBubbleTextColor,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      maxWidth: "85%",
                      lineHeight: 1.5,
                      fontSize: "8px",
                    }}
                  >
                    Hi! How can I help?
                  </div>
                </div>

                {/* User message */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      padding: "7px 10px",
                      borderRadius: `${
                        Math.min(settings.borderRadius - 4, 12) * 0.6
                      }px`,
                      borderBottomRightRadius: "2px",
                      backgroundColor:
                        settings.userBubbleBackgroundColor ||
                        settings.primaryColor,
                      color: settings.userBubbleTextColor,
                      maxWidth: "85%",
                      lineHeight: 1.5,
                      fontSize: "8px",
                    }}
                  >
                    Hello!
                  </div>
                </div>

                {/* Typing Indicator */}
                {settings.showTypingIndicator && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "19px",
                        height: "19px",
                        borderRadius: "50%",
                        backgroundColor: settings.secondaryColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "7px",
                        fontWeight: 600,
                        color: settings.primaryColor,
                        flexShrink: 0,
                      }}
                    >
                      AI
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "7px 10px",
                        backgroundColor:
                          settings.assistantBubbleBackgroundColor,
                        borderRadius: `${
                          Math.min(settings.borderRadius - 4, 12) * 0.6
                        }px`,
                        borderBottomLeftRadius: "2px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ display: "flex", gap: "2px" }}>
                        <span
                          className="animate-bounce"
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            backgroundColor:
                              settings.theme === "dark"
                                ? settings.darkModePrimaryColor
                                : settings.primaryColor,
                            animationDelay: "-0.32s",
                            animationDuration: "1.4s",
                          }}
                        />
                        <span
                          className="animate-bounce"
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            backgroundColor:
                              settings.theme === "dark"
                                ? settings.darkModePrimaryColor
                                : settings.primaryColor,
                            animationDelay: "-0.16s",
                            animationDuration: "1.4s",
                          }}
                        />
                        <span
                          className="animate-bounce"
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            backgroundColor:
                              settings.theme === "dark"
                                ? settings.darkModePrimaryColor
                                : settings.primaryColor,
                            animationDelay: "0s",
                            animationDuration: "1.4s",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                gap: "5px",
                padding: "10px",
                backgroundColor:
                  settings.theme === "dark"
                    ? settings.darkModeBackgroundColor
                    : settings.backgroundColor,
                borderTop: `1px solid ${
                  settings.theme === "dark"
                    ? settings.darkModeBorderColor
                    : settings.borderColor
                }`,
              }}
            >
              <Input
                type="text"
                readOnly
                placeholder={settings.inputPlaceholder}
                className="flex-1"
                style={{
                  border: `1px solid ${
                    settings.theme === "dark"
                      ? settings.darkModeTextSecondaryColor
                      : settings.borderColor
                  }`,
                  borderRadius: `${settings.inputBorderRadius * 0.6}px`,
                  padding: "7px 10px",
                  fontSize: "8px",
                  backgroundColor:
                    settings.theme === "dark"
                      ? settings.darkModeSecondaryBackgroundColor
                      : "#f8fafc",
                  color:
                    settings.theme === "dark"
                      ? settings.darkModeTextColor
                      : settings.textSecondaryColor,
                  minHeight: "26px",
                  height: "26px",
                }}
              />
              {settings.enableFileAttachments && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-0 hover:bg-transparent shrink-0"
                  style={{
                    width: "26px",
                    height: "26px",
                    minWidth: "26px",
                    borderRadius: `${
                      Math.min(settings.borderRadius - 4, 12) * 0.6
                    }px`,
                    backgroundColor:
                      settings.theme === "dark"
                        ? settings.darkModeBackgroundColor
                        : "#f8fafc",
                    color:
                      settings.theme === "dark"
                        ? settings.darkModeTextSecondaryColor
                        : settings.textSecondaryColor,
                    fontSize: "11px",
                  }}
                >
                  📎
                </Button>
              )}
              {settings.enableEmojiPicker && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-0 hover:bg-transparent shrink-0"
                  style={{
                    width: "26px",
                    height: "26px",
                    minWidth: "26px",
                    borderRadius: `${
                      Math.min(settings.borderRadius - 4, 12) * 0.6
                    }px`,
                    backgroundColor:
                      settings.theme === "dark"
                        ? settings.darkModeBackgroundColor
                        : "#f8fafc",
                    color:
                      settings.theme === "dark"
                        ? settings.darkModeTextSecondaryColor
                        : settings.textSecondaryColor,
                    fontSize: "11px",
                  }}
                >
                  😊
                </Button>
              )}
              {settings.enableVoiceInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-0 hover:bg-transparent shrink-0"
                  style={{
                    width: "26px",
                    height: "26px",
                    minWidth: "26px",
                    borderRadius: `${
                      Math.min(settings.borderRadius - 4, 12) * 0.6
                    }px`,
                    backgroundColor:
                      settings.theme === "dark"
                        ? settings.darkModeBackgroundColor
                        : "#f8fafc",
                    color:
                      settings.theme === "dark"
                        ? settings.darkModeTextSecondaryColor
                        : settings.textSecondaryColor,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" />
                    <path d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z" />
                  </svg>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="p-0 hover:bg-transparent shrink-0"
                style={{
                  width: "26px",
                  height: "26px",
                  minWidth: "26px",
                  borderRadius: "50%",
                  backgroundColor:
                    settings.theme === "dark"
                      ? settings.darkModePrimaryColor
                      : settings.primaryColor,
                  color: "white",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" />
                </svg>
              </Button>
            </div>

            {/* Powered By */}
            {settings.showPoweredBy && (
              <div
                style={{
                  flexShrink: 0,
                  padding: "5px 10px",
                  textAlign: "center",
                  backgroundColor:
                    settings.theme === "dark"
                      ? settings.darkModeBackgroundColor
                      : settings.backgroundColor,
                  borderTop: `1px solid ${
                    settings.theme === "dark"
                      ? settings.darkModeBorderColor
                      : settings.borderColor
                  }`,
                }}
              >
                <span
                  style={{
                    fontSize: "7px",
                    color:
                      settings.theme === "dark"
                        ? settings.darkModeTextSecondaryColor
                        : settings.textSecondaryColor,
                    fontWeight: 400,
                  }}
                >
                  {settings.poweredByText}
                </span>
              </div>
            )}
          </div>

          {/* Launcher Button */}
          <style>
            {`
              @keyframes launcherPulse {
                0%, 100% { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 0 0 0 rgba(99, 102, 241, 0.4); }
                50% { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 0 0 8px rgba(99, 102, 241, 0); }
              }
              @keyframes launcherBounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-6px); }
                60% { transform: translateY(-3px); }
              }
              @keyframes launcherShake {
                0%, 100% { transform: rotate(0deg); }
                10%, 30% { transform: rotate(-5deg); }
                20%, 40% { transform: rotate(5deg); }
                50% { transform: rotate(0deg); }
              }
              @keyframes launcherGlow {
                0%, 100% { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 0 5px ${settings.primaryColor}; }
                50% { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 0 15px ${settings.primaryColor}; }
              }
              .preview-launcher-btn {
                transition: all 200ms ease-out;
              }
              .preview-launcher-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 0 rgba(99, 102, 241, 0.4);
                filter: brightness(0.9);
              }
              .preview-launcher-btn:active {
                transform: scale(0.95);
              }
            `}
          </style>
          <div
            className={`preview-launcher-btn absolute flex items-center justify-center cursor-pointer ${
              settings.launcherPosition.includes("bottom")
                ? "bottom-3"
                : "top-3"
            } ${
              settings.launcherPosition.includes("right") ? "right-3" : "left-3"
            }`}
            style={{
              width:
                settings.launcherSize === "small"
                  ? "29px"
                  : settings.launcherSize === "large"
                  ? "38px"
                  : "34px",
              height:
                settings.launcherSize === "small"
                  ? "29px"
                  : settings.launcherSize === "large"
                  ? "38px"
                  : "34px",
              backgroundColor:
                settings.launcherBackgroundColor ||
                (settings.theme === "dark"
                  ? settings.darkModePrimaryColor
                  : settings.primaryColor),
              color: settings.launcherIconColor,
              borderRadius:
                settings.launcherShape === "circle"
                  ? "50%"
                  : settings.launcherShape === "rounded-square"
                  ? `${settings.borderRadius * 0.6}px`
                  : "0",
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.1), 0 0 0 0 rgba(99,102,241,0.4)",
              animation:
                settings.launcherAnimation === "pulse"
                  ? "launcherPulse 2s infinite"
                  : settings.launcherAnimation === "bounce"
                  ? "launcherBounce 2s infinite"
                  : settings.launcherAnimation === "shake"
                  ? "launcherShake 2s infinite"
                  : "none",
              overflow: "hidden",
              padding: 0,
            }}
          >
            {settings.launcherCustomIconUrl ? (
              <img
                src={
                  settings.launcherCustomIconUrl.startsWith("http")
                    ? settings.launcherCustomIconUrl
                    : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}${settings.launcherCustomIconUrl}`
                }
                alt="Chat"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "inherit",
                }}
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                {settings.launcherIcon === "message" ? (
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
                ) : settings.launcherIcon === "help" ? (
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7S10 7.9 10 9H8C8 6.79 9.79 5 12 5S16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z" />
                ) : settings.launcherIcon === "support" ? (
                  <path d="M12 1C5.9 1 1 5.9 1 12S5.9 23 12 23 23 18.1 23 12 18.1 1 12 1ZM12 21C7 21 3 17 3 12S7 3 12 3 21 7 21 12 17 21 12 21ZM12 11C10.3 11 9 9.7 9 8S10.3 5 12 5 15 6.3 15 8 13.7 11 12 11ZM12 13C14.7 13 20 14.3 20 17V19H4V17C4 14.3 9.3 13 12 13Z" />
                ) : (
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" />
                )}
              </svg>
            )}
            {settings.launcherShowBadge && (
              <div
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  minWidth: "11px",
                  height: "11px",
                  padding: "0 2px",
                  borderRadius: "5px",
                  fontSize: "7px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: settings.launcherBadgeColor,
                  color: "white",
                }}
              >
                1
              </div>
            )}
          </div>

          {/* Tooltip */}
          {settings.launcherShowTooltip && (
            <div
              className={`absolute ${
                settings.launcherPosition.includes("bottom")
                  ? "bottom-3"
                  : "top-3"
              } ${
                settings.launcherPosition.includes("right")
                  ? "right-14"
                  : "left-14"
              }`}
              style={{
                fontSize: "8px",
                fontWeight: 500,
                padding: "5px 7px",
                borderRadius: `${
                  Math.min(settings.borderRadius - 4, 12) * 0.6
                }px`,
                backgroundColor:
                  settings.theme === "dark"
                    ? settings.darkModeBackgroundColor
                    : settings.backgroundColor,
                color:
                  settings.theme === "dark"
                    ? settings.darkModeTextColor
                    : settings.textColor,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                whiteSpace: "nowrap",
              }}
            >
              {settings.launcherTooltip}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
