/**
 * Navigation utility functions
 */

export interface BackLinkConfig {
  href: string;
  text: string;
}

/**
 * Get back link configuration based on context
 */
export function getBackLinkConfig(options: {
  siteId?: string | null;
  siteName?: string | null;
  returnTo?: string | null;
  isAdmin?: boolean;
}): BackLinkConfig {
  const { siteId, siteName, returnTo, isAdmin } = options;

  // If returnTo is provided and is a valid path, use it
  if (returnTo && returnTo.startsWith("/")) {
    // Determine the text based on the returnTo path
    if (returnTo.startsWith("/sites/")) {
      return {
        href: returnTo,
        text: "Back to Site",
      };
    }
    if (returnTo.startsWith("/admin")) {
      return {
        href: returnTo,
        text: "Back to Admin Portal",
      };
    }
    return {
      href: returnTo,
      text: "Back to Dashboard",
    };
  }

  if (siteId) {
    return {
      href: `/sites/${siteId}`,
      text: `Back to ${siteName || "Site"}`,
    };
  }

  if (isAdmin) {
    return {
      href: "/admin",
      text: "Back to Admin Portal",
    };
  }

  return {
    href: "/dashboard",
    text: "Back to Dashboard",
  };
}
