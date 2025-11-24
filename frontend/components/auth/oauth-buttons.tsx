import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";
import { GithubIcon } from "@/components/icons/github-icon";

export type AuthProvider = "google" | "github" | "microsoft";

interface OAuthButtonsProps {
  onProviderClick: (provider: AuthProvider) => void;
  enabledProviders?: string[];
  disabled?: boolean;
  separatorText?: string;
}

// Provider configuration
const providerConfig: Record<AuthProvider, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  google: { icon: GoogleIcon, label: "Google" },
  github: { icon: GithubIcon, label: "GitHub" },
  microsoft: { icon: GithubIcon, label: "Microsoft" }, // TODO: Add Microsoft icon
};

export function OAuthButtons({
  onProviderClick,
  enabledProviders = [],
  disabled = false,
  separatorText = "Or continue with",
}: OAuthButtonsProps) {
  // Filter to only show OAuth providers (not email)
  const oauthProviders = enabledProviders.filter(
    (p): p is AuthProvider => p !== "email" && p in providerConfig
  );

  // If no OAuth providers are enabled, don't render anything
  if (oauthProviders.length === 0) {
    return null;
  }

  return (
    <>
      {/* Separator */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
            {separatorText}
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className={`grid gap-3 ${oauthProviders.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {oauthProviders.map((provider) => {
          const config = providerConfig[provider];
          const Icon = config.icon;
          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              onClick={() => onProviderClick(provider)}
              disabled={disabled}
            >
              <Icon className="w-4 h-4 mr-2" />
              {config.label}
            </Button>
          );
        })}
      </div>
    </>
  );
}
