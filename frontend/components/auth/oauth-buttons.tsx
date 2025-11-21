import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";
import { GithubIcon } from "@/components/icons/github-icon";

interface OAuthButtonsProps {
  onProviderClick: (provider: "google" | "github") => void;
  disabled?: boolean;
  separatorText?: string;
}

export function OAuthButtons({
  onProviderClick,
  disabled = false,
  separatorText = "Or continue with",
}: OAuthButtonsProps) {
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
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onProviderClick("google")}
          disabled={disabled}
        >
          <GoogleIcon className="w-4 h-4 mr-2" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onProviderClick("github")}
          disabled={disabled}
        >
          <GithubIcon className="w-4 h-4 mr-2" />
          GitHub
        </Button>
      </div>
    </>
  );
}
