export const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  VIEW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  FORCE_LOGOUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  EXTEND_TRIAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RECRAWL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  REPROCESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  CLEANUP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  EXPORT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  BULK_UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  BULK_DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  USER: "User",
  SITE: "Site",
  URL: "URL",
  EMBEDDING: "Embedding",
  FILE: "File",
  CONVERSATION: "Conversation",
  MESSAGE: "Message",
  SUBSCRIPTION: "Subscription",
  TRANSACTION: "Transaction",
  SESSION: "Session",
  WIDGET: "Widget",
  BILLING_INFO: "Billing Info",
};

export function getEntityLink(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null;
  const linkMap: Record<string, string> = {
    USER: `/admin/users/${entityId}`,
    SITE: `/admin/sites/${entityId}`,
    SUBSCRIPTION: `/admin/subscriptions`,
    CONVERSATION: `/admin/conversations/${entityId}`,
  };
  return linkMap[entityType] || null;
}
