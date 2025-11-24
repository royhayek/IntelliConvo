export const EMAIL_TYPE_LABELS: Record<string, string> = {
  WELCOME: "Welcome",
  EMAIL_VERIFICATION: "Email Verification",
  PASSWORD_RESET: "Password Reset",
  SUBSCRIPTION_ACTIVATED: "Subscription Activated",
  TRIAL_EXPIRING: "Trial Expiring",
  TRIAL_EXPIRED: "Trial Expired",
  PAYMENT_FAILED: "Payment Failed",
  PAYMENT_RECEIPT: "Payment Receipt",
  SITE_READY: "Site Ready",
  SUBSCRIPTION_CANCELLED: "Subscription Cancelled",
};

export const EMAIL_TYPE_COLORS: Record<string, string> = {
  WELCOME: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  EMAIL_VERIFICATION: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PASSWORD_RESET: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  SUBSCRIPTION_ACTIVATED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TRIAL_EXPIRING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  TRIAL_EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PAYMENT_FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PAYMENT_RECEIPT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  SITE_READY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  SUBSCRIPTION_CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export const EMAIL_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  QUEUED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  BOUNCED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};
