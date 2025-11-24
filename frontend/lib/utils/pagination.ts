/**
 * Pagination utility functions
 */

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

/**
 * Get pagination display text
 * e.g., "Showing 1 to 20 of 100 items"
 */
export function getPaginationText(
  pagination: PaginationInfo,
  itemName: string = "items"
): string {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  return `Showing ${start} to ${end} of ${pagination.total} ${itemName}`;
}

/**
 * Calculate pagination range
 */
export function getPaginationRange(pagination: PaginationInfo): {
  start: number;
  end: number;
  total: number;
} {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  return { start, end, total: pagination.total };
}
