export interface BillingInfoUser {
  id: string;
  email: string;
  fullName: string | null;
}

export interface BillingInfo {
  id: string;
  fullName: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  user: BillingInfoUser;
}

export interface BillingInfoPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BillingInfoResponse {
  data: {
    billingInfos: BillingInfo[];
    pagination: BillingInfoPagination;
  };
}
