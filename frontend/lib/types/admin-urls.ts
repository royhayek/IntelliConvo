import type { AdminUrl } from "@/lib/api/generated/models";

export interface SiteUrlExtended extends AdminUrl {
  embeddingStatus: string;
  embeddingsCount: number;
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
    user: {
      id: string;
      email: string;
      fullName: string | null;
    };
  };
}
