/**
 * Widget Logo API
 * Custom API functions for uploading and managing widget launcher logos
 */

import { AXIOS_INSTANCE } from './axios-instance';

export interface LogoUploadResponse {
  success: boolean;
  logoUrl: string;
  message: string;
}

export interface LogoDeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Upload a custom launcher logo for a site
 * @param siteId - Site ID
 * @param file - Logo image file
 * @returns Upload response with logo URL
 */
export async function uploadWidgetLogo(
  siteId: string,
  file: File
): Promise<LogoUploadResponse> {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await AXIOS_INSTANCE.post<LogoUploadResponse>(
    `/widget/${siteId}/logo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Delete the custom launcher logo for a site
 * @param siteId - Site ID
 * @returns Delete response
 */
export async function deleteWidgetLogo(siteId: string): Promise<LogoDeleteResponse> {
  const response = await AXIOS_INSTANCE.delete<LogoDeleteResponse>(
    `/widget/${siteId}/logo`
  );

  return response.data;
}
